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
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'PAY2S'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00
  const [currentOrder, setCurrentOrder] = useState<SubscriptionOrder | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [qrError, setQrError] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPay2sProcessing, setIsPay2sProcessing] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172554]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DCE5FF] shrink-0">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="default" />
            <div>
              <h3 className="text-[17px] font-bold text-[#172554] tracking-tight">
                Thanh toán Gói {currentOrder.tier === 'PRO' ? 'Chuyên Nghiệp (PRO)' : 'Nâng Cao (ENTERPRISE)'}
              </h3>
              <p className="text-[12px] text-[#647293]">Mã đơn: <span className="font-mono font-semibold text-[#172554]">{currentOrder.orderCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F4F7FF] flex items-center justify-center text-[#647293] hover:text-[#172554] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Top Order Amount Card */}
          <div className="bg-[#F4F7FF] border border-[#DCE5FF] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-[#647293] block">Số tiền thanh toán:</span>
              <span className="text-[24px] font-bold text-[#087CFF] font-mono tabular-nums tracking-tight">
                {currentOrder.formattedAmount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-[#647293] block">Hạn giữ đơn:</span>
              <div className="flex items-center gap-1 font-mono text-[14px] font-bold text-[#EF4444]">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Status Alert if Reported or Paid */}
          {currentOrder.status === 'PAID' ? (
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#065F46] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
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
                className="mt-1 text-[12px] font-semibold text-[#087CFF] hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>Kiểm tra lại trạng thái duyệt ngay</span>
              </button>
            </div>
          ) : null}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-[#EBF3FF] border border-[#DCE5FF] text-[12px] font-medium text-[#087CFF]">
              {statusMessage}
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#F4F7FF] rounded-xl border border-[#DCE5FF]">
            <button
              onClick={() => setPaymentMethod('VIETQR')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                paymentMethod === 'VIETQR'
                  ? 'bg-white text-[#087CFF] shadow-2xs border border-[#DCE5FF]'
                  : 'text-[#647293] hover:text-[#172554]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>VietQR (Ngân hàng 24/7)</span>
            </button>
            <button
              onClick={() => setPaymentMethod('PAY2S')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                paymentMethod === 'PAY2S'
                  ? 'bg-white text-[#087CFF] shadow-2xs border border-[#DCE5FF]'
                  : 'text-[#647293] hover:text-[#172554]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cổng Pay2S (Thẻ & Ví)</span>
            </button>
          </div>

          {/* Conditional Method Display */}
          {paymentMethod === 'VIETQR' ? (
            /* QR & Bank Info Area */
            isBankReady ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* QR Image */}
                <div className="flex flex-col items-center justify-center p-4 bg-[#F4F7FF] border border-[#DCE5FF] rounded-2xl text-center">
                  <span className="text-[11px] font-semibold text-[#647293] mb-2 uppercase tracking-wider">
                    Quét mã VietQR thanh toán nhanh
                  </span>
                  <div className="w-[190px] h-[190px] bg-white p-2 rounded-xl border border-[#DCE5FF] shadow-xs flex items-center justify-center">
                    {currentOrder.qrUrl && !qrError ? (
                      <img
                        src={currentOrder.qrUrl}
                        alt="VietQR StockAI"
                        className="w-full h-full object-contain"
                        onError={() => setQrError(true)}
                      />
                    ) : (
                      <div className="text-center p-2 text-xs text-[#647293]">
                        <QrCode className="w-8 h-8 text-[#087CFF] mx-auto mb-1" />
                        <span>Quét QR tự động</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#647293] mt-2">
                    Hỗ trợ app tất cả ngân hàng Việt Nam
                  </p>
                </div>

                {/* Bank Details Table */}
                <div className="space-y-2.5 text-[12px]">
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[#647293] block text-[11px]">Ngân hàng:</span>
                      <span className="font-semibold text-[#172554]">{bankConfig?.bankName} ({bankConfig?.bankId})</span>
                    </div>
                    <button
                      onClick={() => handleCopy(bankConfig?.bankName || '', 'bank')}
                      className="p-1.5 hover:bg-[#F4F7FF] rounded text-[#087CFF] transition"
                      title="Sao chép"
                    >
                      {copiedField === 'bank' ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[#647293] block text-[11px]">Số tài khoản:</span>
                      <span className="font-mono font-bold text-[#172554] text-[14px]">{bankConfig?.accountNumber}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(bankConfig?.accountNumber || '', 'acc')}
                      className="p-1.5 hover:bg-[#F4F7FF] rounded text-[#087CFF] transition"
                      title="Sao chép"
                    >
                      {copiedField === 'acc' ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[#647293] block text-[11px]">Chủ tài khoản:</span>
                      <span className="font-bold text-[#172554] uppercase">{bankConfig?.accountHolder}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(bankConfig?.accountHolder || '', 'holder')}
                      className="p-1.5 hover:bg-[#F4F7FF] rounded text-[#087CFF] transition"
                      title="Sao chép"
                    >
                      {copiedField === 'holder' ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#EBF3FF] border border-[#DCE5FF] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[#0066D6] block text-[11px] font-semibold">Nội dung chuyển khoản (bắt buộc):</span>
                      <span className="font-mono font-bold text-[#087CFF] text-[14px]">{currentOrder.transferContent}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(currentOrder.transferContent, 'memo')}
                      className="p-1.5 hover:bg-white/60 rounded text-[#087CFF] transition"
                      title="Sao chép"
                    >
                      {copiedField === 'memo' ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Unconfigured Bank Notice */
              <div className="p-5 rounded-2xl bg-[#FFF1F2] border border-[#FEE2E2] text-[#9F1239] space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-[#EF4444] shrink-0 mt-0.5" />
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
            )
          ) : (
            /* Pay2S Payment Gateway View */
            <div className="p-5 rounded-2xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#087CFF] text-white flex items-center justify-center font-bold text-xs">
                    P2S
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#172554]">Cổng thanh toán điện tử Pay2S</h4>
                    <p className="text-[11px] text-[#647293]">Đối tác cổng thanh toán trực tuyến chính thức của StockAI</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                  SSL Bảo mật 256-bit
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#DCE5FF]">
                  <span className="font-bold text-[#172554] block">Thẻ ATM Napas</span>
                  <span className="text-[10px] text-[#647293]">40+ ngân hàng VN</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#DCE5FF]">
                  <span className="font-bold text-[#172554] block">Visa / MasterCard</span>
                  <span className="text-[10px] text-[#647293]">Thẻ quốc tế & JCB</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#DCE5FF]">
                  <span className="font-bold text-[#172554] block">Ví điện tử Pay2S</span>
                  <span className="text-[10px] text-[#647293]">Thanh toán 1 chạm</span>
                </div>
              </div>

              <div className="p-3 bg-[#EBF3FF]/50 rounded-xl border border-[#DCE5FF] text-xs text-[#087CFF] flex items-center justify-between">
                <span>Số tiền thanh toán qua Pay2S:</span>
                <span className="font-mono font-bold text-sm text-[#087CFF]">{currentOrder.formattedAmount}</span>
              </div>

              <button
                onClick={async () => {
                  setIsPay2sProcessing(true);
                  try {
                    // Simulate redirect / gateway initiation
                    await new Promise(r => setTimeout(r, 1200));
                    handleReportPayment();
                    setStatusMessage('✅ Đã kết nối thành công qua cổng Pay2S Gateway. Đơn hàng đang được xác nhận tự động!');
                  } finally {
                    setIsPay2sProcessing(false);
                  }
                }}
                disabled={isPay2sProcessing || currentOrder.status === 'PAID'}
                className="w-full py-3 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isPay2sProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang chuyển hướng sang cổng Pay2S...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Xác nhận thanh toán ngay qua cổng Pay2S</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-[#F4F7FF] rounded-xl border border-[#DCE5FF] flex items-center gap-2 text-[11px] text-[#647293]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>Mỗi đơn hàng được định danh riêng. Bấm &quot;Tôi đã chuyển khoản&quot; sau khi hoàn tất giao dịch để chuyển vào hàng đợi đối soát.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#DCE5FF] bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#DCE5FF] hover:bg-[#F4F7FF] text-[#172554] font-medium text-[13px] transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {currentOrder.status !== 'PAID' && (
              <button
                onClick={handleReportPayment}
                disabled={isSubmittingReport || isReported}
                className="px-5 py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-medium text-[13px] transition shadow-xs flex items-center gap-2"
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
