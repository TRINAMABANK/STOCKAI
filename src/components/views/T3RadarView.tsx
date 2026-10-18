'use client';

import React, { useState } from 'react';
import { Zap, ShieldCheck, AlertTriangle, Target, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { T3Signal, T3Strategy } from '@/types';
import T3SignalsTable from '@/components/T3SignalsTable';

interface T3RadarViewProps {
  signals: T3Signal[];
  onSelectSignal: (signal: T3Signal) => void;
  onToggleFavorite: (signalId: string) => void;
  onRefreshSignals: () => void;
}

export default function T3RadarView({
  signals,
  onSelectSignal,
  onToggleFavorite,
  onRefreshSignals,
}: T3RadarViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">Hệ thống Phát hiện Tín hiệu Giao dịch T+3</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] text-xs font-bold border border-[#BAE6FD]">
              Định lượng 1-5 phiên
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Xác định điểm bùng nổ, vùng mua an toàn và quản trị tỷ lệ R:R bằng công thức toán học</p>
        </div>
        <button
          onClick={onRefreshSignals}
          className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#008FD3] hover:bg-[#E0F2FE] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#008FD3]" />
          <span>Quét lại tín hiệu toàn thị trường</span>
        </button>
      </div>

      {/* 4 Strategy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            <h4 className="font-bold text-[#172033]">Breakout (Phá nền)</h4>
          </div>
          <p className="text-[#64748B] text-[11px] leading-relaxed">
            Giá vượt đỉnh kháng cự 20 phiên kèm khối lượng bùng nổ &gt; 1.5x TB20 phiên. Điểm mua phiên phá vỡ.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008FD3]"></span>
            <h4 className="font-bold text-[#172033]">Pullback (Điều chỉnh)</h4>
          </div>
          <p className="text-[#64748B] text-[11px] leading-relaxed">
            Cổ phiếu test lại đường EMA20/MA50 hỗ trợ trong xu hướng tăng với thanh khoản cạn kiệt, nến rút chân.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
            <h4 className="font-bold text-[#172033]">Momentum (Động lượng)</h4>
          </div>
          <p className="text-[#64748B] text-[11px] leading-relaxed">
            Động lượng giá dốc lên mạnh mẽ, RSI 60-72, dòng tiền lớn duy trì áp đảo, nắm giữ theo đà tăng.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
            <h4 className="font-bold text-[#172033]">Reversal (Đảo chiều đáy)</h4>
          </div>
          <p className="text-[#64748B] text-[11px] leading-relaxed">
            Phát hiện phân kỳ dương kép RSI hoặc kiểm tra hỗ trợ đáy cứng, xuất hiện lực cầu bắt đáy có xác nhận.
          </p>
        </div>
      </div>

      {/* Rules Banner - FireAnt Light Theme */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] text-[#172033] text-xs border border-[#E2E8F0] shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-[#D97706]">
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          <span>KỶ LUẬT VÀ NGUYÊN TẮC QUẢN TRỊ RỦI RO BẮT BUỘC TRONG T+3:</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#64748B] text-[11px] pt-1">
          <li className="flex items-center gap-1.5">
            <span className="text-[#10B981] font-bold">✓</span>
            <span>Không mua đuổi khi cổ phiếu đã tăng trần hoặc RSI &gt; 78.</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-[#10B981] font-bold">✓</span>
            <span>Luôn tuân thủ mức vô hiệu hóa (Cắt lỗ dứt khoát khi giá đóng cửa dưới mốc cắt lỗ).</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-[#10B981] font-bold">✓</span>
            <span>Thời gian nắm giữ chuẩn: 1 đến 5 phiên; chủ động chốt lời 50% khi chạm Mục tiêu 1.</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-[#10B981] font-bold">✓</span>
            <span>Hệ thống chỉ cung cấp cơ hội nghiên cứu, không cam kết lợi nhuận tài chính.</span>
          </li>
        </ul>
      </div>

      {/* T3 Table */}
      <T3SignalsTable
        signals={signals}
        onSelectSignal={onSelectSignal}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}
