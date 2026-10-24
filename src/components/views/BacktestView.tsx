'use client';

import React, { useState } from 'react';
import { History, Play, CheckCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { BacktestResult, T3Strategy } from '@/types';

export default function BacktestView() {
  const [strategy, setStrategy] = useState<T3Strategy>('Breakout');
  const [timeframe, setTimeframe] = useState('6M');
  const [initialCapital, setInitialCapital] = useState('500000000');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRunBacktest = async () => {
    setIsRunning(true);

    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          timeframe,
          initialCapital: Number(initialCapital),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch {
      // error
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Kiểm định Chiến lược Giao dịch (Backtesting Engine)</h2>
          <p className="text-[13px] text-[#647293] mt-0.5">Mô phỏng chuỗi lệnh lịch sử không có lookahead bias, trừ phí 0.15%, thuế 0.1% và trượt giá 0.1%</p>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <h3 className="text-[15px] font-semibold text-[#172554]">Thông số kiểm định</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[#647293] font-medium block mb-1">Chiến lược T+3</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]"
            >
              <option value="Breakout">Breakout (Phá nền giá)</option>
              <option value="Pullback">Pullback (Điều chỉnh MA20)</option>
              <option value="Momentum">Momentum (Động lượng)</option>
              <option value="Reversal">Reversal (Đảo chiều đáy)</option>
            </select>
          </div>

          <div>
            <label className="text-[#647293] font-medium block mb-1">Khoảng thời gian lịch sử</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-semibold text-[#172554]"
            >
              <option value="3M">3 Tháng gần nhất</option>
              <option value="6M">6 Tháng gần nhất</option>
              <option value="1Y">1 Năm gần nhất</option>
            </select>
          </div>

          <div>
            <label className="text-[#647293] font-medium block mb-1">Vốn khởi điểm (VNĐ)</label>
            <input
              type="number"
              step="10000000"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554] font-mono tabular-nums"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="w-full px-5 py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Đang chạy kiểm định...' : 'Chạy kiểm định ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[12px] text-[#647293] font-medium">Tỷ lệ thắng (Win Rate)</p>
              <h4 className="text-[20px] font-bold text-[#16A34A] mt-0.5 font-mono tabular-nums">{result.winRate}%</h4>
              <p className="text-[11px] text-[#647293] mt-1">{result.winningTrades} thắng / {result.losingTrades} thua</p>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[12px] text-[#647293] font-medium">Tổng lợi nhuận ròng</p>
              <h4 className="text-xl font-bold text-[#16A34A] mt-0.5 font-mono">+{result.totalReturnPercent}%</h4>
              <p className="text-[10px] text-[#647293] mt-1 font-mono">Vốn: {result.finalCapital.toLocaleString('vi-VN')} đ</p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[11px] text-[#647293] font-medium">Lợi nhuận TB / Lệnh</p>
              <h4 className="text-xl font-bold text-[#087CFF] mt-0.5 font-mono">+{result.avgReturnPerTradePercent}%</h4>
              <p className="text-[10px] text-[#647293] mt-1">Đã trừ toàn bộ phí</p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[11px] text-[#647293] font-medium">Sụt giảm lớn nhất (MDD)</p>
              <h4 className="text-xl font-bold text-[#EF4444] mt-0.5 font-mono">-{result.maxDrawdownPercent}%</h4>
              <p className="text-[10px] text-[#16A34A] mt-1 font-bold">Mức kiểm soát tốt</p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[11px] text-[#647293] font-medium">Hệ số lãi/lỗ (Factor)</p>
              <h4 className="text-xl font-bold text-[#172554] mt-0.5 font-mono">{result.profitFactor}</h4>
              <p className="text-[10px] text-[#647293] mt-1">&gt; 1.5 là chiến lược tối ưu</p>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCE5FF] shadow-xs">
              <p className="text-[11px] text-[#647293] font-medium">So sánh VN-Index</p>
              <h4 className="text-xl font-bold text-[#8B36FF] mt-0.5 font-mono">+{result.benchmarkReturnPercent}%</h4>
              <p className="text-[10px] text-[#16A34A] mt-1 font-bold">Alpha: +{(result.totalReturnPercent - result.benchmarkReturnPercent).toFixed(1)}%</p>
            </div>
          </div>

          {/* Trade Details Table */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#DCE5FF] flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#172554]">Chi tiết {result.totalTrades} giao dịch trong kỳ kiểm định</h4>
              <span className="text-xs text-[#087CFF] font-bold">Chiến lược: {result.strategy}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F4F7FF] text-[#647293] uppercase tracking-wider text-[11px] border-b border-[#DCE5FF]">
                    <th className="py-3 px-4 font-semibold">Mã CP</th>
                    <th className="py-3 px-4 font-semibold">Ngày vào</th>
                    <th className="py-3 px-4 font-semibold text-right">Giá vào</th>
                    <th className="py-3 px-4 font-semibold">Ngày ra</th>
                    <th className="py-3 px-4 font-semibold text-right">Giá ra</th>
                    <th className="py-3 px-4 font-semibold text-center">Nắm giữ</th>
                    <th className="py-3 px-4 font-semibold text-right">Lãi/Lỗ (đ)</th>
                    <th className="py-3 px-4 font-semibold text-right">% Lãi/Lỗ</th>
                    <th className="py-3 px-4 font-semibold text-center">Lý do đóng lệnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F7FF] font-medium">
                  {result.trades.map((t) => {
                    const isWin = t.pnl > 0;
                    return (
                      <tr key={t.id} className="hover:bg-[#F4F7FF] transition">
                        <td className="py-3 px-4 font-bold text-[#087CFF]">{t.symbol}</td>
                        <td className="py-3 px-4 text-[#647293]">{t.entryDate}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#172554]">{t.entryPrice.toLocaleString('vi-VN')}</td>
                        <td className="py-3 px-4 text-[#647293]">{t.exitDate}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#172554]">{t.exitPrice.toLocaleString('vi-VN')}</td>
                        <td className="py-3 px-4 text-center font-mono text-[#647293]">{t.holdingDays} phiên</td>
                        <td className={`py-3 px-4 text-right font-bold font-mono ${isWin ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                          {isWin ? '+' : ''}{t.pnl.toLocaleString('vi-VN')} đ
                        </td>
                        <td className={`py-3 px-4 text-right font-bold font-mono ${isWin ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                          {isWin ? '+' : ''}{t.pnlPercent}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.exitReason === 'TARGET' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'
                          }`}>
                            {t.exitReason === 'TARGET' ? 'CHỐT LỜI' : 'CẮT LỖ'}
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
    </div>
  );
}
