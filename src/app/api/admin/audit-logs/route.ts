import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';

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
    const actionFilter = searchParams.get('action') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const db = getDatabase();
    const logs = db.audit_logs || [];

    let filtered = logs.filter(log => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }

      if (q) {
        const matchAdmin = (log.performedBy?.email || '').toLowerCase().includes(q);
        const matchTarget = (log.targetUserEmail || '').toLowerCase().includes(q);
        const matchOrder = (log.orderCode || '').toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
        if (!matchAdmin && !matchTarget && !matchOrder && !matchAction && !matchDetails) {
          return false;
        }
      }

      return true;
    });

    // Mới nhất lên trước
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải nhật ký kiểm toán', error: error.message },
      { status: 500 }
    );
  }
}
