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
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Danh mục đầu tư cá nhân</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Theo dõi vị thế cổ phiếu nắm giữ, tỷ trọng và hiệu suất thực tế</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-[#64748B]">Tổng giá trị cổ phiếu</p>
            <p className="text-lg font-bold text-[#172033] font-mono">{summary.stockValue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#172033]">Chi tiết cổ phiếu đang nắm giữ ({holdings.length} mã)</h3>
          <span className="text-xs text-[#10B981] font-bold">
            Lãi chưa thực hiện: +{summary.unrealizedPnL.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold">Ngành</th>
                <th className="py-3 px-4 font-semibold text-right">Khối lượng</th>
                <th className="py-3 px-4 font-semibold text-right">Giá vốn (BQ)</th>
                <th className="py-3 px-4 font-semibold text-right">Giá thị trường</th>
                <th className="py-3 px-4 font-semibold text-right">Giá trị TT</th>
                <th className="py-3 px-4 font-semibold text-right">Lãi/Lỗ (%)</th>
                <th className="py-3 px-4 font-semibold text-center">Tỷ trọng</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {holdings.map((h) => {
                const isProfitable = h.unrealizedPnL >= 0;
                return (
                  <tr key={h.id} className="hover:bg-[#F5F8FC] transition">
                    <td className="py-3.5 px-4 font-bold text-[#008FD3] cursor-pointer" onClick={() => onSelectStock(h.symbol)}>
                      {h.symbol}
                      <span className="block text-[10px] text-[#64748B] font-normal">{h.companyName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{h.sector}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#172033] font-mono">{h.shares.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-[#64748B] font-mono">{h.costBasis.toLocaleString('vi-VN')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#172033] font-mono">{h.currentPrice.toLocaleString('vi-VN')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#172033] font-mono">{h.marketValue.toLocaleString('vi-VN')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-bold font-mono ${isProfitable ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                        {isProfitable ? '+' : ''}{h.unrealizedPnLPercent}%
                      </span>
                      <span className="block text-[10px] text-[#64748B] font-mono">
                        {isProfitable ? '+' : ''}{h.unrealizedPnL.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F8FC] border border-[#E2E8F0] text-[#172033] font-bold text-[11px]">
                        {h.weightPercent}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTradeModal('BUY', h)}
                          className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#008FD3] hover:bg-[#BAE6FD] text-[11px] font-bold transition"
                        >
                          Mua thêm
                        </button>
                        <button
                          onClick={() => openTradeModal('SELL', h)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFE4E6] text-[#F43F5E] hover:bg-[#FECDD3] text-[11px] font-bold transition"
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
          <div className="bg-[#FFFFFF] rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-base text-[#172033]">
                {selectedAction.type === 'BUY' ? 'Đặt lệnh Mua' : 'Đặt lệnh Bán'} {selectedAction.symbol}
              </h3>
              <button onClick={() => setSelectedAction(null)} className="text-[#64748B] hover:text-[#172033] text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#64748B] font-medium block mb-1">Mã cổ phiếu</label>
                <input type="text" readOnly value={selectedAction.symbol} className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]" />
              </div>

              <div>
                <label className="text-[#64748B] font-medium block mb-1">
                  Số lượng (Cổ phiếu) {selectedAction.type === 'SELL' ? `— Khả dụng: ${selectedAction.maxShares}` : ''}
                </label>
                <input 
                  type="number" 
                  step="100"
                  value={sharesInput} 
                  onChange={(e) => setSharesInput(e.target.value)} 
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]" 
                />
              </div>

              <div>
                <label className="text-[#64748B] font-medium block mb-1">Giá khớp dự kiến (VNĐ)</label>
                <input 
                  type="number" 
                  step="100"
                  value={priceInput} 
                  onChange={(e) => setPriceInput(e.target.value)} 
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]" 
                />
              </div>

              {/* Estimate cash summary */}
              <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B] space-y-1">
                <div className="flex justify-between">
                  <span>Giá trị khớp:</span>
                  <span className="font-bold text-[#172033]">
                    {(Number(sharesInput || 0) * Number(priceInput || 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Phí môi giới (0.15%):</span>
                  <span>{Math.round(Number(sharesInput || 0) * Number(priceInput || 0) * 0.0015).toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedAction.type === 'SELL' && (
                  <div className="flex justify-between text-[11px] text-[#64748B]">
                    <span>Thuế TNCN bán (0.1%):</span>
                    <span>{Math.round(Number(sharesInput || 0) * Number(priceInput || 0) * 0.0010).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {tradeMessage && <p className="text-xs font-bold text-[#008FD3]">{tradeMessage}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F5F8FC]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteTrade}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs ${
                  selectedAction.type === 'BUY' ? 'bg-[#008FD3] hover:bg-[#007bb8]' : 'bg-[#F43F5E] hover:bg-[#e11d48]'
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
