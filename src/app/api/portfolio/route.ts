import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { calculateTradeCashFlow, calculateNewCostBasis, calculateRealizedPnL, calculateUnrealizedPnL } from '@/lib/finance';
import { Transaction } from '@/types';

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      data: {
        summary: db.portfolios,
        holdings: db.holdings,
        transactions: db.transactions,
        cashMovements: db.cash_movements,
        chartHistory: db.holdings_snapshots,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi đọc dữ liệu danh mục', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, symbol, shares, price, notes, type } = body;
    const db = getDatabase();

    if (action === 'TRADE') {
      const numShares = Number(shares);
      const numPrice = Number(price);

      if (numShares <= 0 || numPrice <= 0) {
        return NextResponse.json({ success: false, message: 'Số lượng và giá phải lớn hơn 0' }, { status: 400 });
      }

      const feeRate = db.app_settings.defaultFeeRate || 0.0015;
      const taxRate = db.app_settings.defaultTaxRate || 0.0010;
      const cashFlow = calculateTradeCashFlow(type, numShares, numPrice, feeRate, taxRate);

      if (type === 'BUY') {
        const totalCost = Math.abs(cashFlow.netCashFlow);
        if (db.portfolios.cash < totalCost) {
          return NextResponse.json({
            success: false,
            message: `Tiền mặt không đủ. Cần: ${totalCost.toLocaleString('vi-VN')} đ, Khả dụng: ${db.portfolios.cash.toLocaleString('vi-VN')} đ`,
          }, { status: 400 });
        }

        db.portfolios.cash -= totalCost;

        // Cập nhật vị thế nắm giữ
        const existingHoldingIndex = db.holdings.findIndex(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        if (existingHoldingIndex >= 0) {
          const old = db.holdings[existingHoldingIndex];
          const updated = calculateNewCostBasis(old.shares, old.costBasis, numShares, numPrice, cashFlow.fee);
          const unpnl = calculateUnrealizedPnL(updated.newShares, updated.newCostBasis, numPrice);

          db.holdings[existingHoldingIndex] = {
            ...old,
            shares: updated.newShares,
            costBasis: updated.newCostBasis,
            currentPrice: numPrice,
            marketValue: unpnl.marketValue,
            unrealizedPnL: unpnl.unrealizedPnL,
            unrealizedPnLPercent: unpnl.returnPercent,
          };
        } else {
          const costBasisWithFee = Math.round((cashFlow.grossAmount + cashFlow.fee) / numShares);
          const unpnl = calculateUnrealizedPnL(numShares, costBasisWithFee, numPrice);
          db.holdings.push({
            id: `h-${Date.now()}`,
            symbol: symbol.toUpperCase(),
            companyName: `Cổ phiếu ${symbol.toUpperCase()}`,
            shares: numShares,
            costBasis: costBasisWithFee,
            currentPrice: numPrice,
            marketValue: unpnl.marketValue,
            unrealizedPnL: unpnl.unrealizedPnL,
            unrealizedPnLPercent: unpnl.returnPercent,
            weightPercent: 10,
            sector: 'Khác',
          });
        }
      } else if (type === 'SELL') {
        const existingHoldingIndex = db.holdings.findIndex(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        if (existingHoldingIndex < 0 || db.holdings[existingHoldingIndex].shares < numShares) {
          const avail = existingHoldingIndex >= 0 ? db.holdings[existingHoldingIndex].shares : 0;
          return NextResponse.json({
            success: false,
            message: `Số lượng cổ phiếu không đủ để bán. Khả dụng: ${avail} cp`,
          }, { status: 400 });
        }

        const holding = db.holdings[existingHoldingIndex];
        const pnl = calculateRealizedPnL(numShares, numPrice, holding.costBasis, cashFlow.fee, cashFlow.tax);
        
        db.portfolios.cash += cashFlow.netCashFlow;
        db.portfolios.realizedPnL += pnl.realizedPnL;

        const remainingShares = holding.shares - numShares;
        if (remainingShares === 0) {
          db.holdings.splice(existingHoldingIndex, 1);
        } else {
          const unpnl = calculateUnrealizedPnL(remainingShares, holding.costBasis, numPrice);
          db.holdings[existingHoldingIndex] = {
            ...holding,
            shares: remainingShares,
            marketValue: unpnl.marketValue,
            unrealizedPnL: unpnl.unrealizedPnL,
            unrealizedPnLPercent: unpnl.returnPercent,
          };
        }
      }

      // Ghi nhận nhật ký sổ lệnh
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type,
        symbol: symbol.toUpperCase(),
        shares: numShares,
        price: numPrice,
        grossAmount: cashFlow.grossAmount,
        fee: cashFlow.fee,
        tax: cashFlow.tax,
        netAmount: Math.abs(cashFlow.netCashFlow),
        notes: notes || `Lệnh ${type === 'BUY' ? 'Mua' : 'Bán'} thủ công`,
      };
      db.transactions.unshift(newTx);

      // Cập nhật tổng tài sản danh mục
      const totalStockVal = db.holdings.reduce((sum, h) => sum + h.marketValue, 0);
      const totalUnrealized = db.holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
      db.portfolios.stockValue = totalStockVal;
      db.portfolios.totalAssets = totalStockVal + db.portfolios.cash;
      db.portfolios.unrealizedPnL = totalUnrealized;

      // Tính lại tỷ trọng các mã
      db.holdings.forEach(h => {
        h.weightPercent = db.portfolios.totalAssets > 0 ? Number(((h.marketValue / db.portfolios.totalAssets) * 100).toFixed(1)) : 0;
      });

      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã thực hiện lệnh ${type === 'BUY' ? 'Mua' : 'Bán'} ${numShares} ${symbol.toUpperCase()} thành công!`,
        data: {
          transaction: newTx,
          portfolios: db.portfolios,
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Thao tác không được hỗ trợ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi thực thi giao dịch', error: String(error) }, { status: 500 });
  }
}
