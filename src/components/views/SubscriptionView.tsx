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
  AlertTriangle 
} from 'lucide-react';
import { SubscriptionTier, UserProfile } from '@/types';

export default function SubscriptionView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<SubscriptionTier | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
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

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setUpgradingTier(tier);
    setMessage(null);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPGRADE_TIER', targetTier: tier }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setMessage(`✅ Đã chuyển đổi sang gói ${tier} thành công!`);
      } else {
        setMessage(`❌ Lỗi: ${data.message}`);
      }
    } catch {
      setMessage('❌ Lỗi kết nối khi cập nhật thuê bao');
    } finally {
      setUpgradingTier(null);
    }
  };

  const tiers: Array<{
    tier: SubscriptionTier;
    name: string;
    price: string;
    desc: string;
    features: string[];
    isPopular?: boolean;
    color: string;
  }> = [
    {
      tier: 'FREE',
      name: 'Miễn Phí (Free)',
      price: '0 đ',
      desc: 'Dành cho nhà đầu tư mới làm quen thị trường',
      color: '#64748B',
      features: [
        'Bảng giá 3 sàn HOSE, HNX, UPCoM',
        'Bộ lọc cổ phiếu cơ bản (P/E, ROE, Vốn hóa)',
        'Tín hiệu T+3 xem lại cuối ngày (EOD)',
        'Biểu đồ kỹ thuật nến cơ bản',
        'Dữ liệu mô phỏng DEMO',
      ],
    },
    {
      tier: 'PRO',
      name: 'Chuyên Nghiệp (Pro)',
      price: '490,000 đ/tháng',
      desc: 'Dành cho nhà giao dịch chủ động T+1 đến T+5',
      color: '#008FD3',
      isPopular: true,
      features: [
        'Toàn bộ tính năng gói FREE',
        'Bộ quét tín hiệu T+1–T+5 thời gian thực (Realtime Radar)',
        'Kết nối SSI FastConnect Data API chính thức',
        'Trợ lý AI StockAI Copilot (GPT-4o) phân tích chuyên sâu',
        'Kiểm định chiến lược Backtest không giới hạn',
        'Cảnh báo giá & chỉ báo kỹ thuật tự động',
        'Sao lưu và phục hồi dữ liệu cơ sở SQLite cục bộ',
      ],
    },
    {
      tier: 'ENTERPRISE',
      name: 'Nâng Cao (Enterprise)',
      price: '1,290,000 đ/tháng',
      desc: 'Dành cho đội nhóm và quỹ đầu tư định lượng',
      color: '#8B5CF6',
      features: [
        'Toàn bộ tính năng gói PRO',
        'Streaming WebSocket tick-by-tick tốc độ cao',
        'Tùy biến thuật toán sàng lọc định lượng theo yêu cầu',
        'Phân tích dòng tiền khối ngoại và tự doanh chuyên sâu',
        'Hỗ trợ kỹ thuật 24/7 và bảo mật phân quyền đa người dùng',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Tài khoản & Gói thuê bao StockAI</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Quản lý quyền hạn truy cập, gói dịch vụ và chính sách bảo mật độc lập</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Nền tảng Phân tích Độc lập
          </span>
        </div>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-[#172033]">Nguyên tắc Bảo mật StockAI</h4>
          <p className="text-[#64748B] leading-relaxed">
            StockAI là công cụ phân tích chứng khoán độc lập phục vụ cổ phiếu HOSE, HNX và UPCoM. 
            Hệ thống <strong>tuyệt đối KHÔNG yêu cầu</strong> mật khẩu giao dịch, OTP, mã PIN hay thông tin đăng nhập của công ty chứng khoán. 
            Mọi dữ liệu phân tích và API key được mã hóa và bảo vệ tại backend trên máy của bạn.
          </p>
        </div>
      </div>

      {/* Current User Subscription Card */}
      {profile && (
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#172033]">{profile.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  profile.tier === 'ENTERPRISE' ? 'bg-[#EDE9FE] text-[#8B5CF6] border border-[#DDD6FE]' :
                  profile.tier === 'PRO' ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]' :
                  'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                }`}>
                  GÓI {profile.tier}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{profile.email} • Hiệu lực đến: <span className="font-semibold text-[#172033]">{profile.validUntil}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSubscription}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F5F8FC] text-xs font-semibold text-[#172033] transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#008FD3]' : ''}`} />
              Làm mới trạng thái
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A]">
          {message}
        </div>
      )}

      {/* Subscription Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => {
          const isCurrent = profile?.tier === t.tier;

          return (
            <div
              key={t.tier}
              className={`bg-[#FFFFFF] rounded-2xl p-6 border transition flex flex-col justify-between relative shadow-xs ${
                isCurrent 
                  ? 'border-[#008FD3] ring-2 ring-[#008FD3]/20 shadow-md' 
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              {t.isPopular && !isCurrent && (
                <div className="absolute -top-3 right-6 bg-[#008FD3] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                  PHỔ BIẾN NHẤT
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-6 bg-[#10B981] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  ĐANG KÍCH HOẠT
                </div>
              )}

              <div>
                <h4 className="font-bold text-base text-[#172033]">{t.name}</h4>
                <p className="text-xs text-[#64748B] mt-1 min-h-[32px]">{t.desc}</p>

                <div className="my-5 pb-5 border-b border-[#E2E8F0]">
                  <span className="text-2xl font-bold text-[#172033] tracking-tight">{t.price}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs font-bold text-[#172033] uppercase tracking-wider text-[10px]">Tính năng bao gồm:</p>
                  {t.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#64748B]">
                      <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleUpgrade(t.tier)}
                  disabled={isCurrent || upgradingTier === t.tier}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                    isCurrent
                      ? 'bg-[#E0F2FE] text-[#008FD3] cursor-default'
                      : 'bg-[#008FD3] hover:bg-[#007bb8] text-white'
                  }`}
                >
                  {upgradingTier === t.tier ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : isCurrent ? (
                    'Gói hiện tại'
                  ) : (
                    'Chuyển sang gói này'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
