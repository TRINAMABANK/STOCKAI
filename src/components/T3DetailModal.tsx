'use client';

import React from 'react';
import { X, ShieldAlert, CheckCircle, TrendingUp, Target, AlertTriangle, ArrowRight } from 'lucide-react';
import { T3Signal } from '@/types';

interface T3DetailModalProps {
  signal: T3Signal | null;
  onClose: () => void;
  onTradeSimulation?: (signal: T3Signal) => void;
}

export default function T3DetailModal({
  signal,
  onClose,
  onTradeSimulation,
}: T3DetailModalProps) {
  if (!signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full border border-[#DCE5FF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#DCE5FF] flex items-center justify-between bg-[#F4F7FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] border border-[#DCE5FF] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#087CFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[20px] text-[#172554] tracking-tight">{signal.symbol}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-white text-[#647293] font-semibold border border-[#DCE5FF]">{signal.exchange}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold font-mono tabular-nums">
                  Điểm T+3: {signal.t3Score}/100
                </span>
              </div>
              <p className="text-[13px] text-[#647293] font-medium">{signal.companyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#647293] hover:text-[#172554] hover:bg-[#DCE5FF] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F7FF] p-4 rounded-xl border border-[#DCE5FF]">
            <div>
              <p className="text-[12px] text-[#647293] font-medium">Chiến lược</p>
              <p className="font-semibold text-[#087CFF] text-[14px] mt-0.5">{signal.strategy}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#647293] font-medium">Giá hiện tại</p>
              <p className="font-bold text-[#172554] font-mono tabular-nums text-[14px] mt-0.5">{signal.currentPrice.toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
              <p className="text-[12px] text-[#647293] font-medium">Tỷ lệ Lợi nhuận/Rủi ro</p>
              <p className="font-bold text-[#16A34A] font-mono tabular-nums text-[14px] mt-0.5">{signal.rewardRiskRatio} : 1</p>
            </div>
            <div>
              <p className="text-[12px] text-[#647293] font-medium">Mức độ rủi ro</p>
              <p className={`font-semibold text-[14px] mt-0.5 ${
                signal.riskLevel === 'Thấp' ? 'text-[#16A34A]' :
                signal.riskLevel === 'Trung bình' ? 'text-[#D97706]' : 'text-[#EF4444]'
              }`}>
                {signal.riskLevel}
              </p>
            </div>
          </div>

          {/* Execution Zones */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[13px] text-[#647293] uppercase tracking-wider">Kế hoạch giao dịch tham khảo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-[#DCE5FF] bg-[#F0F9FF]">
                <div className="flex items-center gap-1.5 text-[#087CFF] font-semibold text-xs mb-1">
                  <Target className="w-4 h-4" />
                  <span>Vùng mua tích lũy</span>
                </div>
                <p className="text-base font-bold text-[#172554] font-mono tabular-nums">{signal.buyZone}</p>
                <p className="text-[12px] text-[#647293] mt-0.5 font-medium">Thời gian: {signal.holdingDays}</p>
              </div>

              <div className="p-4 rounded-xl border border-[#BBF7D0] bg-[#ECFDF5]">
                <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold text-xs mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mục tiêu chốt lời (T1/T2)</span>
                </div>
                <p className="text-base font-bold text-[#172554] font-mono tabular-nums">{signal.targetPrice}</p>
                <p className="text-[12px] text-[#16A34A] mt-0.5 font-semibold">Kỳ vọng lợi nhuận 5-10%</p>
              </div>

              <div className="p-4 rounded-xl border border-[#FEE2E2] bg-[#FFF1F2]">
                <div className="flex items-center gap-1.5 text-[#EF4444] font-semibold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Ngưỡng cắt lỗ kỷ luật</span>
                </div>
                <p className="text-base font-bold text-[#EF4444] font-mono tabular-nums">
                  {signal.stopLoss < 1000 ? signal.stopLoss.toFixed(1) : (signal.stopLoss / 1000).toFixed(1)} ({signal.stopLoss < 1000 ? (signal.stopLoss * 1000).toLocaleString('vi-VN') : signal.stopLoss.toLocaleString('vi-VN')} đ)
                </p>
                <p className="text-[12px] text-[#EF4444] mt-0.5 font-medium">Mức vô hiệu hóa chiến lược</p>
              </div>
            </div>
          </div>

          {/* Reasoning & Conditions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[13px] text-[#647293] uppercase tracking-wider">Lý do chọn mã & Phân tích kỹ thuật</h4>
            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[#172554] leading-relaxed text-[13px]">
              {signal.rationale}
            </div>
          </div>

          {/* Confirmation Condition */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs text-[#647293] uppercase tracking-wider">Điều kiện kích hoạt & Xác nhận</h4>
            <div className="flex items-start gap-2.5 text-xs text-[#172554] p-3 bg-[#ECFDF5] rounded-xl border border-[#BBF7D0]">
              <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>{signal.confirmationCondition}</span>
            </div>
          </div>

          {/* Risk Warning & Disclaimer */}
          <div className="flex items-start gap-2.5 text-xs text-[#647293] p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#92400E]">Rủi ro & Sự kiện cần theo dõi:</p>
              <p className="text-[#B45309] mt-0.5">{signal.risksAndEvents}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DCE5FF] bg-[#F4F7FF] flex items-center justify-between">
          <span className="text-xs text-[#647293]">Thời điểm tính toán: {signal.dataTimestamp}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647293] hover:bg-[#DCE5FF] transition"
            >
              Đóng
            </button>
            {onTradeSimulation && (
              <button
                onClick={() => {
                  onTradeSimulation(signal);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#087CFF] hover:bg-[#0066D6] text-white transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Mô phỏng vào lệnh Mua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
