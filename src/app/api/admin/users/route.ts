import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';
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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const tierFilter = searchParams.get('tier') || 'ALL';
    const statusFilter = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getDatabase();
    const users = db.users || [];
    const orders = db.subscription_orders || [];

    // Lọc người dùng
    let filtered = users.filter(user => {
      // 1. Tìm kiếm theo tên, email, id
      if (q) {
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchId = user.id.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }

      // 2. Lọc theo gói
      if (tierFilter !== 'ALL' && user.tier !== tierFilter) {
        return false;
      }

      // 3. Lọc theo trạng thái tài khoản
      if (statusFilter === 'LOCKED' && !user.isLocked) return false;
      if (statusFilter === 'ACTIVE' && user.isLocked) return false;

      return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Bổ sung thống kê đơn hàng cho từng người dùng (Không để lộ thông tin bí mật)
    const enrichedUsers = paginated.map(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      const totalSpent = userOrders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.actualAmount || o.amount || 0), 0);

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        tier: u.tier,
        validUntil: u.validUntil,
        isLocked: Boolean(u.isLocked),
        lockedReason: u.lockedReason,
        lockedAt: u.lockedAt,
        createdAt: u.createdAt || '2026-01-01T00:00:00Z',
        orderCount: userOrders.length,
        totalSpent,
        formattedSpent: `${totalSpent.toLocaleString('vi-VN')} đ`,
        googleLinked: Boolean(u.googleId),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách người dùng' },
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
    const { action, userId, reason, tier, durationDays } = body;
    const db = getDatabase();

    if (!db.users) db.users = [];
    if (!db.audit_logs) db.audit_logs = [];

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng với ID đã cung cấp.' },
        { status: 404 }
      );
    }

    const targetUser = db.users[userIndex];

    // Không cho phép tự khóa chính tài khoản Super Admin đang thao tác
    if (targetUser.id === adminUser.id && action === 'LOCK_USER') {
      return NextResponse.json(
        { success: false, message: 'Bạn không thể tự khóa tài khoản Quản trị viên đang đăng nhập của mình.' },
        { status: 400 }
      );
    }

    // 1. KHÓA TÀI KHOẢN
    if (action === 'LOCK_USER') {
      if (!reason || reason.trim().length < 5) {
        return NextResponse.json(
          { success: false, message: 'Bắt buộc nhập lý do khóa tài khoản (tối thiểu 5 ký tự).' },
          { status: 400 }
        );
      }

      targetUser.isLocked = true;
      targetUser.lockedReason = reason.trim();
      targetUser.lockedAt = new Date().toISOString();
      targetUser.lockedBy = adminUser.email;

      db.users[userIndex] = targetUser;

      // Lưu Audit Log
      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'LOCK_USER',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        performedBy: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        timestamp: new Date().toISOString(),
        details: {
          reason: reason.trim(),
          userName: targetUser.name,
        },
      };
      db.audit_logs.push(auditLog);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã khóa tài khoản của người dùng ${targetUser.email} thành công.`,
        data: targetUser,
        user: targetUser,
      });
    }

    // 2. MỞ KHÓA TÀI KHOẢN
    if (action === 'UNLOCK_USER') {
      targetUser.isLocked = false;
      targetUser.lockedReason = undefined;
      targetUser.lockedAt = undefined;
      targetUser.lockedBy = undefined;

      db.users[userIndex] = targetUser;

      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'UNLOCK_USER',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        performedBy: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        timestamp: new Date().toISOString(),
        details: {
          userName: targetUser.name,
        },
      };
      db.audit_logs.push(auditLog);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã mở khóa tài khoản cho ${targetUser.email}.`,
        data: targetUser,
        user: targetUser,
      });
    }

    // 3. ĐIỀU CHỈNH GÓI & THỜI HẠN
    if (action === 'ADJUST_TIER') {
      const newTier = (tier as SubscriptionTier) || 'PRO';
      const days = Number(durationDays || 30);
      const adjustReason = reason || 'Quản trị viên điều chỉnh thủ công';

      const oldTier = targetUser.tier;
      const oldValidUntil = targetUser.validUntil;

      // Tính hạn mới: nếu còn hạn thì cộng dồn, nếu hết hạn thì cộng từ hôm nay
      const currentExpiry = new Date(targetUser.validUntil || 0).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + days * 24 * 3600 * 1000).toISOString().split('T')[0];

      targetUser.tier = newTier;
      targetUser.validUntil = newExpiry;
      targetUser.features = SUBSCRIPTION_PLANS[newTier]?.features || [];

      db.users[userIndex] = targetUser;

      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'MANUAL_GRANT',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        performedBy: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        timestamp: new Date().toISOString(),
        details: {
          oldTier,
          newTier,
          oldValidUntil,
          newValidUntil: newExpiry,
          durationDays: days,
          reason: adjustReason,
        },
      };
      db.audit_logs.push(auditLog);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật gói ${newTier} đến ngày ${newExpiry} cho ${targetUser.email}.`,
        data: targetUser,
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/users:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật người dùng', error: error.message },
      { status: 500 }
    );
  }
}
