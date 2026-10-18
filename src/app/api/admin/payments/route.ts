import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { PaymentService } from '@/lib/payment-service';
import { UserProfile, SubscriptionTier } from '@/types';
import { AuthService } from '@/lib/auth-service';

function getAdminUser(req: Request): UserProfile {
  return AuthService.getCurrentUserFromRequest(req);
}

export async function GET(req: Request) {
  try {
    const adminUser = getAdminUser(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL';
    const tierFilter = searchParams.get('tier') || 'ALL';
    const searchTerm = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const overview = await PaymentService.getAdminOverview({
      adminUser,
      statusFilter,
      tierFilter,
      searchTerm,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi tải trang quản trị' },
      { status: error.message?.includes('Từ chối') ? 403 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = getAdminUser(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. Đối soát & Xác nhận thanh toán
    if (action === 'VERIFY_PAYMENT') {
      const { orderId, actualAmount, bankTransactionRef, transactionTime, notes } = body;
      const result = await PaymentService.adminVerifyPayment({
        orderId,
        adminUser,
        actualAmount: Number(actualAmount),
        bankTransactionRef,
        transactionTime,
        reconciliationNotes: notes,
      });

      return NextResponse.json(result);
    }

    // 2. Từ chối thanh toán
    if (action === 'REJECT_PAYMENT') {
      const { orderId, reason } = body;
      const result = await PaymentService.adminRejectPayment({
        orderId,
        adminUser,
        reason,
      });

      return NextResponse.json(result);
    }

    // 3. Cấp quyền thuê bao thủ công
    if (action === 'GRANT_SUBSCRIPTION') {
      const { targetUserId, tier, durationDays, reason } = body;
      const result = await PaymentService.adminManualGrant({
        targetUserId,
        adminUser,
        tier: tier as SubscriptionTier,
        durationDays: Number(durationDays || 30),
        reason,
      });

      return NextResponse.json(result);
    }

    // 4. Thu hồi quyền thuê bao
    if (action === 'REVOKE_SUBSCRIPTION') {
      const { targetUserId, reason } = body;
      const result = await PaymentService.adminRevokeSubscription({
        targetUserId,
        adminUser,
        reason,
      });

      return NextResponse.json(result);
    }

    // 5. Cập nhật cấu hình ngân hàng
    if (action === 'UPDATE_BANK_CONFIG') {
      const { bankId, bankName, accountNumber, accountHolder, template, isConfigured } = body;
      const result = await PaymentService.adminUpdateBankConfig({
        adminUser,
        bankId,
        bankName,
        accountNumber,
        accountHolder,
        template,
        isConfigured,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: 'Hành động không hợp lệ' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý yêu cầu quản trị' },
      { status: 400 }
    );
  }
}
