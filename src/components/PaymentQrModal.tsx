'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  CreditCard,
  Building,
  User,
  ArrowRight,
  Info
} from 'lucide-react';
import { SubscriptionOrder, BankConfig, SubscriptionTier } from '@/types';

import Logo from './Logo';

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: SubscriptionTier;
  orderData?: {
    order: SubscriptionOrder;
    bankConfig: BankConfig;
    isBankConfigured: boolean;
    qrUrl?: string;
  } | null;
  onOrderUpdated?: () => void;
}

export default function PaymentQrModal({
  isOpen,
  onClose,
  tier,
  orderData,
  onOrderUpdated,
}: PaymentQrModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00
  const [currentOrder, setCurrentOrder] = useState<SubscriptionOrder | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [qrError, setQrError] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (orderData) {
      setCurrentOrder(orderData.order);
      setBankConfig(orderData.bankConfig);
      setIsReported(orderData.order.status === 'PENDING_CONFIRMATION' || orderData.order.status === 'PAID');
      setTimeLeft(900);
      setQrError(false);
    }
  }, [orderData]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isReported) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isReported]);

  if (!isOpen || !currentOrder) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReportPayment = async () => {
    if (!currentOrder) return;
    setIsSubmittingReport(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPORT_PAYMENT',
          orderId: currentOrder.id,
          note: `Khách báo đã chuyển khoản ${currentOrder.formattedAmount} cho đơn ${currentOrder.orderCode}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsReported(true);
        setCurrentOrder(data.data);
        setStatusMessage('✅ Đã gửi thông báo chuyển khoản thành công. Đơn hàng đang được Admin đối soát!');
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setStatusMessage(`❌ ${data.message}`);
      }
    } catch {
      setStatusMessage('❌ Không thể kết nối máy chủ để gửi thông báo.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCheckLiveStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      if (data.success && data.data.recentOrders) {
        const found = data.data.recentOrders.find((o: SubscriptionOrder) => o.id === currentOrder.id);
        if (found) {
          setCurrentOrder(found);
          if (found.status === 'PAID') {
            setIsReported(true);
            setStatusMessage('🎉 Đơn hàng đã được Admin đối soát & Kích hoạt thành công!');
            if (onOrderUpdated) onOrderUpdated();
          } else if (found.status === 'REJECTED') {
            setStatusMessage(`⚠️ Đơn hàng bị từ chối: ${found.rejectionReason || 'Không xác định'}`);
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const isBankReady = bankConfig && bankConfig.isConfigured && Boolean(bankConfig.accountNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="default" />
            <div>
              <h3 className="text-[17px] font-bold text-[#172033] tracking-tight">
                Thanh toán Gói {currentOrder.tier === 'PRO' ? 'Chuyên Nghiệp (PRO)' : 'Nâng Cao (ENTERPRISE)'}
              </h3>
              <p className="text-[12px] text-[#64748B]">Mã đơn: <span className="font-mono font-semibold text-[#172033]">{currentOrder.orderCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F5F8FC] flex items-center justify-center text-[#64748B] hover:text-[#172033] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Top Order Amount Card */}
          <div className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-[#64748B] block">Số tiền thanh toán:</span>
              <span className="text-[24px] font-bold text-[#008FD3] font-mono tabular-nums tracking-tight">
                {currentOrder.formattedAmount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-[#64748B] block">Hạn giữ đơn:</span>
              <div className="flex items-center gap-1 font-mono text-[14px] font-bold text-[#F43F5E]">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Status Alert if Reported or Paid */}
          {currentOrder.status === 'PAID' ? (
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span>Đã kích hoạt gói thuê bao thành công!</span>
              </div>
              <p className="text-[12px] text-[#047857]">
                Tài khoản của bạn đã được nâng cấp lên gói {currentOrder.tier}. Toàn bộ tính năng phân tích nâng cao đã sẵn sàng sử dụng.
              </p>
            </div>
          ) : isReported || currentOrder.status === 'PENDING_CONFIRMATION' ? (
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[14px] text-[#B45309]">
                <RefreshCw className="w-4 h-4 text-[#F59E0B] animate-spin" />
                <span>Đang chờ Admin đối soát & xác nhận</span>
              </div>
              <p className="text-[12px] text-[#92400E] leading-relaxed">
                Chúng tôi đã nhận được thông báo chuyển tiền của bạn cho đơn <strong>{currentOrder.orderCode}</strong>.
                Admin StockAI sẽ kiểm tra giao dịch thực tế trên tài khoản ngân hàng và kích hoạt quyền trong ít phút.
              </p>
              <button
                onClick={handleCheckLiveStatus}
                disabled={isCheckingStatus}
                className="mt-1 text-[12px] font-semibold text-[#008FD3] hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>Kiểm tra lại trạng thái duyệt ngay</span>
              </button>
            </div>
          ) : null}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[12px] font-medium text-[#008FD3]">
              {statusMessage}
            </div>
          )}

          {/* QR & Bank Info Area */}
          {isBankReady ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* QR Image */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#F5F8FC] border border-[#E2E8F0] rounded-2xl text-center">
                <span className="text-[11px] font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
                  Quét mã VietQR thanh toán nhanh
                </span>
                <div className="w-[190px] h-[190px] bg-white p-2 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-center">
                  {currentOrder.qrUrl && !qrError ? (
                    <img
                      src={currentOrder.qrUrl}
                      alt="VietQR StockAI"
                      className="w-full h-full object-contain"
                      onError={() => setQrError(true)}
                    />
                  ) : (
                    <div className="text-center p-2 text-xs text-[#64748B]">
                      <QrCode className="w-8 h-8 text-[#008FD3] mx-auto mb-1" />
                      <span>Quét QR tự động</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-2">
                  Hỗ trợ app tất cả ngân hàng Việt Nam
                </p>
              </div>

              {/* Bank Details Table */}
              <div className="space-y-2.5 text-[12px]">
                <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Ngân hàng:</span>
                    <span className="font-semibold text-[#172033]">{bankConfig?.bankName} ({bankConfig?.bankId})</span>
                  </div>
                  <button
                    onClick={() => handleCopy(bankConfig?.bankName || '', 'bank')}
                    className="p-1.5 hover:bg-[#F5F8FC] rounded text-[#008FD3] transition"
                    title="Sao chép"
                  >
                    {copiedField === 'bank' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Số tài khoản:</span>
                    <span className="font-mono font-bold text-[#172033] text-[14px]">{bankConfig?.accountNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(bankConfig?.accountNumber || '', 'acc')}
                    className="p-1.5 hover:bg-[#F5F8FC] rounded text-[#008FD3] transition"
                    title="Sao chép"
                  >
                    {copiedField === 'acc' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Chủ tài khoản:</span>
                    <span className="font-bold text-[#172033] uppercase">{bankConfig?.accountHolder}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(bankConfig?.accountHolder || '', 'holder')}
                    className="p-1.5 hover:bg-[#F5F8FC] rounded text-[#008FD3] transition"
                    title="Sao chép"
                  >
                    {copiedField === 'holder' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-2.5 bg-[#E0F2FE] border border-[#BAE6FD] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[#0369A1] block text-[11px] font-semibold">Nội dung chuyển khoản (bắt buộc):</span>
                    <span className="font-mono font-bold text-[#008FD3] text-[14px]">{currentOrder.transferContent}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(currentOrder.transferContent, 'memo')}
                    className="p-1.5 hover:bg-white/60 rounded text-[#008FD3] transition"
                    title="Sao chép"
                  >
                    {copiedField === 'memo' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Unconfigured Bank Notice */
            <div className="p-5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-[#F43F5E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[14px] text-[#9F1239]">Hệ thống thanh toán tự động đang được cấu hình</h4>
                  <p className="text-[12px] text-[#BE123C] mt-1 leading-relaxed">
                    Tài khoản ngân hàng của chủ hệ thống StockAI chưa được kích hoạt công khai trên cổng này.
                    Theo nguyên tắc bảo mật và minh bạch tài chính, StockAI không tạo mã QR giả lập hoặc chấp nhận thanh toán khi chưa có tài khoản ngân hàng chính thức.
                  </p>
                  <p className="text-[12px] text-[#9F1239] mt-2 font-medium">
                    👉 Quản trị viên: Vui lòng vào mục <strong>Admin Quản trị Thuê bao & Cấu hình Ngân hàng</strong> để nhập thông tin ngân hàng thụ hưởng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-[#F5F8FC] rounded-xl border border-[#E2E8F0] flex items-center gap-2 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>Mỗi đơn hàng được định danh riêng. Bấm &quot;Tôi đã chuyển khoản&quot; sau khi hoàn tất giao dịch để chuyển vào hàng đợi đối soát.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#E2E8F0] bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F5F8FC] text-[#172033] font-medium text-[13px] transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {currentOrder.status !== 'PAID' && (
              <button
                onClick={handleReportPayment}
                disabled={isSubmittingReport || isReported}
                className="px-5 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] disabled:opacity-50 text-white font-medium text-[13px] transition shadow-xs flex items-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi thông báo...</span>
                  </>
                ) : isReported ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã gửi - Đang chờ Admin duyệt</span>
                  </>
                ) : (
                  <>
                    <span>Tôi đã chuyển khoản</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
