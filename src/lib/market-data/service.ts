import { Exchange, T3Signal } from '@/types';
import { 
  IMarketDataProvider, 
  NormalizedQuote, 
  NormalizedIndex, 
  NormalizedSecurity, 
  ProviderHealthStatus, 
  DataQualityReport 
} from './types';
import { SsiFastConnectProvider } from './ssi-provider';
import { MockMarketDataProvider } from './mock-provider';
import { validateAndSanitizeCandles, canGenerateLiveTradingSignal } from './quality-checker';
import { analyzeT3Opportunity, Candle } from '@/lib/t3-engine';
import { 
  MarketAlertItem, 
  MarketOverviewData 
} from '@/types';
import {
  calculateMarketOverview,
  detectBreakout20,
  detectVolumeSurge,
  detectConsecutiveUpStreak,
  detectFailedBreakout,
  detectTrendWeakening,
  deduplicateAndMergeAlert
} from '@/lib/market-alerts-engine';
import { getDatabase, saveDatabase } from '@/lib/db';

/**
 * Lớp điều phối dịch vụ Dữ liệu Thị trường (MarketDataService Singleton)
 * Độc lập với các bộ phân tích, cho phép hoán đổi nhà cung cấp mà không phải viết lại logic nghiệp vụ
 */
export class MarketDataService {
  private static instance: MarketDataService;
  private providers: Map<string, IMarketDataProvider> = new Map();
  private activeProviderCode: string = 'SSI';

  private constructor() {
    // Đăng ký các nhà cung cấp
    const ssi = new SsiFastConnectProvider();
    const mock = new MockMarketDataProvider();

    this.providers.set(ssi.code, ssi);
    this.providers.set(mock.code, mock);

    // Nếu SSI chưa có credentials, mặc định sử dụng Mock Provider (gắn nhãn DEMO)
    if (ssi.hasCredentials()) {
      this.activeProviderCode = ssi.code;
    } else {
      this.activeProviderCode = mock.code;
    }
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Lấy nhà cung cấp đang hoạt động
   */
  public getActiveProvider(): IMarketDataProvider {
    const provider = this.providers.get(this.activeProviderCode);
    if (!provider) {
      return this.providers.get('MOCK_DEMO')!;
    }
    return provider;
  }

  /**
   * Lấy trực tiếp adapter SSI FastConnect Provider
   */
  public getSsiProvider(): SsiFastConnectProvider {
    return this.providers.get('SSI') as SsiFastConnectProvider;
  }

  /**
   * Thay đổi nhà cung cấp dữ liệu thị trường (Hot-swap)
   */
  public setActiveProvider(code: string): boolean {
    if (this.providers.has(code)) {
      this.activeProviderCode = code;
      return true;
    }
    return false;
  }

  /**
   * Danh sách mã nhà cung cấp đã đăng ký
   */
  public getAvailableProviders(): Array<{ code: string; name: string; description: string; isActive: boolean }> {
    return Array.from(this.providers.values()).map(p => ({
      code: p.code,
      name: p.name,
      description: p.description,
      isActive: p.code === this.activeProviderCode,
    }));
  }

  /**
   * Kiểm tra kết nối của một nhà cung cấp
   */
  public async testProvider(code: string): Promise<ProviderHealthStatus> {
    const provider = this.providers.get(code);
    if (!provider) {
      return {
        providerCode: code,
        providerName: code,
        status: 'ERROR',
        lastChecked: new Date().toISOString(),
        hasCredentials: false,
        endpoint: '',
        errorMessage: `Nhà cung cấp [${code}] không tồn tại trong hệ thống.`,
        supportedMarkets: [],
        dataModes: [],
      };
    }
    return await provider.testConnection();
  }

  /**
   * Lấy danh sách mã chứng khoán chuẩn hóa
   */
  public async getSecurities(market?: Exchange): Promise<NormalizedSecurity[]> {
    return await this.getActiveProvider().getSecurities(market);
  }

  /**
   * Lấy báo giá thị trường (Full board quotes)
   */
  public async getQuotes(symbols?: string[], market?: Exchange): Promise<NormalizedQuote[]> {
    return await this.getActiveProvider().getQuotes(symbols, market);
  }

  /**
   * Lấy thông số chỉ số thị trường chính (VN-Index, VN30, HNX, UPCoM)
   */
  public async getMarketIndices(): Promise<NormalizedIndex[]> {
    return await this.getActiveProvider().getMarketIndices();
  }

  /**
   * Lấy nến lịch sử đã được kiểm định chất lượng nghiêm ngặt
   */
  public async getValidatedCandles(
    symbol: string,
    exchange: Exchange,
    fromDate: string,
    toDate: string
  ): Promise<{ cleanCandles: Candle[]; report: DataQualityReport }> {
    const provider = this.getActiveProvider();
    const isDemo = provider.code === 'MOCK_DEMO';

    const rawBars = await provider.getDailyOhlcv(symbol, fromDate, toDate);
    const dataMode = isDemo ? 'DEMO' : 'EOD';

    return validateAndSanitizeCandles(symbol, exchange, rawBars, isDemo, dataMode);
  }

  /**
   * ĐỘNG CƠ QUÉT VÀ CHẤM ĐIỂM T+1 ĐẾN T+5 TỪ DỮ LIỆU ĐÃ KIỂM ĐỊNH (Validated Feed)
   * 
   * Nguyên tắc:
   * 1. Chỉ đưa nến sạch vào thuật toán phân tích
   * 2. Nếu là dữ liệu DEMO: Đánh dấu rõ ràng isDemo = true, không được dùng để phát tín hiệu thật
   * 3. Hỗ trợ ZERO-MATCH: Khi thị trường xấu hoặc không có mã đạt tỷ lệ R:R >= 1.5, trả về mảng rỗng []
   */
  public async scanT3Opportunities(symbols: Array<{ symbol: string; companyName: string; exchange: Exchange }>): Promise<{
    signals: T3Signal[];
    qualityReports: Record<string, DataQualityReport>;
    scannedCount: number;
    matchCount: number;
    marketConditionNote: string;
  }> {
    const signals: T3Signal[] = [];
    const qualityReports: Record<string, DataQualityReport> = {};

    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDateObj = new Date(now);
    fromDateObj.setDate(fromDateObj.getDate() - 90); // 90 ngày để đủ tối thiểu 50 nến giao dịch
    const fromDate = fromDateObj.toISOString().split('T')[0];

    for (const item of symbols) {
      try {
        const { cleanCandles, report } = await this.getValidatedCandles(
          item.symbol,
          item.exchange,
          fromDate,
          toDate
        );

        qualityReports[item.symbol] = report;

        // Nếu dữ liệu bị lỗi hoặc không đủ 20 phiên, bỏ qua mã này
        const permission = canGenerateLiveTradingSignal(report);
        // Lưu ý: Nếu là DEMO nhưng người dùng đang ở chế độ xem thử nghiệm, vẫn cho phân tích mẫu nhưng gán nhãn
        if (report.status === 'CORRUPTED' || report.status === 'INSUFFICIENT') {
          continue;
        }

        const signal = analyzeT3Opportunity(
          item.symbol,
          item.companyName,
          item.exchange,
          cleanCandles,
          '15:00:00'
        );

        if (signal) {
          // Bổ sung thông tin cờ DEMO nếu đang chạy trên dữ liệu mô phỏng
          if (report.isDemo) {
            signal.rationale = `[DỮ LIỆU MÔ PHỎNG DEMO] ${signal.rationale}`;
          }
          signals.push(signal);
        }
      } catch (err) {
        console.error(`[MarketDataService] Lỗi quét mã ${item.symbol}:`, err);
      }
    }

    // Sắp xếp theo điểm T+3 Score giảm dần
    signals.sort((a, b) => b.t3Score - a.t3Score);

    let marketConditionNote = 'Thị trường có cơ hội giao dịch ngắn hạn đạt chuẩn quản trị rủi ro.';
    if (signals.length === 0) {
      marketConditionNote = 'Không có cổ phiếu đạt tiêu chí T+1–T+5 hôm nay (R:R >= 1.5 hoặc RSI nằm ngoài vùng quá mua). Thị trường không phù hợp để mở vị thế mới.';
    }

    return {
      signals,
      qualityReports,
      scannedCount: symbols.length,
      matchCount: signals.length,
      marketConditionNote,
    };
  }

  /**
   * Lấy dữ liệu Tổng quan Thị trường (Market Overview) đã kiểm định
   */
  public async getMarketAlertsOverview(): Promise<MarketOverviewData> {
    const indices = await this.getMarketIndices();
    const quotes = await this.getQuotes();
    
    // Thu thập lịch sử nến của các mã
    const candlesMap: Record<string, Candle[]> = {};
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDateObj = new Date(now);
    fromDateObj.setDate(fromDateObj.getDate() - 120);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    for (const q of quotes.slice(0, 20)) {
      try {
        const { cleanCandles } = await this.getValidatedCandles(q.symbol, q.market, fromDate, toDate);
        if (cleanCandles.length >= 20) {
          candlesMap[q.symbol] = cleanCandles;
        }
      } catch (e) {
        // Bỏ qua lỗi từng mã lẻ
      }
    }

    return calculateMarketOverview(indices, quotes, candlesMap);
  }

  /**
   * Quét và phát hiện các Cảnh báo Thị trường & Dòng tiền mới
   */
  public async scanMarketAlerts(): Promise<{
    scannedCount: number;
    newAlertsCount: number;
    updatedAlertsCount: number;
    alerts: MarketAlertItem[];
  }> {
    const securities = await this.getSecurities();
    const quotes = await this.getQuotes();
    const quotesMap = new Map(quotes.map(q => [q.symbol, q]));
    
    const db = getDatabase();
    let existingAlerts: MarketAlertItem[] = db.market_alerts || [];
    let newAlertsCount = 0;
    let updatedAlertsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const fromDateObj = new Date(now);
    fromDateObj.setDate(fromDateObj.getDate() - 90);
    const fromDate = fromDateObj.toISOString().split('T')[0];
    const toDate = todayStr;

    for (const sec of securities) {
      const quote = quotesMap.get(sec.symbol);
      if (!quote) continue;

      try {
        const { cleanCandles, report } = await this.getValidatedCandles(sec.symbol, sec.market, fromDate, toDate);
        if (cleanCandles.length < 21) continue;

        // 1. Kiểm tra Breakout 20
        const breakout = detectBreakout20(sec.symbol, sec.market, cleanCandles, quote);
        if (breakout && breakout.isBreakout) {
          const res = deduplicateAndMergeAlert({
            symbol: sec.symbol,
            exchange: sec.market,
            eventType: 'BREAKOUT_20',
            tradingSession: todayStr,
            detectedAt: `${todayStr} ${quote.updatedTime || '14:35:00'}`,
            alertPrice: quote.closePrice,
            currentPrice: quote.closePrice,
            priceChangeFromAlertPercent: 0,
            volumeRatio: breakout.volumeRatio,
            indicatorValues: {
              breakoutPeak20: breakout.breakoutPeak,
              rsi: breakout.rsi,
              confirmedAtClose: breakout.isConfirmed,
            },
            dataSource: quote.source,
            dataMode: quote.dataMode,
            ruleVersion: 'v2.0',
            status: breakout.isConfirmed ? 'CONFIRMED' : 'WATCHING',
            riskLevel: 'THẤP',
            title: `Bứt phá đỉnh 20 phiên (${sec.symbol})`,
            description: breakout.description,
          }, existingAlerts);
          existingAlerts = res.updatedAlerts;
          if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
        }

        // 2. Kiểm tra Khối lượng đột biến
        const surge = detectVolumeSurge(sec.symbol, cleanCandles, quote);
        if (surge && surge.isSurge) {
          const res = deduplicateAndMergeAlert({
            symbol: sec.symbol,
            exchange: sec.market,
            eventType: 'VOLUME_SURGE',
            tradingSession: todayStr,
            detectedAt: `${todayStr} ${quote.updatedTime || '14:35:00'}`,
            alertPrice: quote.closePrice,
            currentPrice: quote.closePrice,
            priceChangeFromAlertPercent: 0,
            volumeRatio: surge.volumeRatio,
            indicatorValues: {
              referenceVolume20: surge.avgVolume20,
              currentVolume: surge.currentVolume,
              intradayOnly: surge.isIntraday,
            },
            dataSource: quote.source,
            dataMode: quote.dataMode,
            ruleVersion: 'v2.0',
            status: 'CONFIRMED',
            riskLevel: 'THẤP',
            title: `Khối lượng đột biến ${surge.volumeRatioFormatted} (${sec.symbol})`,
            description: surge.description,
          }, existingAlerts);
          existingAlerts = res.updatedAlerts;
          if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
        }

        // 3. Kiểm tra Tăng liên tiếp nhiều phiên
        const streak = detectConsecutiveUpStreak(cleanCandles, quote, 3);
        if (streak && streak.hasStreak) {
          const res = deduplicateAndMergeAlert({
            symbol: sec.symbol,
            exchange: sec.market,
            eventType: 'CONSECUTIVE_UP',
            tradingSession: todayStr,
            detectedAt: `${todayStr} ${quote.updatedTime || '14:35:00'}`,
            alertPrice: quote.closePrice,
            currentPrice: quote.closePrice,
            priceChangeFromAlertPercent: 0,
            volumeRatio: 1.2,
            indicatorValues: {
              streakDays: streak.streakDays,
            },
            dataSource: quote.source,
            dataMode: quote.dataMode,
            ruleVersion: 'v2.0',
            status: 'WATCHING',
            riskLevel: 'TRUNG BÌNH',
            title: `Tăng liên tiếp ${streak.streakDays} phiên (${sec.symbol})`,
            description: streak.description,
            cautionNote: streak.cautionNotice,
          }, existingAlerts);
          existingAlerts = res.updatedAlerts;
          if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
        }

        // 4. Kiểm tra Bứt phá thất bại (Bull trap)
        const failed = detectFailedBreakout(cleanCandles, quote);
        if (failed && failed.isFailed) {
          const res = deduplicateAndMergeAlert({
            symbol: sec.symbol,
            exchange: sec.market,
            eventType: 'FAILED_BREAKOUT',
            tradingSession: todayStr,
            detectedAt: `${todayStr} ${quote.updatedTime || '14:35:00'}`,
            alertPrice: quote.closePrice,
            currentPrice: quote.closePrice,
            priceChangeFromAlertPercent: 0,
            volumeRatio: 1.1,
            indicatorValues: {
              breakoutPeak20: failed.breakoutPeak,
              dropBelowPercent: failed.dropBelowPercent,
            },
            dataSource: quote.source,
            dataMode: quote.dataMode,
            ruleVersion: 'v2.0',
            status: 'FAILED',
            riskLevel: 'CAO',
            title: `Bứt phá thất bại (${sec.symbol})`,
            description: failed.description,
          }, existingAlerts);
          existingAlerts = res.updatedAlerts;
          if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
        }

        // 5. Kiểm tra Suy yếu xu hướng
        const weak = detectTrendWeakening(cleanCandles, quote);
        if (weak && weak.isWeakening) {
          const res = deduplicateAndMergeAlert({
            symbol: sec.symbol,
            exchange: sec.market,
            eventType: 'TREND_WEAKENING',
            tradingSession: todayStr,
            detectedAt: `${todayStr} ${quote.updatedTime || '14:35:00'}`,
            alertPrice: quote.closePrice,
            currentPrice: quote.closePrice,
            priceChangeFromAlertPercent: 0,
            volumeRatio: 0.9,
            indicatorValues: {
              ma20: weak.ma20,
              ma50: weak.ma50,
              rsi: weak.rsi,
            },
            dataSource: quote.source,
            dataMode: quote.dataMode,
            ruleVersion: 'v2.0',
            status: 'WATCHING',
            riskLevel: 'TRUNG BÌNH',
            title: `Suy yếu xu hướng (${sec.symbol})`,
            description: weak.description,
          }, existingAlerts);
          existingAlerts = res.updatedAlerts;
          if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
        }
      } catch (err) {
        console.error(`Lỗi quét cảnh báo mã ${sec.symbol}:`, err);
      }
    }

    // 6. Kiểm tra Danh mục nắm giữ để tạo cảnh báo Cắt lỗ / Chốt lời
    const holdings = db.holdings || [];
    for (const h of holdings) {
      const q = quotesMap.get(h.symbol);
      if (!q) continue;

      const pnlPct = h.costBasis > 0 ? ((q.closePrice - h.costBasis) / h.costBasis) * 100 : 0;
      if (pnlPct <= -7) {
        // Cắt lỗ
        const res = deduplicateAndMergeAlert({
          symbol: h.symbol,
          exchange: q.market,
          eventType: 'STOP_LOSS',
          tradingSession: todayStr,
          detectedAt: `${todayStr} ${q.updatedTime || '14:35:00'}`,
          alertPrice: q.closePrice,
          currentPrice: q.closePrice,
          priceChangeFromAlertPercent: 0,
          volumeRatio: 1.0,
          indicatorValues: {
            costBasis: h.costBasis,
            pnlPercent: Number(pnlPct.toFixed(2)),
          },
          dataSource: q.source,
          dataMode: q.dataMode,
          ruleVersion: 'v2.0',
          status: 'CONFIRMED',
          riskLevel: 'CAO',
          title: `Chạm ngưỡng cắt lỗ phòng thủ (${h.symbol})`,
          description: `Giá hiện tại ${q.closePrice.toLocaleString('vi-VN')} đ vi phạm ngưỡng cắt lỗ -7% so với giá vốn (${h.costBasis.toLocaleString('vi-VN')} đ). Hệ thống không tự động đặt lệnh.`,
        }, existingAlerts);
        existingAlerts = res.updatedAlerts;
        if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
      } else if (pnlPct >= 10) {
        // Chốt lời
        const res = deduplicateAndMergeAlert({
          symbol: h.symbol,
          exchange: q.market,
          eventType: 'TAKE_PROFIT',
          tradingSession: todayStr,
          detectedAt: `${todayStr} ${q.updatedTime || '14:35:00'}`,
          alertPrice: q.closePrice,
          currentPrice: q.closePrice,
          priceChangeFromAlertPercent: 0,
          volumeRatio: 1.0,
          indicatorValues: {
            costBasis: h.costBasis,
            pnlPercent: Number(pnlPct.toFixed(2)),
          },
          dataSource: q.source,
          dataMode: q.dataMode,
          ruleVersion: 'v2.0',
          status: 'CONFIRMED',
          riskLevel: 'THẤP',
          title: `Đạt mục tiêu chốt lời (${h.symbol})`,
          description: `Lợi nhuận đạt +${pnlPct.toFixed(1)}% so với giá vốn. Cân nhắc hiện thực hóa lợi nhuận từng phần. Hệ thống không tự động đặt lệnh.`,
        }, existingAlerts);
        existingAlerts = res.updatedAlerts;
        if (res.isNew) newAlertsCount++; else updatedAlertsCount++;
      }
    }

    // Lưu danh sách cảnh báo đã gộp vào Database
    db.market_alerts = existingAlerts;
    saveDatabase(db);

    return {
      scannedCount: securities.length,
      newAlertsCount,
      updatedAlertsCount,
      alerts: existingAlerts,
    };
  }

}
