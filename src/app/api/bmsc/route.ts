import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { calculateTradeCashFlow, calculateNewCostBasis, calculateUnrealizedPnL } from '@/lib/finance';

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      data: {
        accountNumber: '021C123456-1',
        accountName: 'LÊ TRÍ ANH',
        broker: 'Công ty Cổ phần Chứng khoán Bảo Minh (BMSC)',
        connectionStatus: 'DISCONNECTED',
        apiSupportNote: 'BMSC hiện tại không có Open API cho phép đặt lệnh hay truy vấn tự động từ phần mềm bên thứ 3.',
        supportedMethods: ['Nhập file sao kê Excel (.xlsx, .xls)', 'Nhập file sao kê CSV (.csv)'],
        lastSync: 'Chưa đồng bộ API tự động',
        balance: {
          cash: db.portfolios.cash,
          stockValue: db.portfolios.stockValue,
          totalAssets: db.portfolios.totalAssets,
          withdrawableCash: db.portfolios.cash,
          purchasingPower: db.portfolios.cash * 2, // Sức mua có margin giả định
        },
        holdings: db.holdings,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi tải thông tin tài khoản BMSC', error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, csvContent } = body;
    const db = getDatabase();

    if (action === 'IMPORT_STATEMENT' && csvContent) {
      // Phân tích file CSV sao kê giao dịch từ BMSC
      // Định dạng dòng: Ngày,Mã CP,Loại lệnh,Khối lượng,Giá,Phí,Ghi chú
      const lines = csvContent.split('\n').filter((l: string) => l.trim().length > 0);
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p: string) => p.trim());
        if (parts.length >= 5) {
          const [date, symbol, typeStr, sharesStr, priceStr, feeStr, notes] = parts;
          const type = typeStr.toUpperCase().includes('MUA') || typeStr.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
          const shares = parseInt(sharesStr.replace(/\D/g, ''), 10);
          const price = parseInt(priceStr.replace(/\D/g, ''), 10);
          const fee = feeStr ? parseInt(feeStr.replace(/\D/g, ''), 10) : Math.round(shares * price * 0.0015);
          const tax = type === 'SELL' ? Math.round(shares * price * 0.0010) : 0;
          const grossAmount = shares * price;
          const netAmount = type === 'BUY' ? grossAmount + fee : grossAmount - fee - tax;

          if (shares > 0 && price > 0 && symbol) {
            db.transactions.unshift({
              id: `bmsc-import-${Date.now()}-${i}`,
              date: date || new Date().toISOString().split('T')[0],
              type,
              symbol: symbol.toUpperCase(),
              shares,
              price,
              grossAmount,
              fee,
              tax,
              netAmount,
              notes: notes || 'Nhập từ sao kê BMSC',
            });
            importedCount++;
          }
        }
      }

      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${importedCount} giao dịch từ sao kê BMSC!`,
        importedCount,
      });
    }

    return NextResponse.json({ success: false, message: 'Thao tác không được hỗ trợ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi nhập sao kê BMSC', error: String(error) }, { status: 500 });
  }
}
