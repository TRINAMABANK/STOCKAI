import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { PaymentService } from '@/lib/payment-service';

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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const statusFilter = searchParams.get('status') || 'ALL';
    const tierFilter = searchParams.get('tier') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getDatabase();
    const orders = db.subscription_orders || [];

    let filtered = orders.filter(ord => {
      // 1. Tìm kiếm theo mã đơn, email, tên, mã GD ngân hàng / Pay2S
      if (q) {
        const matchCode = ord.orderCode.toLowerCase().includes(q);
        const matchEmail = (ord.userEmail || '').toLowerCase().includes(q);
        const matchName = (ord.userName || '').toLowerCase().includes(q);
        const matchBankRef = (ord.bankTransactionRef || '').toLowerCase().includes(q);
        const matchPay2s = (ord.pay2sTransactionId || '').toLowerCase().includes(q);
        if (!matchCode && !matchEmail && !matchName && !matchBankRef && !matchPay2s) {
          return false;
        }
      }

      // 2. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && ord.status !== statusFilter) {
        return false;
      }

      // 3. Lọc theo gói
      if (tierFilter !== 'ALL' && ord.tier !== tierFilter) {
        return false;
      }

      return true;
    });

    // Sắp xếp mới nhất lên đầu
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        orders: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/orders:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách đơn hàng' },
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
    const { action } = body;

    // 1. Đối soát & Xác nhận thanh toán (Yêu cầu căn cứ xác minh cụ thể)
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

    // 2. Từ chối đơn hàng (Yêu cầu lý do)
    if (action === 'REJECT_PAYMENT') {
      const { orderId, reason } = body;
      const result = await PaymentService.adminRejectPayment({
        orderId,
        adminUser,
        reason,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/orders:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý đơn hàng' },
      { status: 400 }
    );
  }
}
