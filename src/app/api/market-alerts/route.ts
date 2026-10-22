import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { MarketDataService } from '@/lib/market-data/service';
import { calculateFilterCounts } from '@/lib/market-alerts-engine';
import { MarketAlertItem, MarketAlertEventType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market-alerts
 * Lấy danh sách cảnh báo thị trường kèm bộ lọc và số lượng đếm trên từng chip
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'all';
    const exchange = searchParams.get('exchange') || 'ALL';
    const risk = searchParams.get('risk') || 'ALL';
    const search = (searchParams.get('search') || '').trim().toUpperCase();
    const status = searchParams.get('status') || 'ALL';

    const db = getDatabase();
    let allAlerts: MarketAlertItem[] = db.market_alerts || [];

    // Lấy danh sách mã trong watchlist & holdings để tính tab 'watchlist'
    const portfolioSymbols = (db.holdings || []).map(h => h.symbol);
    const watchlistSymbols = (db.watchlists || []).flatMap(w => w.symbols);
    const userTrackingSymbols = Array.from(new Set([...portfolioSymbols, ...watchlistSymbols]));

    // Tính số lượng thực tế cho 10 chip lọc từ toàn bộ bản ghi
    const counts = calculateFilterCounts(allAlerts, userTrackingSymbols);

    // Áp dụng bộ lọc tab
    let filtered = [...allAlerts];

    switch (tab) {
      case 'breakout':
        filtered = filtered.filter(a => a.eventType === 'BREAKOUT_20');
        break;
      case 'failed_breakout':
        filtered = filtered.filter(a => a.eventType === 'FAILED_BREAKOUT');
        break;
      case 'weakening':
        filtered = filtered.filter(a => a.eventType === 'TREND_WEAKENING');
        break;
      case 'stop_loss':
        filtered = filtered.filter(a => a.eventType === 'STOP_LOSS');
        break;
      case 'take_profit':
        filtered = filtered.filter(a => a.eventType === 'TAKE_PROFIT');
        break;
      case 'consecutive_up':
        filtered = filtered.filter(a => a.eventType === 'CONSECUTIVE_UP');
        break;
      case 'volume_surge':
        filtered = filtered.filter(a => a.eventType === 'VOLUME_SURGE');
        break;
      case 'corporate_action':
        filtered = filtered.filter(a => a.eventType === 'CORPORATE_ACTION');
        break;
      case 'watchlist':
        const set = new Set(userTrackingSymbols.map(s => s.toUpperCase()));
        filtered = filtered.filter(a => set.has(a.symbol.toUpperCase()) || a.eventType === 'PORTFOLIO_WATCHLIST');
        break;
      case 'all':
      default:
        // Giữ tất cả
        break;
    }

    // Lọc theo sàn giao dịch
    if (exchange !== 'ALL') {
      filtered = filtered.filter(a => a.exchange === exchange);
    }

    // Lọc theo mức rủi ro
    if (risk !== 'ALL') {
      filtered = filtered.filter(a => a.riskLevel === risk);
    }

    // Lọc theo trạng thái
    if (status !== 'ALL') {
      filtered = filtered.filter(a => a.status === status);
    }

    // Tìm kiếm theo mã cổ phiếu
    if (search) {
      filtered = filtered.filter(a => a.symbol.includes(search));
    }

    // Sắp xếp: Mới nhất lên đầu
    filtered.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        alerts: filtered,
        total: filtered.length,
        totalAll: allAlerts.length,
        counts,
        lastSync: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Lỗi API /api/market-alerts GET:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi lấy dữ liệu cảnh báo' }, { status: 500 });
  }
}

/**
 * POST /api/market-alerts
 * Kích hoạt quét thị trường tức thì hoặc thêm cảnh báo tùy chỉnh
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'SCAN_NOW') {
      const service = MarketDataService.getInstance();
      const result = await service.scanMarketAlerts();
      return NextResponse.json({
        success: true,
        message: `Đã hoàn thành quét thị trường. Quét ${result.scannedCount} mã, phát hiện ${result.newAlertsCount} cảnh báo mới, cập nhật ${result.updatedAlertsCount} cảnh báo.`,
        data: result,
      });
    }

    if (action === 'CREATE_ALERT') {
      const { symbol, exchange, eventType, alertPrice, notes } = body;
      if (!symbol || !alertPrice) {
        return NextResponse.json({ success: false, message: 'Thiếu mã cổ phiếu hoặc giá cảnh báo' }, { status: 400 });
      }

      const db = getDatabase();
      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];

      const newAlert: MarketAlertItem = {
        id: `alt_manual_${Date.now()}`,
        symbol: symbol.toUpperCase(),
        exchange: exchange || 'HOSE',
        eventType: (eventType as MarketAlertEventType) || 'BREAKOUT_20',
        tradingSession: todayStr,
        detectedAt: now,
        alertPrice: Number(alertPrice),
        currentPrice: Number(alertPrice),
        priceChangeFromAlertPercent: 0,
        volumeRatio: 1.0,
        indicatorValues: {},
        dataSource: 'USER_CUSTOM',
        dataMode: 'REALTIME',
        ruleVersion: 'v2.0',
        status: 'NEW',
        riskLevel: 'THẤP',
        title: `Cảnh báo người dùng đặt (${symbol.toUpperCase()})`,
        description: notes || `Người dùng thiết lập cảnh báo tại mức giá ${Number(alertPrice).toLocaleString('vi-VN')} đ`,
        statusLogs: [
          { status: 'NEW', timestamp: now, note: 'Khởi tạo thủ công bởi người dùng', price: Number(alertPrice) },
        ],
        updatedAt: now,
      };

      db.market_alerts = [newAlert, ...(db.market_alerts || [])];
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã tạo quy tắc cảnh báo cho ${symbol.toUpperCase()} thành công`,
        data: newAlert,
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi API /api/market-alerts POST:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi thực thi' }, { status: 500 });
  }
}
