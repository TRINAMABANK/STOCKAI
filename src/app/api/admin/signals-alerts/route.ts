import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { AdminAuthService } from '@/lib/admin-auth-service';
import { AdminAuditLog } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/signals-alerts
 * Quản trị toàn bộ Tín hiệu (T+1, T+3, T+5) và Lịch sử Cảnh báo thị trường
 */
export async function GET(req: Request) {
  try {
    const adminUser = AdminAuthService.getAuthenticatedAdminFromRequest(req) || AuthService.getCurrentUserFromRequest(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toUpperCase();
    const exchange = searchParams.get('exchange') || 'ALL';
    const type = searchParams.get('type') || 'ALL'; // SIGNALS | ALERTS | ALL

    const db = getDatabase();
    const signals = db.t3_signals || [];
    const alerts = db.market_alerts || [];

    // Lọc signals
    let filteredSignals = [...signals];
    if (q) {
      filteredSignals = filteredSignals.filter(s => s.symbol.includes(q) || (s.industry && s.industry.toUpperCase().includes(q)));
    }
    if (exchange !== 'ALL') {
      filteredSignals = filteredSignals.filter(s => s.exchange === exchange);
    }

    // Lọc alerts
    let filteredAlerts = [...alerts];
    if (q) {
      filteredAlerts = filteredAlerts.filter(a => a.symbol.includes(q));
    }
    if (exchange !== 'ALL') {
      filteredAlerts = filteredAlerts.filter(a => a.exchange === exchange);
    }

    // Thống kê chất lượng
    const signalSymbols = new Set();
    let duplicateSignalsCount = 0;
    signals.forEach(s => {
      if (signalSymbols.has(s.symbol)) duplicateSignalsCount++;
      else signalSymbols.add(s.symbol);
    });

    return NextResponse.json({
      success: true,
      data: {
        signals: filteredSignals,
        alerts: filteredAlerts,
        stats: {
          totalSignals: signals.length,
          totalAlerts: alerts.length,
          duplicateSignalsCount,
          activeAlertsCount: alerts.filter(a => a.status === 'NEW' || a.status === 'WATCHING' || a.status === 'CONFIRMED').length,
          failedBreakoutCount: alerts.filter(a => a.eventType === 'FAILED_BREAKOUT').length,
          lastSyncTime: new Date().toLocaleTimeString('vi-VN'),
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/signals-alerts:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi tải dữ liệu tín hiệu & cảnh báo' }, { status: 500 });
  }
}

/**
 * POST /api/admin/signals-alerts
 * Ghi nhận hành động quản trị (hủy bỏ, xác nhận, thêm ghi chú audit log)
 */
export async function POST(req: Request) {
  try {
    const adminUser = AdminAuthService.getAuthenticatedAdminFromRequest(req) || AuthService.getCurrentUserFromRequest(req);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, id, note, reason } = body;
    const db = getDatabase();
    const now = new Date().toISOString();

    if (action === 'DISMISS_ALERT') {
      const alerts = db.market_alerts || [];
      const idx = alerts.findIndex(a => a.id === id);
      if (idx === -1) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy cảnh báo' }, { status: 404 });
      }

      alerts[idx].status = 'CLOSED';
      alerts[idx].statusLogs.push({
        status: 'CLOSED',
        timestamp: now,
        note: `Admin đóng cảnh báo: ${reason || 'Không còn hiệu lực'}`,
      });
      alerts[idx].updatedAt = now;

      // Audit Log
      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_close_alert`,
        action: 'SYSTEM_CONFIG_UPDATE',
        targetUserId: adminUser.id,
        targetUserEmail: adminUser.email,
        performedBy: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        timestamp: now,
        details: { action: 'DISMISS_ALERT', alertId: id, symbol: alerts[idx].symbol, reason },
      };
      if (!db.audit_logs) db.audit_logs = [];
      db.audit_logs.unshift(auditLog);

      db.market_alerts = alerts;
      saveDatabase(db);

      return NextResponse.json({ success: true, message: `Đã đóng cảnh báo mã ${alerts[idx].symbol} thành công` });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/signals-alerts:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi thực thi' }, { status: 500 });
  }
}
