import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { getAllPlans, PlanConfig } from '@/lib/pricing';
import { AdminAuditLog, SubscriptionTier } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const adminUser = AuthService.getCurrentUserFromRequest(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const db = getDatabase();
    const dbPlans = db.subscription_plans || {};
    const defaultPlans = getAllPlans();
    const mergedPlans = { ...defaultPlans, ...dbPlans };

    return NextResponse.json({
      success: true,
      data: {
        plans: Object.values(mergedPlans),
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/plans:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách gói dịch vụ' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = AuthService.getCurrentUserFromRequest(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, tier, name, price, durationDays, desc, features, reason } = body;

    if (action === 'UPDATE_PLAN') {
      if (!tier || !['FREE', 'PRO', 'ENTERPRISE'].includes(tier)) {
        return NextResponse.json({ success: false, message: 'Gói dịch vụ không hợp lệ.' }, { status: 400 });
      }

      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ success: false, message: 'Giá gói dịch vụ phải là số không âm.' }, { status: 400 });
      }

      if (!reason || reason.trim().length < 5) {
        return NextResponse.json({ success: false, message: 'Bắt buộc nhập lý do điều chỉnh gói dịch vụ (tối thiểu 5 ký tự).' }, { status: 400 });
      }

      const db = getDatabase();
      if (!db.subscription_plans) db.subscription_plans = {};
      if (!db.audit_logs) db.audit_logs = [];

      const currentPlans = getAllPlans();
      const oldPlan = currentPlans[tier as SubscriptionTier];

      const updatedPlan: PlanConfig = {
        tier: tier as SubscriptionTier,
        name: (name || oldPlan.name).trim(),
        price: numPrice,
        formattedPrice: `${numPrice.toLocaleString('vi-VN')} đ/tháng`,
        durationDays: Number(durationDays || oldPlan.durationDays),
        desc: (desc || oldPlan.desc).trim(),
        color: oldPlan.color,
        popular: oldPlan.popular,
        features: Array.isArray(features) ? features : oldPlan.features,
      };

      db.subscription_plans[tier] = updatedPlan;

      // Lưu Audit Log (lưu vết người thực hiện, thời gian, giá cũ và giá mới)
      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'UPDATE_PLAN_PRICE',
        targetUserId: `plan_${tier}`,
        targetUserEmail: `plan_${tier}@stockai.vn`,
        performedBy: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        timestamp: new Date().toISOString(),
        details: {
          tier,
          oldPrice: oldPlan.price,
          newPrice: numPrice,
          oldFormattedPrice: oldPlan.formattedPrice,
          newFormattedPrice: updatedPlan.formattedPrice,
          reason: reason.trim(),
          note: 'Thay đổi giá áp dụng cho các đơn hàng mới, TUYỆT ĐỐI không hồi tố các đơn hàng đã thanh toán.',
        },
      };

      db.audit_logs.push(auditLog);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật cấu hình gói ${updatedPlan.name} thành công.`,
        data: updatedPlan,
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/plans:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật gói dịch vụ', error: error.message },
      { status: 500 }
    );
  }
}
