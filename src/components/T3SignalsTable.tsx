'use client';

import React, { useState } from 'react';
import { Star, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { T3Signal, T3Strategy } from '@/types';

interface T3SignalsTableProps {
  signals: T3Signal[];
  onSelectSignal: (signal: T3Signal) => void;
  onToggleFavorite: (signalId: string) => void;
  onViewAllSignals?: () => void;
}

export default function T3SignalsTable({
  signals,
  onSelectSignal,
  onToggleFavorite,
  onViewAllSignals,
}: T3SignalsTableProps) {
  const [activeTab, setActiveTab] = useState<'all' | T3Strategy>('all');

  const tabs: Array<{ id: 'all' | T3Strategy; label: string }> = [
    { id: 'all', label: 'Tín hiệu hôm nay' },
    { id: 'Breakout', label: 'Breakout' },
    { id: 'Pullback', label: 'Pullback' },
    { id: 'Momentum', label: 'Momentum' },
    { id: 'Reversal', label: 'Reversal' },
  ];

  const filteredSignals = activeTab === 'all' 
    ? signals 
    : signals.filter(s => s.strategy.toLowerCase() === activeTab.toLowerCase());

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-[#D1FAE5] text-[#10B981] border-[#A7F3D0]';
    return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
  };

  const getStrategyColor = (strategy: T3Strategy) => {
    switch (strategy) {
      case 'Breakout': return 'text-[#10B981] font-bold';
      case 'Pullback': return 'text-[#008FD3] font-bold';
      case 'Momentum': return 'text-[#D97706] font-bold';
      case 'Reversal': return 'text-[#8B5CF6] font-bold';
      default: return 'text-[#172033] font-medium';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Thấp': return 'text-[#10B981] font-semibold';
      case 'Trung bình': return 'text-[#D97706] font-semibold';
      case 'Cao': return 'text-[#F43F5E] font-semibold';
      default: return 'text-[#64748B] font-medium';
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base text-[#172033] tracking-tight">
            Giao dịch T+3 — Cơ hội ngắn hạn
          </h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
            Tìm kiếm cơ hội trong 1-5 phiên
          </span>
        </div>
        {onViewAllSignals && (
          <button 
            onClick={onViewAllSignals}
            className="text-xs text-[#008FD3] hover:text-[#007bb8] font-semibold transition"
          >
            Xem tất cả tín hiệu
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] shadow-2xs'
                  : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172033]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[#64748B] border-b border-[#E2E8F0] uppercase tracking-wider text-[11px]">
              <th className="pb-2.5 font-semibold">Mã</th>
              <th className="pb-2.5 font-semibold">Sàn</th>
              <th className="pb-2.5 font-semibold text-right">Giá hiện tại</th>
              <th className="pb-2.5 font-semibold text-center">Điểm T+3</th>
              <th className="pb-2.5 font-semibold">Chiến lược</th>
              <th className="pb-2.5 font-semibold">Vùng mua</th>
              <th className="pb-2.5 font-semibold">Mục tiêu</th>
              <th className="pb-2.5 font-semibold text-right">Cắt lỗ</th>
              <th className="pb-2.5 font-semibold text-center">Rủi ro</th>
              <th className="pb-2.5 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-medium">
            {filteredSignals.length > 0 ? (
              filteredSignals.map((s) => (
                <tr key={s.id} className="hover:bg-[#F5F8FC] transition group">
                  {/* Mã */}
                  <td className="py-3 font-bold text-[#008FD3] text-sm">{s.symbol}</td>
                  
                  {/* Sàn */}
                  <td className="py-3 text-[#64748B]">{s.exchange}</td>

                  {/* Giá hiện tại */}
                  <td className="py-3 text-right font-bold text-[#172033] font-mono">
                    {s.currentPrice.toLocaleString('vi-VN')}
                  </td>

                  {/* Điểm T+3 */}
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBadgeClass(s.t3Score)}`}>
                      {s.t3Score}
                    </span>
                  </td>

                  {/* Chiến lược */}
                  <td className={`py-3 ${getStrategyColor(s.strategy)}`}>
                    {s.strategy}
                  </td>

                  {/* Vùng mua */}
                  <td className="py-3 text-[#172033] font-mono">{s.buyZone}</td>

                  {/* Mục tiêu */}
                  <td className="py-3 text-[#172033] font-bold font-mono">{s.targetPrice}</td>

                  {/* Cắt lỗ */}
                  <td className="py-3 text-right text-[#F43F5E] font-bold font-mono">
                    {(s.stopLoss / 1000).toFixed(1)}
                  </td>

                  {/* Rủi ro */}
                  <td className={`py-3 text-center ${getRiskColor(s.riskLevel)}`}>
                    {s.riskLevel}
                  </td>

                  {/* Thao tác: Xem chi tiết & Bookmark Star */}
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectSignal(s)}
                        className="px-3 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#008FD3] font-semibold text-[11px] transition"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(s.id);
                        }}
                        className="p-1 text-[#CBD5E1] hover:text-[#F59E0B] transition"
                        title={s.isFavorite ? 'Bỏ theo dõi' : 'Thêm vào yêu thích'}
                      >
                        <Star 
                          className={`w-4 h-4 ${
                            s.isFavorite ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'
                          }`} 
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#64748B]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Zap className="w-6 h-6 text-[#94A3B8]" />
                    <p className="font-semibold text-[#172033]">HIỆN TẠI KHÔNG CÓ CƠ HỘI ĐỦ ĐIỀU KIỆN T+3</p>
                    <p className="text-[11px] text-[#64748B] max-w-md">
                      Hệ thống tự động bảo vệ kỷ luật giao dịch, không phát tín hiệu khi biên độ lợi nhuận/rủi ro chưa đạt chuẩn an toàn.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
