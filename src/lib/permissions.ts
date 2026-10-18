import { SubscriptionTier, UserProfile } from '@/types';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';

export type FeaturePermissionKey =
  | 'MARKET_DATA_REALTIME'      // Dữ liệu trong phiên thời gian thực
  | 'T3_RADAR_REALTIME'         // Bộ quét Radar T+1 đến T+5
  | 'TECHNICAL_INDICATORS_FULL' // Toàn bộ chỉ báo kỹ thuật nâng cao
  | 'BUY_SELL_ARROWS'           // Mũi tên Mua/Bán & Chuỗi tăng 5 phiên
  | 'AI_COPILOT_UNLIMITED'      // Trợ lý AI Copilot không giới hạn
  | 'WATCHLIST_UNLIMITED'       // Danh sách theo dõi không giới hạn (Free max 5)
  | 'BACKTEST_SIMULATOR'        // Kiểm định chiến lược Backtest
  | 'DATA_EXPORT_ADVANCED';     // Xuất dữ liệu & sao lưu nâng cao

export interface FeatureGateRule {
  key: FeaturePermissionKey;
  name: string;
  minTier: SubscriptionTier;
  description: string;
  freeLimitDescription?: string;
}

export const FEATURE_RULES: Record<FeaturePermissionKey, FeatureGateRule> = {
  MARKET_DATA_REALTIME: {
    key: 'MARKET_DATA_REALTIME',
    name: 'Dữ liệu thị trường thời gian thực (Realtime)',
    minTier: 'PRO',
    description: 'Dữ liệu khớp lệnh liên tục từ sở giao dịch HOSE, HNX, UPCoM.',
    freeLimitDescription: 'Gói Free xem dữ liệu cuối ngày (EOD) hoặc mô phỏng Demo.',
  },
  T3_RADAR_REALTIME: {
    key: 'T3_RADAR_REALTIME',
    name: 'Bộ quét tín hiệu Radar T+1 đến T+5',
    minTier: 'PRO',
    description: 'Quét cơ hội bùng nổ, phá nền và đảo chiều ngắn hạn trong 1-5 phiên.',
    freeLimitDescription: 'Gói Free chỉ xem lại tín hiệu các phiên trước.',
  },
  TECHNICAL_INDICATORS_FULL: {
    key: 'TECHNICAL_INDICATORS_FULL',
    name: 'Bộ chỉ báo kỹ thuật chuyên sâu',
    minTier: 'PRO',
    description: 'Bao gồm EMA20, Bollinger Bands, MACD Histogram, MA50, MA200.',
    freeLimitDescription: 'Gói Free hỗ trợ đồ thị nến cơ bản và MA20.',
  },
  BUY_SELL_ARROWS: {
    key: 'BUY_SELL_ARROWS',
    name: 'Mũi tên Mua/Bán & Chuỗi tăng 5 phiên',
    minTier: 'PRO',
    description: 'Hiển thị điểm vào lệnh và chốt lời trực tiếp trên cây nến.',
    freeLimitDescription: 'Dành riêng cho gói PRO và ENTERPRISE.',
  },
  AI_COPILOT_UNLIMITED: {
    key: 'AI_COPILOT_UNLIMITED',
    name: 'Trợ lý phân tích AI Copilot (GPT-4o)',
    minTier: 'PRO',
    description: 'Phân tích tự động điểm mua, vùng cắt lỗ và kịch bản giá cho từng mã CP.',
    freeLimitDescription: 'Gói Free tối đa 3 câu hỏi tham khảo mỗi ngày.',
  },
  WATCHLIST_UNLIMITED: {
    key: 'WATCHLIST_UNLIMITED',
    name: 'Danh sách theo dõi không giới hạn',
    minTier: 'PRO',
    description: 'Tạo nhiều danh sách và theo dõi không giới hạn số lượng cổ phiếu.',
    freeLimitDescription: 'Gói Free theo dõi tối đa 5 mã cổ phiếu.',
  },
  BACKTEST_SIMULATOR: {
    key: 'BACKTEST_SIMULATOR',
    name: 'Kiểm định chiến lược Backtest',
    minTier: 'PRO',
    description: 'Kiểm định tỷ lệ thắng, max drawdown và profit factor trên dữ liệu lịch sử.',
    freeLimitDescription: 'Dành riêng cho gói PRO và ENTERPRISE.',
  },
  DATA_EXPORT_ADVANCED: {
    key: 'DATA_EXPORT_ADVANCED',
    name: 'Xuất báo cáo & Dữ liệu chuyên sâu',
    minTier: 'ENTERPRISE',
    description: 'Xuất dữ liệu Excel/PDF và tích hợp API riêng cho tổ chức.',
    freeLimitDescription: 'Dành riêng cho gói ENTERPRISE.',
  },
};

const TIER_WEIGHT: Record<SubscriptionTier, number> = {
  FREE: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

/**
 * Kiểm tra xem người dùng có quyền sử dụng tính năng hay không
 */
export function checkFeatureAccess(
  user: UserProfile | null | undefined,
  featureKey: FeaturePermissionKey
): {
  allowed: boolean;
  requiredTier: SubscriptionTier;
  rule: FeatureGateRule;
  reason?: string;
} {
  const rule = FEATURE_RULES[featureKey];
  const userTier: SubscriptionTier = user?.tier || 'FREE';

  // Admin luôn có toàn quyền
  if (user?.role === 'ADMIN') {
    return { allowed: true, requiredTier: rule.minTier, rule };
  }

  // Kiểm tra hạn sử dụng nếu có
  if (user?.validUntil) {
    const expiry = new Date(user.validUntil).getTime();
    if (expiry < Date.now() && userTier !== 'FREE') {
      return {
        allowed: false,
        requiredTier: rule.minTier,
        rule,
        reason: 'Gói thuê bao của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
      };
    }
  }

  const allowed = TIER_WEIGHT[userTier] >= TIER_WEIGHT[rule.minTier];

  return {
    allowed,
    requiredTier: rule.minTier,
    rule,
    reason: allowed ? undefined : `Tính năng này yêu cầu gói ${SUBSCRIPTION_PLANS[rule.minTier].name}.`,
  };
}
