import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { SubscriptionTier, UserProfile } from '@/types';

// Danh sách các quyền năng tương ứng theo từng gói thuê bao StockAI
const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, string[]> = {
  FREE: [
    'Bảng giá trực tuyến HOSE, HNX, UPCoM',
    'Bộ lọc cổ phiếu cơ bản (P/E, ROE, Vốn hóa)',
    'Tín hiệu T+3 trễ 1 phiên (EOD)',
    'Phân tích kỹ thuật cơ bản',
    'Dữ liệu mô phỏng DEMO',
  ],
  PRO: [
    'Toàn bộ tính năng gói FREE',
    'Bộ quét tín hiệu T+1–T+5 thời gian thực (Realtime Radar)',
    'Kết nối trực tiếp SSI FastConnect Data API',
    'Trợ lý StockAI Copilot (GPT-4o) phân tích chuyên sâu',
    'Kiểm định chiến lược Backtest không giới hạn',
    'Cảnh báo giá và tín hiệu tự động qua Telegram/Web',
    'Xuất và sao lưu toàn bộ dữ liệu SQLite',
  ],
  ENTERPRISE: [
    'Toàn bộ tính năng gói PRO',
    'Streaming dữ liệu WebSocket tick-by-tick tốc độ cao',
    'Tùy biến công thức chiến lược định lượng T+1–T+5 riêng',
    'Phân tích dòng tiền khối ngoại và tự doanh chuyên sâu',
    'Ưu tiên hỗ trợ kỹ thuật và bảo mật chuyên biệt',
  ],
};

export async function GET() {
  try {
    const db = getDatabase();
    
    // Mặc định khởi tạo tài khoản quản trị cá nhân Pro
    const currentUser: UserProfile = (db as any).current_user || {
      id: 'usr_stockai_lead',
      name: 'Nhà Đầu Tư StockAI',
      email: 'trinamabank@stockai.vn',
      role: 'ADMIN',
      tier: 'PRO',
      validUntil: '2027-12-31',
      features: SUBSCRIPTION_FEATURES['PRO'],
    };

    return NextResponse.json({
      success: true,
      data: {
        user: currentUser,
        tierInfo: {
          tier: currentUser.tier,
          validUntil: currentUser.validUntil,
          daysLeft: Math.max(0, Math.ceil((new Date(currentUser.validUntil).getTime() - Date.now()) / (1000 * 3600 * 24))),
          features: SUBSCRIPTION_FEATURES[currentUser.tier],
        },
        availableTiers: [
          { tier: 'FREE', name: 'Gói Miễn Phí (Free)', price: '0 đ/tháng', features: SUBSCRIPTION_FEATURES['FREE'] },
          { tier: 'PRO', name: 'Gói Chuyên Nghiệp (Pro)', price: '490,000 đ/tháng', popular: true, features: SUBSCRIPTION_FEATURES['PRO'] },
          { tier: 'ENTERPRISE', name: 'Gói Nâng Cao (Enterprise)', price: '1,290,000 đ/tháng', features: SUBSCRIPTION_FEATURES['ENTERPRISE'] },
        ],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi tải thông tin thuê bao', error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, targetTier } = body;
    const db = getDatabase();

    if (action === 'UPGRADE_TIER' && (targetTier === 'FREE' || targetTier === 'PRO' || targetTier === 'ENTERPRISE')) {
      const currentUser: UserProfile = (db as any).current_user || {
        id: 'usr_stockai_lead',
        name: 'Nhà Đầu Tư StockAI',
        email: 'trinamabank@stockai.vn',
        role: 'ADMIN',
        tier: 'PRO',
        validUntil: '2027-12-31',
        features: SUBSCRIPTION_FEATURES['PRO'],
      };

      currentUser.tier = targetTier as SubscriptionTier;
      currentUser.features = SUBSCRIPTION_FEATURES[targetTier as SubscriptionTier];
      currentUser.validUntil = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

      (db as any).current_user = currentUser;
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật gói thuê bao sang ${targetTier} thành công!`,
        user: currentUser,
      });
    }

    return NextResponse.json({ success: false, message: 'Yêu cầu không hợp lệ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật gói thuê bao', error: String(error) }, { status: 500 });
  }
}
