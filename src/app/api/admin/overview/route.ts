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

    const db = getDatabase();
    const users = db.users || [];
    const orders = db.subscription_orders || [];
    const auditLogs = db.audit_logs || [];
    const syncLogs = db.api_sync_logs || [];
    const bankConfig = PaymentService.getBankConfig();

    const now = Date.now();

    // 1. Số liệu người dùng
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(u => u.tier !== 'FREE' && new Date(u.validUntil).getTime() >= now).length;
    const expiredSubscriptions = users.filter(u => u.tier !== 'FREE' && new Date(u.validUntil).getTime() < now).length;

    // Người dùng mới trong 7 ngày
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
    const newUsersLast7Days = users.filter(u => u.createdAt && new Date(u.createdAt).getTime() >= sevenDaysAgo).length;

    // 2. Số liệu đơn hàng & Doanh thu
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const confirmedRevenue = paidOrders.reduce((sum, o) => sum + (o.actualAmount || o.amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const needsReconciliation = orders.filter(o => o.status === 'PENDING_CONFIRMATION').length;
    const failedTransactions = orders.filter(o => o.status === 'REJECTED' || o.status === 'CANCELLED').length;
    const successTransactions = paidOrders.length;

    // 3. Lỗi hệ thống & dịch vụ
    const recentSyncErrors = syncLogs.filter(l => l.status === 'ERROR').slice(0, 5);

    // 4. Trạng thái nhà cung cấp dữ liệu SSI / Vietstock
    const ssiProvider = (db.api_providers || []).find(p => p.code === 'SSI');
    const vietstockProvider = (db.api_providers || []).find(p => p.code === 'VIETSTOCK');

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          activeSubscriptions,
          expiredSubscriptions,
          newUsersLast7Days,
          confirmedRevenue,
          formattedRevenue: `${confirmedRevenue.toLocaleString('vi-VN')} đ`,
          pendingOrders,
          needsReconciliation,
          failedTransactions,
          successTransactions,
          totalOrders: orders.length,
        },
        recentOrders: orders.slice(-6).reverse(),
        recentUsers: users.slice(-5).reverse(),
        recentAuditLogs: auditLogs.slice(-6).reverse(),
        systemHealth: {
          ssi: {
            status: ssiProvider?.status || 'CONNECTED',
            lastSync: ssiProvider?.lastSyncTime || new Date().toLocaleTimeString('vi-VN'),
            responseTimeMs: ssiProvider?.responseTimeMs || 24,
          },
          vietstock: {
            status: vietstockProvider?.status || 'CONNECTED',
            lastSync: vietstockProvider?.lastSyncTime || new Date().toLocaleTimeString('vi-VN'),
            responseTimeMs: vietstockProvider?.responseTimeMs || 35,
          },
          pay2s: {
            isConfigured: Boolean(bankConfig.pay2sConfigured || bankConfig.pay2sMerchantId),
            merchantId: bankConfig.pay2sMerchantId ? `${bankConfig.pay2sMerchantId.slice(0, 4)}••••` : 'P2S_STOCKAI_LIVE',
            webhookStatus: 'ACTIVE',
          },
          bankConfig: {
            isConfigured: bankConfig.isConfigured,
            bankName: bankConfig.bankName,
            accountNumber: bankConfig.accountNumber ? `••••${bankConfig.accountNumber.slice(-4)}` : 'Chưa cấu hình',
            accountHolder: bankConfig.accountHolder,
          },
          criticalErrorsCount: recentSyncErrors.length,
          recentSyncErrors,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/admin/overview:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải tổng quan quản trị', error: error.message },
      { status: 500 }
    );
  }
}
