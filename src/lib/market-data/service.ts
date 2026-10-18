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
}
