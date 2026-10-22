import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market-alerts/overview
 * Trả về thông số Tổng quan Thị trường (VN-Index, trạng thái, độ rộng, MA20/MA50, rủi ro, phân bổ tham khảo)
 */
export async function GET(req: NextRequest) {
  try {
    const service = MarketDataService.getInstance();
    const overview = await service.getMarketAlertsOverview();

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('Lỗi API /api/market-alerts/overview:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi tính toán tổng quan thị trường' },
      { status: 500 }
    );
  }
}
