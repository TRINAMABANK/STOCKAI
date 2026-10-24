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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172554]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DCE5FF] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRejectMode ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#EBF3FF] text-[#087CFF]'}`}>
              {isRejectMode ? <XCircle className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#172554] tracking-tight">
                {isRejectMode ? 'Từ chối đơn hàng' : 'Đối soát & Kích hoạt Thuê bao'}
              </h3>
              <p className="text-[12px] text-[#647293]">Mã đơn: <span className="font-mono font-bold text-[#172554]">{order.orderCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F4F7FF] flex items-center justify-center text-[#647293] hover:text-[#172554] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1">
          {/* Order Info Card */}
          <div className="bg-[#F4F7FF] border border-[#DCE5FF] rounded-2xl p-4 text-[13px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#647293]">Khách hàng:</span>
              <span className="font-semibold text-[#172554]">{order.userName} ({order.userEmail})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#647293]">Gói đăng ký:</span>
              <span className="font-bold text-[#087CFF]">{order.tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#647293]">Số tiền phải thu:</span>
              <span className="font-mono font-bold text-[#172554] text-[15px] tabular-nums">{order.formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#647293]">Nội dung chuyển khoản chuẩn:</span>
              <span className="font-mono font-bold text-[#087CFF]">{order.transferContent}</span>
            </div>
            {order.customerReportedAt && (
              <div className="flex items-center justify-between pt-1 border-t border-[#DCE5FF] text-[11px] text-[#647293]">
                <span>Khách báo chuyển lúc:</span>
                <span className="font-mono text-[#172554]">{new Date(order.customerReportedAt).toLocaleString('vi-VN')}</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FEE2E2] text-[#9F1239] text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRejectMode ? (
            /* Reconciliation Form */
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Số tiền thực nhận từ Ngân hàng (VNĐ) <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="VD: 199000"
                    className={`w-full bg-[#FFFFFF] border rounded-xl px-3 py-2.5 font-mono text-[14px] font-bold text-[#172554] focus:outline-none ${
                      isAmountMatching ? 'border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]' : 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-[12px] font-medium text-[#647293]">VNĐ</span>
                </div>
                {!isAmountMatching && (
                  <p className="text-[11px] text-[#EF4444] font-medium mt-1">
                    ⚠️ Số tiền thực nhận không khớp số tiền phải thu ({order.formattedAmount}).
                  </p>
                )}
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Mã giao dịch ngân hàng thực tế (FT / REF) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={bankTransactionRef}
                  onChange={(e) => setBankTransactionRef(e.target.value)}
                  placeholder="VD: FT2508391209 hoặc MB12893810"
                  className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl px-3 py-2.5 font-mono text-[13px] text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
                />
                <p className="text-[11px] text-[#647293] mt-1">
                  Đối chiếu chính xác mã tham chiếu giao dịch từ thông báo biến động số dư ngân hàng.
                </p>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Thời điểm phát sinh giao dịch ngân hàng
                </label>
                <input
                  type="datetime-local"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] font-mono text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Ghi chú đối soát (tùy chọn)
                </label>
                <input
                  type="text"
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Ghi chú đối soát nội bộ..."
                  className="w-full bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
                />
              </div>

              <div className="p-3 bg-[#EBF3FF] rounded-xl border border-[#DCE5FF] text-[11px] text-[#0066D6] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#087CFF] shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ tự động cập nhật hạn dùng +30 ngày cho khách hàng và lưu lại nhật ký kiểm toán với tài khoản Admin của bạn.
                </span>
              </div>
            </div>
          ) : (
            /* Reject Form */
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Lý do từ chối đơn hàng: <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#FEE2E2] rounded-xl p-3 text-[13px] text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#EF4444]"
                  placeholder="Nhập lý do từ chối chi tiết..."
                />
              </div>
              <p className="text-[11px] text-[#647293]">
                Lý do từ chối sẽ được lưu trong lịch sử đơn hàng để khách hàng có thể kiểm tra.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#DCE5FF] bg-[#FFFFFF] flex items-center justify-between gap-3 shrink-0">
          {!isRejectMode ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejectMode(true)}
                className="px-4 py-2.5 rounded-xl border border-[#FEE2E2] text-[#EF4444] hover:bg-[#FFF1F2] font-medium text-[13px] transition"
              >
                Từ chối
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE5FF] hover:bg-[#F4F7FF] text-[#172554] font-medium text-[13px] transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting || !isAmountMatching || !bankTransactionRef.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white font-medium text-[13px] transition flex items-center gap-1.5 shadow-xs"
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
                className="px-4 py-2.5 rounded-xl border border-[#DCE5FF] text-[#172554] hover:bg-[#F4F7FF] font-medium text-[13px] transition"
              >
                Quay lại đối soát
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 text-white font-medium text-[13px] transition flex items-center gap-1.5 shadow-xs"
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
