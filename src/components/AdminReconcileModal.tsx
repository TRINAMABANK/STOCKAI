'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  CreditCard,
  User,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { SubscriptionOrder } from '@/types';

interface AdminReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SubscriptionOrder | null;
  onSuccess: (msg: string) => void;
}

export default function AdminReconcileModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: AdminReconcileModalProps) {
  const [actualAmount, setActualAmount] = useState<string>('');
  const [bankTransactionRef, setBankTransactionRef] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [reconciliationNotes, setReconciliationNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reject sub-view state
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Chưa nhận được giao dịch chuyển khoản khớp với số tiền hoặc nội dung đơn hàng.');

  useEffect(() => {
    if (order) {
      setActualAmount(String(order.amount));
      setBankTransactionRef(order.bankTransactionRef || '');
      setTransactionTime(new Date().toISOString().slice(0, 16));
      setReconciliationNotes('');
      setErrorMsg(null);
      setIsRejectMode(false);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const parsedActualAmount = parseInt(actualAmount.replace(/\D/g, ''), 10) || 0;
  const isAmountMatching = parsedActualAmount === order.amount;

  const handleVerify = async () => {
    setErrorMsg(null);

    if (!bankTransactionRef.trim()) {
      setErrorMsg('Vui lòng nhập Mã giao dịch ngân hàng thực tế (FT / GD / REF từ sao kê).');
      return;
    }

    if (!isAmountMatching) {
      setErrorMsg(`Số tiền thực nhận (${parsedActualAmount.toLocaleString('vi-VN')} đ) không khớp với số tiền phải thu (${order.amount.toLocaleString('vi-VN')} đ). Không được phép duyệt!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_PAYMENT',
          orderId: order.id,
          actualAmount: parsedActualAmount,
          bankTransactionRef: bankTransactionRef.trim(),
          transactionTime: new Date(transactionTime).toISOString(),
          notes: reconciliationNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || 'Đã đối soát thành công và kích hoạt gói!');
        onClose();
      } else {
        setErrorMsg(data.message || 'Lỗi đối soát thanh toán.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ quản trị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg('Vui lòng nhập lý do từ chối.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_PAYMENT',
          orderId: order.id,
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || 'Đã từ chối đơn hàng thành công.');
        onClose();
      } else {
        setErrorMsg(data.message || 'Lỗi khi từ chối đơn hàng.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRejectMode ? 'bg-[#FFE4E6] text-[#F43F5E]' : 'bg-[#E0F2FE] text-[#008FD3]'}`}>
              {isRejectMode ? <XCircle className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#172033] tracking-tight">
                {isRejectMode ? 'Từ chối đơn hàng' : 'Đối soát & Kích hoạt Thuê bao'}
              </h3>
              <p className="text-[12px] text-[#64748B]">Mã đơn: <span className="font-mono font-bold text-[#172033]">{order.orderCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F5F8FC] flex items-center justify-center text-[#64748B] hover:text-[#172033] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1">
          {/* Order Info Card */}
          <div className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-2xl p-4 text-[13px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Khách hàng:</span>
              <span className="font-semibold text-[#172033]">{order.userName} ({order.userEmail})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Gói đăng ký:</span>
              <span className="font-bold text-[#008FD3]">{order.tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Số tiền phải thu:</span>
              <span className="font-mono font-bold text-[#172033] text-[15px] tabular-nums">{order.formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Nội dung chuyển khoản chuẩn:</span>
              <span className="font-mono font-bold text-[#008FD3]">{order.transferContent}</span>
            </div>
            {order.customerReportedAt && (
              <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                <span>Khách báo chuyển lúc:</span>
                <span className="font-mono text-[#172033]">{new Date(order.customerReportedAt).toLocaleString('vi-VN')}</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRejectMode ? (
            /* Reconciliation Form */
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-[#172033] block mb-1">
                  Số tiền thực nhận từ Ngân hàng (VNĐ) <span className="text-[#F43F5E]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="VD: 199000"
                    className={`w-full bg-[#FFFFFF] border rounded-xl px-3 py-2.5 font-mono text-[14px] font-bold text-[#172033] focus:outline-none ${
                      isAmountMatching ? 'border-[#10B981] focus:ring-1 focus:ring-[#10B981]' : 'border-[#F43F5E] focus:ring-1 focus:ring-[#F43F5E]'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-[12px] font-medium text-[#64748B]">VNĐ</span>
                </div>
                {!isAmountMatching && (
                  <p className="text-[11px] text-[#F43F5E] font-medium mt-1">
                    ⚠️ Số tiền thực nhận không khớp số tiền phải thu ({order.formattedAmount}).
                  </p>
                )}
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172033] block mb-1">
                  Mã giao dịch ngân hàng thực tế (FT / REF) <span className="text-[#F43F5E]">*</span>
                </label>
                <input
                  type="text"
                  value={bankTransactionRef}
                  onChange={(e) => setBankTransactionRef(e.target.value)}
                  placeholder="VD: FT2508391209 hoặc MB12893810"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2.5 font-mono text-[13px] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  Đối chiếu chính xác mã tham chiếu giao dịch từ thông báo biến động số dư ngân hàng.
                </p>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172033] block mb-1">
                  Thời điểm phát sinh giao dịch ngân hàng
                </label>
                <input
                  type="datetime-local"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] font-mono text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172033] block mb-1">
                  Ghi chú đối soát (tùy chọn)
                </label>
                <input
                  type="text"
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Ghi chú đối soát nội bộ..."
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                />
              </div>

              <div className="p-3 bg-[#E0F2FE] rounded-xl border border-[#BAE6FD] text-[11px] text-[#0369A1] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#008FD3] shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ tự động cập nhật hạn dùng +30 ngày cho khách hàng và lưu lại nhật ký kiểm toán với tài khoản Admin của bạn.
                </span>
              </div>
            </div>
          ) : (
            /* Reject Form */
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#172033] block mb-1">
                  Lý do từ chối đơn hàng: <span className="text-[#F43F5E]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#FECDD3] rounded-xl p-3 text-[13px] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#F43F5E]"
                  placeholder="Nhập lý do từ chối chi tiết..."
                />
              </div>
              <p className="text-[11px] text-[#64748B]">
                Lý do từ chối sẽ được lưu trong lịch sử đơn hàng để khách hàng có thể kiểm tra.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-3 shrink-0">
          {!isRejectMode ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejectMode(true)}
                className="px-4 py-2.5 rounded-xl border border-[#FECDD3] text-[#F43F5E] hover:bg-[#FFF1F2] font-medium text-[13px] transition"
              >
                Từ chối
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F5F8FC] text-[#172033] font-medium text-[13px] transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting || !isAmountMatching || !bankTransactionRef.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-white font-medium text-[13px] transition flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Xác nhận & Kích hoạt gói</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRejectMode(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#172033] hover:bg-[#F5F8FC] font-medium text-[13px] transition"
              >
                Quay lại đối soát
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#F43F5E] hover:bg-[#E11D48] disabled:opacity-40 text-white font-medium text-[13px] transition flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Xác nhận từ chối</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
