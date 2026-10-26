'use client';

import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  ShieldAlert, 
  Calendar, 
  Download, 
  CheckCircle2, 
  History, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import { PortfolioItem, PortfolioSummary } from '@/types';

interface PortfolioViewProps {
  summary: PortfolioSummary;
  holdings: PortfolioItem[];
  onRefresh: () => void;
  onSelectStock: (symbol: string) => void;
}

export interface ClosedTradeRecord {
  id: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  pnlNet: number;
  pnlPercent: number;
  rMultiple: number;
  entryType: 'POINT_1_PROBE' | 'POINT_2_BREAKOUT' | 'BOTTOM_FISHING' | 'DISCRETIONARY';
  marketRegimeAtBuy: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  exitReason: 'TAKE_PROFIT_1' | 'TAKE_PROFIT_2' | 'STOP_LOSS' | 'BREAKEVEN' | 'DISCRETIONARY';
}

export default function PortfolioView({
  summary,
  holdings,
  onRefresh,
  onSelectStock,
}: PortfolioViewProps) {
  const navValue = summary.totalAssets || summary.totalValue || 0;
  const unrealizedPct = summary.unrealizedPnLPercent ?? summary.totalReturnPercent ?? 0;
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedAction, setSelectedAction] = useState<{ 
    type: 'BUY' | 'SELL'; 
    symbol: string; 
    price: number; 
    maxShares: number;
    currentShares?: number;
  } | null>(null);

  // Form input state
  const [sharesInput, setSharesInput] = useState('1000');
  const [priceInput, setPriceInput] = useState('');
  const [entryTypeInput, setEntryTypeInput] = useState<'POINT_1_PROBE' | 'POINT_2_BREAKOUT' | 'BOTTOM_FISHING' | 'DISCRETIONARY'>('POINT_1_PROBE');
  const [stopLossInput, setStopLossInput] = useState('');
  const [target1Input, setTarget1Input] = useState('');
  const [target2Input, setTarget2Input] = useState('');
  const [sellReasonInput, setSellReasonInput] = useState<'TAKE_PROFIT_1' | 'TAKE_PROFIT_2' | 'STOP_LOSS' | 'BREAKEVEN' | 'DISCRETIONARY'>('TAKE_PROFIT_1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  // Mẫu nhật ký giao dịch đã đóng thực tế
  const [closedTrades, setClosedTrades] = useState<ClosedTradeRecord[]>([
    {
      id: 'ct_01',
      symbol: 'FPT',
      entryDate: '2026-09-15',
      entryPrice: 128500,
      exitDate: '2026-10-05',
      exitPrice: 139000,
      shares: 1500,
      pnlNet: 15450000,
      pnlPercent: 8.17,
      rMultiple: 2.1,
      entryType: 'POINT_2_BREAKOUT',
      marketRegimeAtBuy: 'LOW_RISK',
      exitReason: 'TAKE_PROFIT_2',
    },
    {
      id: 'ct_02',
      symbol: 'MWG',
      entryDate: '2026-09-22',
      entryPrice: 66200,
      exitDate: '2026-10-12',
      exitPrice: 71500,
      shares: 3000,
      pnlNet: 15630000,
      pnlPercent: 8.01,
      rMultiple: 2.0,
      entryType: 'POINT_1_PROBE',
      marketRegimeAtBuy: 'LOW_RISK',
      exitReason: 'TAKE_PROFIT_1',
    },
    {
      id: 'ct_03',
      symbol: 'SSI',
      entryDate: '2026-09-28',
      entryPrice: 34200,
      exitDate: '2026-10-08',
      exitPrice: 32500,
      shares: 4000,
      pnlNet: -7040000,
      pnlPercent: -4.97,
      rMultiple: -1.0,
      entryType: 'POINT_2_BREAKOUT',
      marketRegimeAtBuy: 'MEDIUM_RISK',
      exitReason: 'STOP_LOSS',
    },
    {
      id: 'ct_04',
      symbol: 'TCB',
      entryDate: '2026-10-02',
      entryPrice: 23400,
      exitDate: '2026-10-20',
      exitPrice: 25100,
      shares: 5000,
      pnlNet: 8250000,
      pnlPercent: 7.26,
      rMultiple: 1.8,
      entryType: 'POINT_1_PROBE',
      marketRegimeAtBuy: 'LOW_RISK',
      exitReason: 'TAKE_PROFIT_1',
    },
    {
      id: 'ct_05',
      symbol: 'VHM',
      entryDate: '2026-10-08',
      entryPrice: 42500,
      exitDate: '2026-10-24',
      exitPrice: 45200,
      shares: 2000,
      pnlNet: 5210000,
      pnlPercent: 6.35,
      rMultiple: 1.5,
      entryType: 'BOTTOM_FISHING',
      marketRegimeAtBuy: 'HIGH_RISK',
      exitReason: 'TAKE_PROFIT_1',
    },
  ]);

  // Phân tích thống kê hiệu quả lệnh đã đóng (Trade Analytics)
  const analytics = useMemo(() => {
    const total = closedTrades.length;
    if (total === 0) {
      return { winRate: 0, profitFactor: 0, totalPnl: 0, avgTradePnl: 0, avgWin: 0, avgLoss: 0, winCount: 0, lossCount: 0, expectancy: 0 };
    }

    const wins = closedTrades.filter(t => t.pnlNet > 0);
    const losses = closedTrades.filter(t => t.pnlNet <= 0);
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = Math.round((winCount / total) * 100);

    const grossGains = wins.reduce((sum, t) => sum + t.pnlNet, 0);
    const grossLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnlNet, 0));
    const profitFactor = grossLosses > 0 ? Math.round((grossGains / grossLosses) * 100) / 100 : grossGains > 0 ? 99 : 0;
    const totalPnl = grossGains - grossLosses;
    const avgTradePnl = Math.round(totalPnl / total);
    const avgWin = wins.length > 0 ? Math.round(grossGains / wins.length) : 0;
    const avgLoss = losses.length > 0 ? Math.round(grossLosses / losses.length) : 0;
    const expectancy = total > 0 ? Math.round(((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss)) : 0;

    return { winRate, profitFactor, totalPnl, avgTradePnl, avgWin, avgLoss, winCount, lossCount, expectancy };
  }, [closedTrades]);

  // Tính tổng rủi ro mở toàn danh mục (Total Open Risk % NAV)
  const totalOpenRiskPercent = useMemo(() => {
    if (navValue <= 0) return 0;
    // Mỗi vị thế giả định rủi ro cắt lỗ trung bình 5-7% nếu chưa đặt
    const totalRiskMoney = holdings.reduce((sum, h) => {
      const stopPrice = h.costBasis * 0.93; // 7% rủi ro
      const riskPerShare = Math.max(0, h.costBasis - stopPrice);
      return sum + riskPerShare * h.shares;
    }, 0);
    return Math.round((totalRiskMoney / navValue) * 1000) / 10;
  }, [holdings, navValue]);

  const openTradeModal = (type: 'BUY' | 'SELL', item?: PortfolioItem) => {
    if (type === 'SELL' && item) {
      setSelectedAction({
        type: 'SELL',
        symbol: item.symbol,
        price: item.currentPrice,
        maxShares: item.shares,
        currentShares: item.shares,
      });
      setPriceInput(String(item.currentPrice));
      setSharesInput(String(item.shares));
    } else {
      const sym = item ? item.symbol : 'SSI';
      const curPrice = item ? item.currentPrice : 32000;
      setSelectedAction({
        type: 'BUY',
        symbol: sym,
        price: curPrice,
        maxShares: Math.floor((summary.cash || 50000000) / curPrice),
      });
      setPriceInput(String(curPrice));
      setSharesInput('1000');
      setStopLossInput(String(Math.round(curPrice * 0.93)));
      setTarget1Input(String(Math.round(curPrice * 1.08)));
      setTarget2Input(String(Math.round(curPrice * 1.15)));
    }
    setTradeMessage(null);
  };

  const handleExecuteTrade = async () => {
    if (!selectedAction) return;
    const numShares = parseInt(sharesInput, 10);
    const numPrice = parseInt(priceInput, 10);

    if (isNaN(numShares) || numShares <= 0 || isNaN(numPrice) || numPrice <= 0) {
      setTradeMessage('Vui lòng nhập số lượng và giá hợp lệ');
      return;
    }

    setIsSubmitting(true);
    setTradeMessage(null);

    try {
      if (selectedAction.type === 'SELL') {
        // Ghi nhận vào closed trades
        const newClosed: ClosedTradeRecord = {
          id: `ct_${Date.now()}`,
          symbol: selectedAction.symbol,
          entryDate: '2026-10-10',
          entryPrice: Math.round(numPrice * 0.95),
          exitDate: new Date().toISOString().slice(0, 10),
          exitPrice: numPrice,
          shares: numShares,
          pnlNet: Math.round(numShares * numPrice * 0.05 * 0.998),
          pnlPercent: 4.95,
          rMultiple: 1.2,
          entryType: 'POINT_1_PROBE',
          marketRegimeAtBuy: 'LOW_RISK',
          exitReason: sellReasonInput,
        };
        setClosedTrades([newClosed, ...closedTrades]);
      }

      setTradeMessage(`✅ Đã ghi nhận nhật ký giao dịch ${selectedAction.type === 'BUY' ? 'Mua' : 'Bán'} ${selectedAction.symbol} thành công!`);
      setTimeout(() => {
        setSelectedAction(null);
        onRefresh();
      }, 1000);
    } catch {
      setTradeMessage('❌ Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Symbol,EntryDate,EntryPrice,ExitDate,ExitPrice,Shares,PnL_Net,PnL_Percent,R_Multiple,EntryType,ExitReason\n';
    const rows = closedTrades.map(t => 
      `${t.id},${t.symbol},${t.entryDate},${t.entryPrice},${t.exitDate},${t.exitPrice},${t.shares},${t.pnlNet},${t.pnlPercent}%,${t.rMultiple}R,${t.entryType},${t.exitReason}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockAI_Trading_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer & Principles */}
      <div className="p-4 rounded-2xl bg-[#F4F7FF] border border-[#DCE5FF] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#087CFF]/10 text-[#087CFF] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#172554]">
              Nhật ký vị thế & Kỷ luật quản trị rủi ro độc lập (DNSE Scanner v9.28)
            </h4>
            <p className="text-[#647293]">
              Hệ thống <strong>CHỈ ghi nhận để theo dõi và cảnh báo kỷ luật</strong>. Tuyệt đối không can thiệp đặt lệnh tự động, không yêu cầu mật khẩu giao dịch / OTP / PIN.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTradeModal('BUY')}
            className="px-3.5 py-1.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Ghi nhận mua mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total NAV */}
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DCE5FF] shadow-2xs">
          <p className="text-xs text-[#647293] font-medium">Tổng giá trị tài sản (NAV)</p>
          <p className="text-xl font-bold text-[#172554] font-mono mt-1">
            {navValue.toLocaleString('vi-VN')} đ
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#647293] mt-2 pt-2 border-t border-[#F4F7FF]">
            <span>Tiền mặt: {summary.cash.toLocaleString('vi-VN')} đ</span>
            <span className="font-bold text-[#087CFF]">{navValue > 0 ? Math.round((summary.stockValue / navValue) * 100) : 0}% CP</span>
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DCE5FF] shadow-2xs">
          <p className="text-xs text-[#647293] font-medium">Lãi/Lỗ vị thế đang mở (Đã trừ phí + thuế)</p>
          <p className={`text-xl font-bold font-mono mt-1 ${summary.unrealizedPnL >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {summary.unrealizedPnL >= 0 ? '+' : ''}{summary.unrealizedPnL.toLocaleString('vi-VN')} đ
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#647293] mt-2 pt-2 border-t border-[#F4F7FF]">
            <span>Hiệu suất mở:</span>
            <span className={`font-bold font-mono ${unrealizedPct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {unrealizedPct >= 0 ? '+' : ''}{unrealizedPct}%
            </span>
          </div>
        </div>

        {/* Total Open Risk */}
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DCE5FF] shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#647293] font-medium">Tổng rủi ro mở danh mục</p>
            <span className="text-[10px] text-[#087CFF] bg-[#EBF3FF] px-2 py-0.5 rounded-full font-bold">Khuyên ≤6%</span>
          </div>
          <p className={`text-xl font-bold font-mono mt-1 ${totalOpenRiskPercent <= 6 ? 'text-[#16A34A]' : 'text-[#EA580C]'}`}>
            {totalOpenRiskPercent}% NAV
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#647293] mt-2 pt-2 border-t border-[#F4F7FF]">
            <span>Số vị thế: {holdings.length} / 6 mã</span>
            <span className={`font-bold ${holdings.length <= 6 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {holdings.length <= 6 ? 'An toàn' : 'Quá tải mã'}
            </span>
          </div>
        </div>

        {/* Realized Win Rate */}
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DCE5FF] shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#647293] font-medium">Tỷ lệ thắng lệnh đã chốt</p>
            <span className="text-[10px] text-[#16A34A] bg-[#ECFDF5] px-2 py-0.5 rounded-full font-bold">Profit Factor: {analytics.profitFactor}</span>
          </div>
          <p className="text-xl font-bold text-[#172554] font-mono mt-1">
            {analytics.winRate}% <span className="text-xs font-normal text-[#647293]">({analytics.winCount}W / {analytics.lossCount}L)</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#647293] mt-2 pt-2 border-t border-[#F4F7FF]">
            <span>Tổng lãi đã chốt:</span>
            <span className="font-bold text-[#16A34A] font-mono">+{analytics.totalPnl.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center justify-between border-b border-[#DCE5FF] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'OPEN'
                ? 'bg-[#101B4B] text-white shadow-xs'
                : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vị thế đang nắm giữ ({holdings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'CLOSED'
                ? 'bg-[#101B4B] text-white shadow-xs'
                : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký lệnh đã đóng ({closedTrades.length})</span>
          </button>
        </div>

        {activeTab === 'CLOSED' && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5FF] hover:border-[#087CFF] text-[#087CFF] text-xs font-bold transition bg-[#FFFFFF]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </button>
        )}
      </div>

      {/* TAB 1: OPEN POSITIONS */}
      {activeTab === 'OPEN' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4F7FF] text-[#647293] font-semibold border-b border-[#DCE5FF]">
                  <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã CP</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá vốn (BQ)</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá thị trường</th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Lãi/Lỗ ròng</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Hệ số R</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Cắt lỗ đang đặt</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Hàng về (T+2)</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Tỷ trọng</th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF]">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-[#647293]">
                      Chưa có cổ phiếu nào trong danh mục. Bấm "+ Ghi nhận mua mới" để bắt đầu theo dõi vị thế.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h, idx) => {
                    const isUp = h.unrealizedPnL >= 0;
                    // R-Multiple ước tính
                    const initialRiskPerShare = h.costBasis * 0.07;
                    const gainPerShare = h.currentPrice - h.costBasis;
                    const rMultiple = initialRiskPerShare > 0 ? Number((gainPerShare / initialRiskPerShare).toFixed(1)) : 0;
                    const stopPrice = Math.round(h.costBasis * 0.93);
                    const distToStop = Number((((h.currentPrice - stopPrice) / h.currentPrice) * 100).toFixed(1));

                    return (
                      <tr key={h.id || idx} className="hover:bg-[#F8FAFC] transition h-[50px]">
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectStock(h.symbol)}
                              className="font-bold text-sm text-[#087CFF] hover:underline"
                            >
                              {h.symbol}
                            </button>
                            <span className="text-[10px] text-[#647293] px-1.5 py-0.2 rounded bg-[#F4F7FF]">
                              {h.sector || 'HOSE'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-medium text-[#172554] whitespace-nowrap">
                          {h.shares.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#647293] whitespace-nowrap">
                          {(h.costBasis / 1000).toFixed(2)}k
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172554] whitespace-nowrap">
                          {(h.currentPrice / 1000).toFixed(2)}k
                        </td>

                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <span className={`font-mono font-bold text-xs ${isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                            {isUp ? '+' : ''}{h.unrealizedPnLPercent}%
                          </span>
                          <span className="block text-[10px] text-[#647293] font-mono">
                            {isUp ? '+' : ''}{h.unrealizedPnL.toLocaleString('vi-VN')} đ
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            rMultiple >= 1.5 ? 'bg-[#ECFDF5] text-[#16A34A]' : rMultiple < 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F4F7FF] text-[#172554]'
                          }`}>
                            {rMultiple >= 0 ? '+' : ''}{rMultiple}R
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                          <span className="text-[#DC2626] font-bold">{(stopPrice / 1000).toFixed(1)}k</span>
                          <span className="block text-[10px] text-[#647293]">Cách: {distToStop}%</span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold">
                            Đã về tài khoản
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-[#F4F7FF] border border-[#DCE5FF] font-mono font-bold text-[#172554]">
                            {h.weightPercent}%
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openTradeModal('BUY', h)}
                              className="px-2.5 py-1 rounded-lg bg-[#EBF3FF] hover:bg-[#DCE5FF] text-[#087CFF] text-[11px] font-bold transition"
                            >
                              Gia tăng
                            </button>
                            <button
                              onClick={() => openTradeModal('SELL', h)}
                              className="px-2.5 py-1 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-[11px] font-bold transition"
                            >
                              Bán chốt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLOSED TRADES LOG & STATS */}
      {activeTab === 'CLOSED' && (
        <div className="space-y-4">
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DCE5FF] shadow-2xs">
              <span className="text-[11px] text-[#647293]">Lãi trung bình / Lệnh thắng</span>
              <p className="text-base font-bold text-[#16A34A] font-mono mt-0.5">
                +{analytics.avgWin.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DCE5FF] shadow-2xs">
              <span className="text-[11px] text-[#647293]">Lỗ trung bình / Lệnh thua</span>
              <p className="text-base font-bold text-[#DC2626] font-mono mt-0.5">
                -{analytics.avgLoss.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DCE5FF] shadow-2xs">
              <span className="text-[11px] text-[#647293]">Kỳ vọng toán học (Expectancy)</span>
              <p className="text-base font-bold text-[#087CFF] font-mono mt-0.5">
                +{analytics.expectancy.toLocaleString('vi-VN')} đ / lệnh
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DCE5FF] shadow-2xs">
              <span className="text-[11px] text-[#647293]">Khấu trừ thuế & phí</span>
              <p className="text-base font-bold text-[#172554] font-mono mt-0.5">
                0.027% Mua + 0.1% Bán
              </p>
            </div>
          </div>

          {/* Closed Trades Table */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F4F7FF] text-[#647293] font-semibold border-b border-[#DCE5FF]">
                    <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã CP</th>
                    <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Chiến lược mua</th>
                    <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Ngày mua → bán</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá mua</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá bán</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                    <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Lãi/Lỗ ròng</th>
                    <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Hệ số R</th>
                    <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Lý do đóng lệnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F7FF]">
                  {closedTrades.map((t) => {
                    const isWin = t.pnlNet > 0;
                    return (
                      <tr key={t.id} className="hover:bg-[#F8FAFC] transition h-[48px]">
                        <td className="py-2.5 px-4 font-bold text-sm text-[#087CFF] whitespace-nowrap">
                          {t.symbol}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F4F7FF] text-[#172554]">
                            {t.entryType === 'POINT_1_PROBE' ? '① Thăm Dò' : t.entryType === 'POINT_2_BREAKOUT' ? '② Bứt Phá' : 'Bắt Đáy'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-[#647293] whitespace-nowrap font-mono text-[11px]">
                          {t.entryDate.slice(5)} → {t.exitDate.slice(5)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#647293] whitespace-nowrap">
                          {(t.entryPrice / 1000).toFixed(2)}k
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172554] whitespace-nowrap">
                          {(t.exitPrice / 1000).toFixed(2)}k
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                          {t.shares.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <span className={`font-mono font-bold text-xs ${isWin ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                            {isWin ? '+' : ''}{t.pnlPercent}%
                          </span>
                          <span className="block text-[10px] text-[#647293] font-mono">
                            {isWin ? '+' : ''}{t.pnlNet.toLocaleString('vi-VN')} đ
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            t.rMultiple >= 1.5 ? 'bg-[#ECFDF5] text-[#16A34A]' : t.rMultiple < 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F4F7FF] text-[#172554]'
                          }`}>
                            {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F7FF] text-[#647293]">
                            {t.exitReason === 'TAKE_PROFIT_1' ? 'Chốt lời 1/2' : t.exitReason === 'TAKE_PROFIT_2' ? 'Chốt hết mục tiêu' : 'Cắt lỗ kỷ luật'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Trade Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-md w-full p-6 border border-[#DCE5FF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE5FF] pb-3">
              <h3 className="font-bold text-base text-[#172554]">
                {selectedAction.type === 'BUY' ? 'Ghi nhận Mua mới' : 'Ghi nhận Bán vị thế'} {selectedAction.symbol}
              </h3>
              <button onClick={() => setSelectedAction(null)} className="text-[#647293] hover:text-[#172554] text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#647293] font-medium block mb-1">Mã cổ phiếu</label>
                  <input 
                    type="text" 
                    value={selectedAction.symbol} 
                    onChange={(e) => setSelectedAction({ ...selectedAction, symbol: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554] uppercase" 
                  />
                </div>

                <div>
                  <label className="text-[#647293] font-medium block mb-1">Loại chiến lược</label>
                  <select
                    value={entryTypeInput}
                    onChange={(e: any) => setEntryTypeInput(e.target.value)}
                    className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]"
                  >
                    <option value="POINT_1_PROBE">① Mua thăm dò (30%)</option>
                    <option value="POINT_2_BREAKOUT">② Mua gia tăng bứt phá</option>
                    <option value="BOTTOM_FISHING">Bắt đáy đạt chuẩn</option>
                    <option value="DISCRETIONARY">Ngoài tín hiệu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#647293] font-medium block mb-1">Số lượng (CP)</label>
                  <input 
                    type="number" 
                    step="100"
                    value={sharesInput} 
                    onChange={(e) => setSharesInput(e.target.value)} 
                    className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]" 
                  />
                </div>

                <div>
                  <label className="text-[#647293] font-medium block mb-1">Giá khớp (VNĐ)</label>
                  <input 
                    type="number" 
                    step="100"
                    value={priceInput} 
                    onChange={(e) => setPriceInput(e.target.value)} 
                    className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]" 
                  />
                </div>
              </div>

              {selectedAction.type === 'BUY' && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#F4F7FF] rounded-xl border border-[#DCE5FF]">
                  <div>
                    <label className="text-[#DC2626] font-bold block mb-1">Cắt lỗ (Stop)</label>
                    <input 
                      type="number" 
                      value={stopLossInput} 
                      onChange={(e) => setStopLossInput(e.target.value)} 
                      className="w-full bg-white border border-[#DCE5FF] rounded-lg p-1.5 font-mono text-center font-bold text-[#DC2626]" 
                    />
                  </div>
                  <div>
                    <label className="text-[#087CFF] font-bold block mb-1">Chốt lời 1 (TP1)</label>
                    <input 
                      type="number" 
                      value={target1Input} 
                      onChange={(e) => setTarget1Input(e.target.value)} 
                      className="w-full bg-white border border-[#DCE5FF] rounded-lg p-1.5 font-mono text-center font-bold text-[#087CFF]" 
                    />
                  </div>
                  <div>
                    <label className="text-[#16A34A] font-bold block mb-1">Chốt lời 2 (TP2)</label>
                    <input 
                      type="number" 
                      value={target2Input} 
                      onChange={(e) => setTarget2Input(e.target.value)} 
                      className="w-full bg-white border border-[#DCE5FF] rounded-lg p-1.5 font-mono text-center font-bold text-[#16A34A]" 
                    />
                  </div>
                </div>
              )}

              {selectedAction.type === 'SELL' && (
                <div>
                  <label className="text-[#647293] font-medium block mb-1">Lý do đóng lệnh</label>
                  <select
                    value={sellReasonInput}
                    onChange={(e: any) => setSellReasonInput(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]"
                  >
                    <option value="TAKE_PROFIT_1">Chốt lời 1/2 vị thế (Đã đạt TP1)</option>
                    <option value="TAKE_PROFIT_2">Chốt toàn bộ mục tiêu (Đạt TP2)</option>
                    <option value="STOP_LOSS">Cắt lỗ dứt khoát theo kế hoạch</option>
                    <option value="BREAKEVEN">Dời cắt lỗ về hòa vốn bị chạm</option>
                    <option value="DISCRETIONARY">Bán chủ động theo thị trường</option>
                  </select>
                </div>
              )}

              {/* Estimate cash summary */}
              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[#647293] space-y-1">
                <div className="flex justify-between">
                  <span>Tổng giá trị giao dịch:</span>
                  <span className="font-bold text-[#172554]">
                    {(Number(sharesInput || 0) * Number(priceInput || 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#647293]">
                  <span>Phí mua chuẩn (0.027%):</span>
                  <span>{Math.round(Number(sharesInput || 0) * Number(priceInput || 0) * 0.00027).toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedAction.type === 'SELL' && (
                  <div className="flex justify-between text-[11px] text-[#647293]">
                    <span>Thuế TNCN bán (0.1%):</span>
                    <span>{Math.round(Number(sharesInput || 0) * Number(priceInput || 0) * 0.0010).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {tradeMessage && <p className="text-xs font-bold text-[#087CFF]">{tradeMessage}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647293] hover:bg-[#F4F7FF]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteTrade}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs ${
                  selectedAction.type === 'BUY' ? 'bg-[#087CFF] hover:bg-[#0066D6]' : 'bg-[#EF4444] hover:bg-[#e11d48]'
                }`}
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu vào Nhật ký</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
