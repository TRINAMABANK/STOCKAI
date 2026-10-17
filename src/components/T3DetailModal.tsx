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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">{signal.symbol}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{signal.exchange}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Điểm T+3: {signal.t3Score}/100
                </span>
              </div>
              <p className="text-xs text-slate-500">{signal.companyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Chiến lược</p>
              <p className="font-bold text-indigo-600 mt-0.5">{signal.strategy}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Giá hiện tại</p>
              <p className="font-bold text-slate-900 mt-0.5">{signal.currentPrice.toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Tỷ lệ Lợi nhuận/Rủi ro</p>
              <p className="font-bold text-emerald-600 mt-0.5">{signal.rewardRiskRatio} : 1</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Mức độ rủi ro</p>
              <p className={`font-bold mt-0.5 ${
                signal.riskLevel === 'Thấp' ? 'text-emerald-600' :
                signal.riskLevel === 'Trung bình' ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {signal.riskLevel}
              </p>
            </div>
          </div>

          {/* Execution Zones */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Kế hoạch giao dịch tham khảo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs mb-1">
                  <Target className="w-4 h-4" />
                  <span>Vùng mua tích lũy</span>
                </div>
                <p className="text-base font-bold text-blue-900">{signal.buyZone}</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Thời gian nắm giữ: {signal.holdingDays}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mục tiêu chốt lời (T1/T2)</span>
                </div>
                <p className="text-base font-bold text-emerald-900">{signal.targetPrice}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Kỳ vọng lợi nhuận 5-10%</p>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Ngưỡng cắt lỗ kỷ luật</span>
                </div>
                <p className="text-base font-bold text-rose-900">{signal.stopLoss.toLocaleString('vi-VN')} đ</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Mức vô hiệu hóa chiến lược</p>
              </div>
            </div>
          </div>

          {/* Reasoning & Conditions */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Lý do chọn mã & Phân tích kỹ thuật</h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 leading-relaxed text-xs sm:text-sm">
              {signal.rationale}
            </div>
          </div>

          {/* Confirmation Condition */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Điều kiện kích hoạt & Xác nhận</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-700 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{signal.confirmationCondition}</span>
            </div>
          </div>

          {/* Risk Warning & Disclaimer */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600 p-3.5 bg-amber-50 rounded-xl border border-amber-200/80">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Rủi ro & Sự kiện cần theo dõi:</p>
              <p className="text-amber-800 mt-0.5">{signal.risksAndEvents}</p>
              <p className="text-[11px] text-amber-700 mt-1 italic">
                * Tuyên bố miễn trừ: Tín hiệu định lượng được tính tự động từ dữ liệu thị trường, không phải lời khuyên đầu tư tài chính ủy thác.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400">Thời điểm tính toán: {signal.dataTimestamp}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition"
            >
              Đóng
            </button>
            {onTradeSimulation && (
              <button
                onClick={() => {
                  onTradeSimulation(signal);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
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
