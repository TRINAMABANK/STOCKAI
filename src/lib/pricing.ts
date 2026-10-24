import { SubscriptionTier } from '@/types';

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  formattedPrice: string;
  durationDays: number;
  desc: string;
  color: string;
  popular?: boolean;
  features: string[];
}

/**
 * SOURCE OF TRUTH CHO GIÁ GÓI THUÊ BAO STOCKAI
 * Cấu hình tập trung tại Backend - Không tin số tiền do frontend gửi lên
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Gói Miễn Phí (Free)',
    price: 0,
    formattedPrice: '0 đ/tháng',
    durationDays: 3650,
    desc: 'Dành cho nhà đầu tư mới làm quen thị trường',
    color: '#647293',
    features: [
      'Bảng giá 3 sàn HOSE, HNX, UPCoM',
      'Bộ lọc cổ phiếu cơ bản (P/E, ROE, Vốn hóa)',
      'Tín hiệu T+3 xem lại cuối ngày (EOD)',
      'Biểu đồ kỹ thuật nến cơ bản',
      'Dữ liệu mô phỏng DEMO',
    ],
  },
  PRO: {
    tier: 'PRO',
    name: 'Gói Chuyên Nghiệp (Pro)',
    price: 199000,
    formattedPrice: '199.000 đ/tháng',
    durationDays: 30,
    desc: 'Dành cho nhà giao dịch chủ động T+1 đến T+5',
    color: '#087CFF',
    popular: true,
    features: [
      'Toàn bộ tính năng gói FREE',
      'Bộ quét tín hiệu T+1–T+5 thời gian thực (Realtime Radar)',
      'Kết nối SSI FastConnect Data API chính thức',
      'Trợ lý AI StockAI Copilot (GPT-4o) phân tích chuyên sâu',
      'Kiểm định chiến lược Backtest không giới hạn',
      'Cảnh báo giá và tín hiệu tự động qua Web/App',
      'Xuất và sao lưu dữ liệu SQLite cá nhân an toàn',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Gói Nâng Cao (Enterprise)',
    price: 299000,
    formattedPrice: '299.000 đ/tháng',
    durationDays: 30,
    desc: 'Dành cho nhà đầu tư chuyên nghiệp & quản lý danh mục lớn',
    color: '#8B36FF',
    features: [
      'Toàn bộ tính năng gói PRO',
      'Streaming dữ liệu WebSocket tick-by-tick tốc độ cao',
      'Tùy biến công thức chiến lược định lượng T+1–T+5 riêng',
      'Phân tích dòng tiền khối ngoại và tự doanh chuyên sâu',
      'Ưu tiên hỗ trợ kỹ thuật và bảo mật chuyên biệt',
    ],
  },
};

export function getAllPlans(): Record<SubscriptionTier, PlanConfig> {
  return SUBSCRIPTION_PLANS;
}

export function getPlanPrice(tier: SubscriptionTier): number {
  const plans = getAllPlans();
  const plan = plans[tier];
  if (!plan) {
    throw new Error(`Gói thuê bao không hợp lệ: ${tier}`);
  }
  return plan.price;
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

