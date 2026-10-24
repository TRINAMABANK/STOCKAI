'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Lock, 
  Key, 
  RefreshCw, 
  Crown, 
  Layers, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { SubscriptionTier, UserProfile, SubscriptionOrder, BankConfig } from '@/types';
import { SUBSCRIPTION_PLANS, formatVnd } from '@/lib/pricing';
import PaymentQrModal from '@/components/PaymentQrModal';
import Logo from '@/components/Logo';

export default function SubscriptionView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<SubscriptionOrder[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState<SubscriptionTier | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('PRO');
  const [currentOrderData, setCurrentOrderData] = useState<{
    order: SubscriptionOrder;
    bankConfig: BankConfig;
    isBankConfigured: boolean;
    qrUrl?: string;
  } | null>(null);

  const loadSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
        setRecentOrders(data.data.recentOrders || []);
        setBankConfig(data.data.bankConfig || null);
      }
    } catch {
      setMessage('Không thể tải thông tin thuê bao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (tier === 'FREE') {
      // FREE tier switches immediately
      setIsCreatingOrder(tier);
      setMessage(null);
      try {
        const res = await fetch('/api/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CREATE_ORDER', targetTier: 'FREE' }),
        });
        const data = await res.json();
        if (data.success) {
          setMessage('✅ Đã kích hoạt gói Miễn Phí thành công!');
          loadSubscription();
        } else {
          setMessage(`❌ ${data.message}`);
        }
      } catch {
        setMessage('❌ Lỗi kết nối máy chủ.');
      } finally {
        setIsCreatingOrder(null);
      }
      return;
    }

    // PRO or ENTERPRISE -> create order and open QR modal
    setIsCreatingOrder(tier);
    setSelectedTier(tier);
    setMessage(null);

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_ORDER', targetTier: tier }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentOrderData(data.data);
        setIsQrModalOpen(true);
      } else {
        setMessage(`❌ Lỗi tạo đơn: ${data.message}`);
      }
    } catch {
      setMessage('❌ Không thể kết nối máy chủ để tạo đơn hàng.');
    } finally {
      setIsCreatingOrder(null);
    }
  };

  const handleReopenQr = (ord: SubscriptionOrder) => {
    if (!bankConfig) return;
    const qrUrl = ord.qrUrl || (bankConfig.isConfigured && bankConfig.accountNumber ? 
      `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNumber}-compact2.png?amount=${ord.amount}&addInfo=${encodeURIComponent(ord.orderCode)}&accountName=${encodeURIComponent(bankConfig.accountHolder)}` : undefined);

    setCurrentOrderData({
      order: ord,
      bankConfig,
      isBankConfigured: Boolean(bankConfig.isConfigured),
      qrUrl,
    });
    setSelectedTier(ord.tier);
    setIsQrModalOpen(true);
  };

  const tiersList = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Logo size="md" variant="default" />
          <div>
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
              Gói Thuê bao & Kích hoạt Bản quyền StockAI
            </h2>
            <p className="text-[13px] text-[#647293] mt-0.5">
              Nâng cấp để mở khóa toàn bộ radar quét T+1–T+5, dữ liệu realtime chính thức và trợ lý AI Copilot
            </p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] px-3.5 py-1.5 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF] font-semibold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Gói hiện tại: <strong>{profile.tier}</strong></span>
              <span className="text-gray-400">•</span>
              <span className="font-mono">{profile.validUntil}</span>
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-[#EBF3FF] border border-[#DCE5FF] text-[13px] font-medium text-[#087CFF]">
          {message}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiersList.map((t) => {
          const isCurrent = profile?.tier === t.tier;
          const isProcessing = isCreatingOrder === t.tier;

          return (
            <div
              key={t.tier}
              className={`bg-[#FFFFFF] rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 relative ${
                t.popular 
                  ? 'border-[#087CFF] shadow-md ring-1 ring-[#087CFF]/20' 
                  : isCurrent 
                  ? 'border-[#16A34A] shadow-xs' 
                  : 'border-[#DCE5FF] shadow-xs hover:border-[#CBD5E1]'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#087CFF] text-white text-[11px] font-bold shadow-xs uppercase tracking-wider">
                  Phổ biến nhất
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-[#172554] tracking-tight">{t.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] text-[11px] font-bold border border-[#BBF7D0]">
                      Đang dùng
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-[#647293] mt-1">{t.desc}</p>

                <div className="my-5 pb-5 border-b border-[#DCE5FF]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-[#172554] font-mono tabular-nums tracking-tight">
                      {t.price === 0 ? '0 đ' : formatVnd(t.price)}
                    </span>
                    {t.price > 0 && <span className="text-[13px] text-[#647293]">/tháng</span>}
                  </div>
                  <p className="text-[11px] text-[#647293] mt-0.5">
                    {t.price === 0 ? 'Miễn phí vĩnh viễn' : 'Thanh toán theo tháng qua chuyển khoản VietQR'}
                  </p>
                </div>

                {/* Features list */}
                <div className="space-y-2.5 mb-6 text-[13px]">
                  <span className="text-[11px] font-bold text-[#172554] uppercase tracking-wider block mb-2">
                    Quyền năng đi kèm:
                  </span>
                  {t.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span className="text-[#172554] leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectTier(t.tier)}
                disabled={isCurrent || isProcessing}
                className={`w-full py-2.5 rounded-xl font-medium text-[13px] transition flex items-center justify-center gap-1.5 shadow-2xs ${
                  isCurrent
                    ? 'bg-[#F4F7FF] border border-[#DCE5FF] text-[#647293] cursor-default'
                    : t.popular
                    ? 'bg-[#087CFF] hover:bg-[#0066D6] text-white shadow-xs'
                    : 'bg-[#172554] hover:bg-[#0f172a] text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo...</span>
                  </>
                ) : isCurrent ? (
                  <span>Gói của bạn</span>
                ) : t.price === 0 ? (
                  <span>Chuyển về Miễn phí</span>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Đăng ký & Quét mã QR</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Customer Order History Table */}
      {recentOrders.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-[#172554]">Lịch sử Đơn hàng & Thanh toán của bạn</h3>
              <p className="text-[12px] text-[#647293]">Theo dõi trạng thái đối soát và thời hạn thuê bao</p>
            </div>
            <button
              onClick={loadSubscription}
              className="text-[12px] text-[#087CFF] font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5FF] text-[12px] font-semibold text-[#647293] bg-[#F4F7FF]">
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Gói</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3">Thời gian tạo</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5FF] text-[13px]">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F4F7FF]/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#172554]">{ord.orderCode}</td>
                    <td className="py-3 px-3 font-semibold text-[#087CFF]">{ord.tier}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#172554] tabular-nums">
                      {ord.formattedAmount}
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#647293] font-mono">
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')} {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ord.status === 'PAID' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (PAID)
                        </span>
                      ) : ord.status === 'PENDING_CONFIRMATION' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                        </span>
                      ) : ord.status === 'REJECTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F2] text-[#EF4444] border border-[#FEE2E2] inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F7FF] text-[#647293] border border-[#DCE5FF] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {ord.status !== 'PAID' && ord.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleReopenQr(ord)}
                          className="px-2.5 py-1 rounded-lg bg-[#EBF3FF] hover:bg-[#DCE5FF] text-[#087CFF] font-medium text-[11px] transition inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Xem lại QR</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment QR Modal */}
      <PaymentQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tier={selectedTier}
        orderData={currentOrderData}
        onOrderUpdated={loadSubscription}
      />
    </div>
  );
}
