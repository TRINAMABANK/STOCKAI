import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';
import { PaymentService } from '@/lib/payment-service';
import { SubscriptionTier, UserProfile } from '@/types';
import { AuthService } from '@/lib/auth-service';

function getCurrentUser(req: Request): UserProfile {
  return AuthService.getCurrentUserFromRequest(req);
}

export async function GET(req: Request) {
  try {
    const db = getDatabase();
    const currentUser = getCurrentUser(req);

    const userOrders = (db.subscription_orders || [])
      .filter(o => o.userId === currentUser.id)
      .slice(0, 10);

    const bankConfig = PaymentService.getBankConfig();

    return NextResponse.json({
      success: true,
      data: {
        user: currentUser,
        tierInfo: {
          tier: currentUser.tier,
          validUntil: currentUser.validUntil,
          daysLeft: Math.max(0, Math.ceil((new Date(currentUser.validUntil).getTime() - Date.now()) / (1000 * 3600 * 24))),
          features: SUBSCRIPTION_PLANS[currentUser.tier]?.features || [],
        },
        availableTiers: Object.values(SUBSCRIPTION_PLANS),
        bankConfig: {
          isConfigured: bankConfig.isConfigured,
          bankId: bankConfig.bankId,
          bankName: bankConfig.bankName,
          accountNumber: bankConfig.accountNumber,
          accountHolder: bankConfig.accountHolder,
        },
        recentOrders: userOrders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi tải thông tin thuê bao', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, targetTier, orderId, note } = body;
    const currentUser = getCurrentUser(req);

    // Tạo đơn hàng thanh toán
    if (action === 'CREATE_ORDER') {
      if (!targetTier || !(targetTier in SUBSCRIPTION_PLANS)) {
        return NextResponse.json(
          { success: false, message: 'Gói thuê bao không hợp lệ.' },
          { status: 400 }
        );
      }

      if (targetTier === 'FREE') {
        const result = await PaymentService.createOrder({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          targetTier: 'FREE',
        });
        return NextResponse.json({
          success: true,
          message: 'Đã chuyển sang gói Miễn Phí (FREE). Không tạo đơn thanh toán có số tiền 0 đ.',
          data: result,
        });
      }

      const result = await PaymentService.createOrder({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        targetTier: targetTier as SubscriptionTier,
        customerNote: note,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Khách hàng bấm "Tôi đã chuyển khoản"
    if (action === 'REPORT_PAYMENT') {
      if (!orderId) {
        return NextResponse.json(
          { success: false, message: 'Thiếu mã đơn hàng cần báo cáo thanh toán.' },
          { status: 400 }
        );
      }

      const updatedOrder = await PaymentService.customerReportTransfer({
        orderId,
        userId: currentUser.id,
        customerNote: note,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã ghi nhận thông báo chuyển khoản. Đơn hàng đang chờ Admin đối soát.',
        data: updatedOrder,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Hành động không hợp lệ.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý yêu cầu thuê bao' },
      { status: 400 }
    );
  }
}
