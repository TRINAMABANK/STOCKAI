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
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 75) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getStrategyColor = (strategy: T3Strategy) => {
    switch (strategy) {
      case 'Breakout': return 'text-emerald-600 font-semibold';
      case 'Pullback': return 'text-blue-600 font-semibold';
      case 'Momentum': return 'text-amber-600 font-semibold';
      case 'Reversal': return 'text-rose-600 font-semibold';
      default: return 'text-slate-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Thấp': return 'text-emerald-600 font-medium';
      case 'Trung bình': return 'text-amber-600 font-medium';
      case 'Cao': return 'text-rose-600 font-medium';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-4">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base text-slate-900 tracking-tight">
            Giao dịch T+3 — Cơ hội ngắn hạn
          </h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Tìm kiếm cơ hội trong 1-5 phiên
          </span>
        </div>
        {onViewAllSignals && (
          <button 
            onClick={onViewAllSignals}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả tín hiệu
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
            <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[11px]">
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
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredSignals.length > 0 ? (
              filteredSignals.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                  {/* Mã */}
                  <td className="py-3 font-bold text-slate-900 text-sm">{s.symbol}</td>
                  
                  {/* Sàn */}
                  <td className="py-3 text-slate-500">{s.exchange}</td>

                  {/* Giá hiện tại */}
                  <td className="py-3 text-right font-semibold text-slate-900 font-mono">
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
                  <td className="py-3 text-slate-700 font-mono">{s.buyZone}</td>

                  {/* Mục tiêu */}
                  <td className="py-3 text-slate-900 font-semibold font-mono">{s.targetPrice}</td>

                  {/* Cắt lỗ */}
                  <td className="py-3 text-right text-rose-600 font-semibold font-mono">
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
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200/80 transition"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(s.id);
                        }}
                        className="p-1 text-slate-300 hover:text-amber-400 transition"
                        title={s.isFavorite ? 'Bỏ theo dõi' : 'Thêm vào yêu thích'}
                      >
                        <Star 
                          className={`w-4 h-4 ${
                            s.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`} 
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Zap className="w-6 h-6 text-slate-300" />
                    <p className="font-medium text-slate-500">HIỆN TẠI KHÔNG CÓ CƠ HỘI ĐỦ ĐIỀU KIỆN T+3</p>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      Hệ thống tự động bảo vệ kỷ luật giao dịch, không cố tình phát tín hiệu khi biên độ lợi nhuận/rủi ro chưa đạt chuẩn an toàn.
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
