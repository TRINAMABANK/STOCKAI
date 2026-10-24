'use client';

import React, { useState } from 'react';
import { PieChart, Plus, Minus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { PortfolioItem, PortfolioSummary } from '@/types';

interface PortfolioViewProps {
  summary: PortfolioSummary;
  holdings: PortfolioItem[];
  onRefresh: () => void;
  onSelectStock: (symbol: string) => void;
}

export default function PortfolioView({
  summary,
  holdings,
  onRefresh,
  onSelectStock,
}: PortfolioViewProps) {
  const [selectedAction, setSelectedAction] = useState<{ type: 'BUY' | 'SELL'; symbol: string; price: number; maxShares: number } | null>(null);
  const [sharesInput, setSharesInput] = useState('100');
  const [priceInput, setPriceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  const openTradeModal = (type: 'BUY' | 'SELL', item: PortfolioItem) => {
    setSelectedAction({
      type,
      symbol: item.symbol,
      price: item.currentPrice,
      maxShares: type === 'SELL' ? item.shares : Math.floor(summary.cash / item.currentPrice),
    });
    setPriceInput(String(item.currentPrice));
    setSharesInput('100');
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
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRADE',
          type: selectedAction.type,
          symbol: selectedAction.symbol,
          shares: numShares,
          price: numPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTradeMessage(`✅ ${data.message}`);
        setTimeout(() => {
          setSelectedAction(null);
          onRefresh();
        }, 1200);
      } else {
        setTradeMessage(`❌ ${data.message}`);
      }
    } catch {
      setTradeMessage('❌ Lỗi kết nối hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Danh mục đầu tư cá nhân</h2>
          <p className="text-[13px] text-[#647293] mt-0.5">Theo dõi vị thế cổ phiếu nắm giữ, tỷ trọng và hiệu suất thực tế</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[12px] text-[#647293] font-medium">Tổng giá trị cổ phiếu</p>
            <p className="text-[20px] font-bold text-[#172554] font-mono tabular-nums">{summary.stockValue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#DCE5FF] flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#172554]">Chi tiết cổ phiếu đang nắm giữ ({holdings.length} mã)</h3>
          <span className="text-[13px] text-[#16A34A] font-semibold font-mono tabular-nums">
            Lãi chưa thực hiện: +{summary.unrealizedPnL.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11pt]">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] text-[11pt] font-semibold border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã CP</th>
                <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Ngành</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá vốn (BQ)</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá thị trường</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Giá trị TT</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Lãi/Lỗ (%)</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Tỷ trọng</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF] text-[11pt]">
              {holdings.map((h) => {
                const isProfitable = h.unrealizedPnL >= 0;
                return (
                  <tr key={h.id} className="hover:bg-[#F8FAFC] transition h-[44px]">
                    <td className="py-2.5 px-4 font-semibold text-[#087CFF] cursor-pointer whitespace-nowrap" onClick={() => onSelectStock(h.symbol)}>
                      {h.symbol}
                      <span className="block text-[11pt] text-[#647293] font-normal">{h.companyName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#647293] text-[11pt] font-medium whitespace-nowrap">{h.sector}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">{h.shares.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-[#647293] font-mono tabular-nums text-[11pt] whitespace-nowrap">{h.costBasis.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">{h.currentPrice.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">{h.marketValue.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-0.5 font-bold font-mono tabular-nums text-[11pt] ${isProfitable ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isProfitable ? '+' : ''}{h.unrealizedPnLPercent}%
                      </span>
                      <span className="block text-[11pt] text-[#647293] font-mono tabular-nums whitespace-nowrap">
                        {isProfitable ? '+' : ''}{h.unrealizedPnL.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#F4F7FF] border border-[#DCE5FF] text-[#172554] font-semibold text-[11pt] font-mono tabular-nums">
                        {h.weightPercent}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTradeModal('BUY', h)}
                          className="px-2.5 py-1 rounded-lg bg-[#EBF3FF] text-[#087CFF] hover:bg-[#DCE5FF] text-[11pt] font-semibold transition"
                        >
                          Mua thêm
                        </button>
                        <button
                          onClick={() => openTradeModal('SELL', h)}
                          className="px-2.5 py-1 rounded-lg bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FEE2E2] text-[11pt] font-semibold transition"
                        >
                          Bán bớt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-md w-full p-6 border border-[#DCE5FF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE5FF] pb-3">
              <h3 className="font-bold text-base text-[#172554]">
                {selectedAction.type === 'BUY' ? 'Đặt lệnh Mua' : 'Đặt lệnh Bán'} {selectedAction.symbol}
              </h3>
              <button onClick={() => setSelectedAction(null)} className="text-[#647293] hover:text-[#172554] text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#647293] font-medium block mb-1">Mã cổ phiếu</label>
                <input type="text" readOnly value={selectedAction.symbol} className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]" />
              </div>

              <div>
                <label className="text-[#647293] font-medium block mb-1">
                  Số lượng (Cổ phiếu) {selectedAction.type === 'SELL' ? `— Khả dụng: ${selectedAction.maxShares}` : ''}
                </label>
                <input 
                  type="number" 
                  step="100"
                  value={sharesInput} 
                  onChange={(e) => setSharesInput(e.target.value)} 
                  className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]" 
                />
              </div>

              <div>
                <label className="text-[#647293] font-medium block mb-1">Giá khớp dự kiến (VNĐ)</label>
                <input 
                  type="number" 
                  step="100"
                  value={priceInput} 
                  onChange={(e) => setPriceInput(e.target.value)} 
                  className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554]" 
                />
              </div>

              {/* Estimate cash summary */}
              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[#647293] space-y-1">
                <div className="flex justify-between">
                  <span>Giá trị khớp:</span>
                  <span className="font-bold text-[#172554]">
                    {(Number(sharesInput || 0) * Number(priceInput || 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#647293]">
                  <span>Phí môi giới (0.15%):</span>
                  <span>{Math.round(Number(sharesInput || 0) * Number(priceInput || 0) * 0.0015).toLocaleString('vi-VN')} đ</span>
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
                <span>Xác nhận {selectedAction.type === 'BUY' ? 'Mua' : 'Bán'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
