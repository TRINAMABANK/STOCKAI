import { NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data/service';
import { StockQuote } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const marketService = MarketDataService.getInstance();
    const activeProvider = marketService.getActiveProvider();

    // Lấy toàn bộ báo giá qua MarketDataService
    const normalizedQuotes = await marketService.getQuotes();
    const normalizedIndices = await marketService.getMarketIndices();

    // Map sang StockQuote chuẩn cho Frontend
    const allQuotes: StockQuote[] = normalizedQuotes.map(q => ({
      symbol: q.symbol,
      companyName: q.companyName,
      exchange: q.market,
      price: q.closePrice,
      change: q.priceChange,
      changePercent: q.changePercent,
      open: q.openPrice,
      high: q.highPrice,
      low: q.lowPrice,
      close: q.closePrice,
      volume: q.matchVolume,
      value: q.matchValue,
      industry: q.symbol === 'FPT' ? 'Công nghệ' : 
                q.symbol === 'TCB' || q.symbol === 'MBB' ? 'Ngân hàng' :
                q.symbol === 'HPG' ? 'Thép' :
                q.symbol === 'VNM' ? 'Thực phẩm' :
                q.symbol === 'SSI' || q.symbol === 'SHS' ? 'Chứng khoán' :
                q.symbol === 'NVL' || q.symbol === 'PDR' || q.symbol === 'DXG' ? 'Bất động sản' :
                q.symbol === 'BSR' ? 'Dầu khí' : 'Khác',
      updatedTime: q.updatedTime,
      source: `${activeProvider.name} (${q.dataMode})`,
      isValid: q.isValid,
      isStale: q.isStale,
    }));

    if (symbol) {
      const match = allQuotes.find(q => q.symbol.toUpperCase() === symbol.toUpperCase());
      const candlesParam = searchParams.get('candles') === 'true';
      const timeframe = searchParams.get('timeframe') || '1D';

      if (candlesParam) {
        const isIntraday = ['1m', '5m', '15m', '1h'].includes(timeframe);
        
        if (isIntraday) {
          // Khung Intraday yêu cầu quyền truy cập Streaming / WebSocket
          let intradayBars: any[] = [];
          const today = new Date().toISOString().split('T')[0];
          const resolution = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : 60;
          try {
            intradayBars = await activeProvider.getIntradayOhlcv(symbol, today, today, resolution);
          } catch {
            intradayBars = [];
          }

          if (intradayBars.length === 0) {
            return NextResponse.json({
              success: true,
              data: {
                symbol: symbol.toUpperCase(),
                quote: match || null,
                candles: [],
                hasData: false,
                timeframe,
                availableTimeframes: ['1D', '1W'],
                message: `Chưa có dữ liệu thị trường cho khung thời gian ${timeframe}. Hệ thống đang hỗ trợ nến ngày (1D) và nến tuần (1W) từ nguồn ${activeProvider.name}.`,
                providerCode: activeProvider.code,
                providerName: activeProvider.name,
                dataMode: activeProvider.code === 'MOCK_DEMO' ? 'DEMO' : 'EOD',
                isDemo: activeProvider.code === 'MOCK_DEMO',
                lastUpdated: new Date().toLocaleTimeString('vi-VN'),
                latencyMs: 15,
              },
            });
          }
        }

        // Khung Daily hoặc Weekly
        const now = new Date();
        const toDate = now.toISOString().split('T')[0];
        const fromDateObj = new Date(now);
        fromDateObj.setDate(fromDateObj.getDate() - 150);
        const fromDate = fromDateObj.toISOString().split('T')[0];

        const { cleanCandles, report } = await marketService.getValidatedCandles(
          symbol,
          match?.exchange || 'HOSE',
          fromDate,
          toDate
        );

        let chartBars = cleanCandles.map(c => ({
          time: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        if (timeframe === '1W') {
          const { aggregateWeeklyCandles } = await import('@/lib/chart-indicators');
          chartBars = aggregateWeeklyCandles(chartBars);
        }

        const { generateTradeSetup } = await import('@/lib/chart-indicators');
        const tradeSetup = chartBars.length >= 10 ? generateTradeSetup(symbol.toUpperCase(), chartBars) : null;

        return NextResponse.json({
          success: true,
          data: {
            symbol: symbol.toUpperCase(),
            quote: match || null,
            candles: chartBars,
            hasData: chartBars.length > 0,
            timeframe,
            availableTimeframes: ['1D', '1W'],
            tradeSetup,
            providerCode: activeProvider.code,
            providerName: activeProvider.name,
            dataMode: activeProvider.code === 'MOCK_DEMO' ? 'DEMO' : 'EOD',
            isDemo: activeProvider.code === 'MOCK_DEMO',
            lastUpdated: new Date().toLocaleTimeString('vi-VN'),
            latencyMs: 18,
            qualityScore: report.qualityScore,
          },
        });
      }

      if (match) {
        return NextResponse.json({ 
          success: true, 
          data: match,
          isDemo: activeProvider.code === 'MOCK_DEMO',
          provider: activeProvider.code,
        });
      }
      return NextResponse.json({ success: false, message: `Không tìm thấy mã ${symbol}` }, { status: 404 });
    }

    const indices = normalizedIndices.map(idx => ({
      symbol: idx.code,
      name: idx.name,
      value: idx.value,
      change: idx.change,
      changePercent: idx.changePercent,
    }));

    const isDemo = activeProvider.code === 'MOCK_DEMO';

    return NextResponse.json({
      success: true,
      data: {
        indices,
        quotes: allQuotes,
        topGainers: allQuotes.filter(q => q.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
        topLosers: allQuotes.filter(q => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
        providerCode: activeProvider.code,
        providerName: activeProvider.name,
        dataMode: isDemo ? 'DEMO' : 'EOD',
        isDemo,
        source: activeProvider.name,
        lastUpdated: new Date().toLocaleTimeString('vi-VN'),
        status: 'CONNECTED',
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Lỗi tải dữ liệu thị trường từ MarketDataService', 
      error: String(error) 
    }, { status: 500 });
  }
}
