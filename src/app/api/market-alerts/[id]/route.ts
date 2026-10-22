import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { MarketAlertItem, MarketAlertStatus } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/market-alerts/[id]
 * Cập nhật trạng thái hoặc ghi chú của một cảnh báo
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, note } = body;

    const db = getDatabase();
    const alerts: MarketAlertItem[] = db.market_alerts || [];
    const idx = alerts.findIndex(a => a.id === id);

    if (idx === -1) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy bản ghi cảnh báo' }, { status: 404 });
    }

    const item = alerts[idx];
    const now = new Date().toISOString();

    if (status && status !== item.status) {
      item.status = status as MarketAlertStatus;
      item.statusLogs.push({
        status: status as MarketAlertStatus,
        timestamp: now,
        note: note || `Người dùng đổi trạng thái sang ${status}`,
        price: item.currentPrice,
      });
    }

    if (note) {
      item.notes = note;
    }

    item.updatedAt = now;
    alerts[idx] = item;
    db.market_alerts = alerts;
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cảnh báo thành công',
      data: item,
    });
  } catch (error: any) {
    console.error('Lỗi API PATCH /api/market-alerts/[id]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi cập nhật' }, { status: 500 });
  }
}

/**
 * DELETE /api/market-alerts/[id]
 * Xóa một bản ghi cảnh báo
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDatabase();
    const alerts: MarketAlertItem[] = db.market_alerts || [];
    const filtered = alerts.filter(a => a.id !== id);

    if (filtered.length === alerts.length) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy cảnh báo để xóa' }, { status: 404 });
    }

    db.market_alerts = filtered;
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa cảnh báo thành công',
    });
  } catch (error: any) {
    console.error('Lỗi API DELETE /api/market-alerts/[id]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi xóa cảnh báo' }, { status: 500 });
  }
}
