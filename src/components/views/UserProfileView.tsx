'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Crown, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ExternalLink, 
  RefreshCw,
  QrCode,
  Laptop,
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserProfile, SubscriptionOrder, SubscriptionTier } from '@/types';
import { SUBSCRIPTION_PLANS, formatVnd } from '@/lib/pricing';

interface UserProfileViewProps {
  onOpenSubscription: () => void;
  onOpenAuthModal: () => void;
}

export default function UserProfileView({
  onOpenSubscription,
  onOpenAuthModal,
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [resMe, resSub] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/subscription'),
      ]);
      const dataMe = await resMe.json();
      const dataSub = await resSub.json();

      if (dataMe.success && dataMe.data?.user) {
        setProfile(dataMe.data.user);
      }
      if (dataSub.success && dataSub.data?.recentOrders) {
        setOrders(dataSub.data.recentOrders);
      }
    } catch {
      setMessage('Lỗi tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // Tính số ngày còn lại
  const daysRemaining = (() => {
    if (!profile?.validUntil) return 0;
    const diff = new Date(profile.validUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const currentPlan = profile?.tier ? SUBSCRIPTION_PLANS[profile.tier] : SUBSCRIPTION_PLANS.FREE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
            Tài khoản cá nhân
          </h2>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Quản lý thông tin định danh, gói hội viên StockAI và lịch sử thanh toán
          </p>
        </div>

        <button
          onClick={loadUserData}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE5FF] text-xs font-semibold text-[#087CFF] hover:bg-[#EBF3FF] transition flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#FEE2E2] border border-[#FEE2E2] text-[#EF4444] text-xs font-medium rounded-xl">
          {message}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile Card (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Identity Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCE5FF]">
              <div className="flex items-center gap-4">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-16 h-16 rounded-2xl border-2 border-[#DCE5FF] object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#EBF3FF] border border-[#DCE5FF] flex items-center justify-center text-[#087CFF] font-bold text-xl shadow-xs">
                    {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'TRÍ'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#172554]">{profile?.name || 'Quang Nhựt Trí'}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      profile?.role === 'ADMIN' ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#EBF3FF] text-[#087CFF]'
                    }`}>
                      {profile?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NHÀ ĐẦU TƯ'}
                    </span>
                  </div>
                  <p className="text-xs text-[#647293] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{profile?.email || 'triqnnamabank@gmail.com'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-xl bg-[#F4F7FF] hover:bg-[#EBF3FF] text-[#087CFF] text-xs font-semibold border border-[#DCE5FF] transition shadow-2xs"
              >
                Cập nhật thông tin
              </button>
            </div>

            {/* Account Details Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <span className="text-[#647293] block text-[11px]">Gói dịch vụ</span>
                <span className="font-bold text-[#087CFF] text-sm mt-0.5 block flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{currentPlan.name}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <span className="text-[#647293] block text-[11px]">Thời hạn đến</span>
                <span className="font-bold text-[#172554] text-sm mt-0.5 block font-mono">
                  {profile?.validUntil || '2026-12-31'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <span className="text-[#647293] block text-[11px]">Số ngày còn lại</span>
                <span className="font-bold text-[#16A34A] text-sm mt-0.5 block font-mono">
                  {daysRemaining} ngày
                </span>
              </div>
            </div>

            {/* Google Authentication Status */}
            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <span className="font-semibold text-xs text-[#172554] block">Tài khoản Google Gmail</span>
                  <span className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                    Đã liên kết bảo mật SSO
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="text-xs font-semibold text-[#087CFF] hover:underline"
              >
                Quản lý liên kết
              </button>
            </div>
          </div>

          {/* Card 2: Active Session & Security Management */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#087CFF]" />
                <h3 className="text-sm font-bold text-[#172554]">Phiên đăng nhập & Bảo mật</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                Đang hoạt động
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <div>
                  <span className="font-semibold text-[#172554] block">Trình duyệt hiện tại (Web Desktop/Mobile)</span>
                  <span className="text-[11px] text-[#647293]">Phiên có hiệu lực 30 ngày qua HTTP-only Secure Token</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FEE2E2] font-semibold text-xs transition flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subscription & Order History (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Subscription Banner Card */}
          <div className="bg-gradient-to-br from-[#087CFF] to-[#0A4B8F] text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-[#DCE5FF]">
                Gói dịch vụ hiện tại
              </span>
              <Crown className="w-5 h-5 text-[#FEF08A]" />
            </div>

            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-xs text-[#EBF3FF] mt-1">{currentPlan.desc}</p>
            </div>

            <div className="pt-2 border-t border-white/20 space-y-2 text-xs">
              {currentPlan.features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#BBF7D0] shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenSubscription}
              className="w-full py-2.5 rounded-xl bg-white text-[#087CFF] font-bold text-xs hover:bg-[#F0F9FF] transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Nâng cấp hoặc gia hạn gói</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Order and Payment History */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#087CFF]" />
                <h3 className="text-sm font-bold text-[#172554]">Lịch sử giao dịch & Đơn hàng</h3>
              </div>
              <span className="text-xs text-[#647293] font-mono">{orders.length} đơn</span>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#647293] space-y-1">
                <p className="font-semibold text-[#172554]">Chưa có đơn hàng nâng cấp nào</p>
                <p>Mọi giao dịch VietQR và Pay2S sẽ được lưu vết đối soát minh bạch tại đây.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => {
                  const isPaid = ord.status === 'PAID';
                  const isPending = ord.status === 'PENDING' || ord.status === 'PENDING_CONFIRMATION';
                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172554] font-mono">{ord.orderCode}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid 
                            ? 'bg-[#DCFCE7] text-[#16A34A]' 
                            : isPending 
                            ? 'bg-[#FEF3C7] text-[#D97706]' 
                            : 'bg-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          {isPaid ? 'ĐÃ KÍCH HOẠT' : isPending ? 'CHỜ ĐỐI SOÁT' : 'ĐÃ HỦY'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[#647293]">
                        <span>Gói: <strong>{ord.tier}</strong></span>
                        <span className="font-bold text-[#172554] font-mono">{ord.formattedAmount}</span>
                      </div>

                      <div className="text-[11px] text-[#94A3B8] font-mono pt-1 border-t border-[#DCE5FF]/60">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
