import { NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data/service';
import { analyzeShortTermOpportunity, ShortTermSignal, ShortTermTradeStatus } from '@/lib/stockai-engine';
import { Exchange } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exchangeParam = searchParams.get('exchange') as Exchange | 'ALL' | null;
    const statusParam = searchParams.get('status') as ShortTermTradeStatus | 'ALL' | null;
    const minScoreParam = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!, 10) : 0;
    const minLiquidityParam = searchParams.get('minLiquidity') ? parseFloat(searchParams.get('minLiquidity')!) : 0;

    const marketService = MarketDataService.getInstance();
    const activeProvider = marketService.getActiveProvider();

    // 1. Lấy danh sách cổ phiếu cần quét
    const targetExchange = exchangeParam && exchangeParam !== 'ALL' ? exchangeParam : undefined;
    const securities = await marketService.getSecurities(targetExchange);

    // Chuẩn bị khung thời gian lịch sử 60 ngày
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDateObj = new Date(now);
    fromDateObj.setDate(fromDateObj.getDate() - 75);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    const allSignals: ShortTermSignal[] = [];

    // 2. Chạy qua động cơ định lượng StockAI
    for (const sec of securities) {
      try {
        const { cleanCandles, report } = await marketService.getValidatedCandles(
          sec.symbol,
          sec.market,
          fromDate,
          toDate
        );

        const signal = analyzeShortTermOpportunity(
          sec.symbol,
          sec.name,
          sec.market,
          cleanCandles,
          report
        );

        allSignals.push(signal);
      } catch (err) {
        console.error(`[Scanner API] Lỗi phân tích mã ${sec.symbol}:`, err);
      }
    }

    // 3. Sắp xếp điểm số từ cao xuống thấp
    allSignals.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // 4. Áp dụng các bộ lọc truy vấn
    let filtered = allSignals;

    if (statusParam && statusParam !== 'ALL') {
      filtered = filtered.filter(s => s.status === statusParam);
    }

    if (minScoreParam > 0) {
      filtered = filtered.filter(s => s.score.totalScore >= minScoreParam);
    }

    if (minLiquidityParam > 0) {
      filtered = filtered.filter(s => s.averageDailyValue >= minLiquidityParam);
    }

    const buyConfirmedCount = allSignals.filter(s => s.status === 'BUY_CONFIRMED').length;
    const watchlistCount = allSignals.filter(s => s.status === 'WATCHLIST').length;
    const unsuitableCount = allSignals.filter(s => s.status === 'UNSUITABLE').length;

    const isZeroMatch = filtered.length === 0;
    const zeroMatchReason = isZeroMatch 
      ? 'Không có cổ phiếu đạt tiêu chuẩn điểm số hoặc tỷ lệ R:R >= 1.5 trong điều kiện thị trường hiện tại. Tuân thủ nguyên tắc quản trị rủi ro đứng ngoài thị trường.'
      : '';

    const isDemo = activeProvider.code === 'MOCK_DEMO';

    return NextResponse.json({
      success: true,
      data: {
        signals: filtered,
        summary: {
          totalScanned: allSignals.length,
          returnedCount: filtered.length,
          buyConfirmedCount,
          watchlistCount,
          unsuitableCount,
          isZeroMatch,
          zeroMatchReason,
          providerCode: activeProvider.code,
          providerName: activeProvider.name,
          dataMode: isDemo ? 'DEMO' : 'EOD',
          isDemo,
          scannedAt: new Date().toLocaleTimeString('vi-VN'),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Lỗi trong quá trình quét cổ phiếu toàn thị trường',
      error: String(error),
    }, { status: 500 });
  }
}
