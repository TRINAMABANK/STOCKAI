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
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">
              Gói Thuê bao & Kích hoạt Bản quyền StockAI
            </h2>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Nâng cấp để mở khóa toàn bộ radar quét T+1–T+5, dữ liệu realtime chính thức và trợ lý AI Copilot
            </p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] px-3.5 py-1.5 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] font-semibold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Gói hiện tại: <strong>{profile.tier}</strong></span>
              <span className="text-gray-400">•</span>
              <span className="font-mono">{profile.validUntil}</span>
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[13px] font-medium text-[#008FD3]">
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
                  ? 'border-[#008FD3] shadow-md ring-1 ring-[#008FD3]/20' 
                  : isCurrent 
                  ? 'border-[#10B981] shadow-xs' 
                  : 'border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1]'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#008FD3] text-white text-[11px] font-bold shadow-xs uppercase tracking-wider">
                  Phổ biến nhất
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-[#172033] tracking-tight">{t.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] text-[11px] font-bold border border-[#A7F3D0]">
                      Đang dùng
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-[#64748B] mt-1">{t.desc}</p>

                <div className="my-5 pb-5 border-b border-[#E2E8F0]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-[#172033] font-mono tabular-nums tracking-tight">
                      {t.price === 0 ? '0 đ' : formatVnd(t.price)}
                    </span>
                    {t.price > 0 && <span className="text-[13px] text-[#64748B]">/tháng</span>}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {t.price === 0 ? 'Miễn phí vĩnh viễn' : 'Thanh toán theo tháng qua chuyển khoản VietQR'}
                  </p>
                </div>

                {/* Features list */}
                <div className="space-y-2.5 mb-6 text-[13px]">
                  <span className="text-[11px] font-bold text-[#172033] uppercase tracking-wider block mb-2">
                    Quyền năng đi kèm:
                  </span>
                  {t.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[#172033] leading-snug">{f}</span>
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
                    ? 'bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B] cursor-default'
                    : t.popular
                    ? 'bg-[#008FD3] hover:bg-[#007bb8] text-white shadow-xs'
                    : 'bg-[#172033] hover:bg-[#0f172a] text-white'
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
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-[#172033]">Lịch sử Đơn hàng & Thanh toán của bạn</h3>
              <p className="text-[12px] text-[#64748B]">Theo dõi trạng thái đối soát và thời hạn thuê bao</p>
            </div>
            <button
              onClick={loadSubscription}
              className="text-[12px] text-[#008FD3] font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] bg-[#F5F8FC]">
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Gói</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3">Thời gian tạo</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F5F8FC]/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#172033]">{ord.orderCode}</td>
                    <td className="py-3 px-3 font-semibold text-[#008FD3]">{ord.tier}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#172033] tabular-nums">
                      {ord.formattedAmount}
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#64748B] font-mono">
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')} {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ord.status === 'PAID' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (PAID)
                        </span>
                      ) : ord.status === 'PENDING_CONFIRMATION' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                        </span>
                      ) : ord.status === 'REJECTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F2] text-[#F43F5E] border border-[#FECDD3] inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F8FC] text-[#64748B] border border-[#E2E8F0] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {ord.status !== 'PAID' && ord.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleReopenQr(ord)}
                          className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#008FD3] font-medium text-[11px] transition inline-flex items-center gap-1"
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
