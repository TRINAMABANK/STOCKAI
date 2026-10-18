import { Exchange } from '@/types';
import { 
  IMarketDataProvider, 
  NormalizedSecurity, 
  NormalizedOhlcv, 
  NormalizedQuote, 
  NormalizedIndex, 
  ProviderHealthStatus 
} from './types';
import { 
  normalizeDate, 
  formatDateToSsi, 
  normalizePrice, 
  normalizeVolume, 
  normalizeSymbol, 
  normalizeExchange 
} from './normalizer';

/**
 * Adapter triển khai kết nối SSI FastConnect Data API v2.0
 * Dựa trên tài liệu đặc tả chính thức: https://guide.ssi.com.vn/ssi-products/fastconnect-data/api-specs
 * 
 * Lưu ý:
 * - Bảo vệ ConsumerID và ConsumerSecret ở backend (.env.local)
 * - Tự động quản lý AccessToken và tính toán thời gian phản hồi (latency)
 * - Nếu chưa cấu hình Key, thông báo UNCONFIGURED rõ ràng (Không giả mạo kết nối)
 */
export class SsiFastConnectProvider implements IMarketDataProvider {
  readonly code = 'SSI';
  readonly name = 'SSI FastConnect Data API';
  readonly description = 'Dữ liệu thị trường HOSE, HNX, UPCoM chính thống từ Công ty Chứng khoán SSI';

  private baseUrl: string;
  private consumerId: string;
  private consumerSecret: string;
  private cachedToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor() {
    this.baseUrl = (process.env.SSI_API_URL || 'https://fc-data.ssi.com.vn/api/v2').replace(/\/+$/, '');
    this.consumerId = process.env.SSI_CONSUMER_ID || '';
    this.consumerSecret = process.env.SSI_CONSUMER_SECRET || '';
  }

  /**
   * Kiểm tra thông tin cấu hình từ biến môi trường
   */
  public hasCredentials(): boolean {
    return Boolean(this.consumerId.trim() && this.consumerSecret.trim());
  }

  /**
   * Lấy AccessToken qua POST Market/AccessToken
   */
  public async getAccessToken(): Promise<{ token: string; latencyMs: number } | null> {
    if (!this.hasCredentials()) {
      return null;
    }

    // Tái sử dụng token nếu còn hiệu lực (trước khi hết hạn 5 phút)
    if (this.cachedToken && Date.now() < this.tokenExpiryTime) {
      return { token: this.cachedToken, latencyMs: 0 };
    }

    const startTime = Date.now();
    try {
      const endpoint = `${this.baseUrl}/Market/AccessToken`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          consumerID: this.consumerId,
          consumerSecret: this.consumerSecret,
        }),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data?.status === 200 && data?.data?.accessToken) {
        const token = String(data.data.accessToken);
        this.cachedToken = token;
        // Mặc định token SSI có hiệu lực trong vài giờ, cache an toàn 1 giờ
        this.tokenExpiryTime = Date.now() + 3600 * 1000;
        return { token, latencyMs };
      }

      console.error('[SSI Provider] Lỗi xác thực AccessToken:', data);
      return null;
    } catch (err) {
      console.error('[SSI Provider] Ngoại lệ kết nối AccessToken:', err);
      return null;
    }
  }

  /**
   * Kiểm tra kết nối thực tế tới máy chủ SSI
   */
  async testConnection(): Promise<ProviderHealthStatus> {
    const lastChecked = new Date().toISOString();
    const endpoint = `${this.baseUrl}/Market/AccessToken`;

    if (!this.hasCredentials()) {
      return {
        providerCode: this.code,
        providerName: this.name,
        status: 'NOT_CONFIGURED',
        lastChecked,
        hasCredentials: false,
        endpoint,
        errorMessage: 'Chưa cấu hình SSI_CONSUMER_ID hoặc SSI_CONSUMER_SECRET trong .env.local',
        errorCode: 'MISSING_CREDENTIALS',
        supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
        dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
      };
    }

    const startTime = Date.now();
    try {
      const auth = await this.getAccessToken();
      const latencyMs = Date.now() - startTime;

      if (!auth) {
        return {
          providerCode: this.code,
          providerName: this.name,
          status: 'ERROR',
          latencyMs,
          lastChecked,
          hasCredentials: true,
          endpoint,
          errorMessage: 'Xác thực không thành công. Vui lòng kiểm tra lại ConsumerID / Secret hoặc IP Whitelist trên SSI iBoard.',
          errorCode: 'AUTH_FAILED',
          supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
          dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
        };
      }

      return {
        providerCode: this.code,
        providerName: this.name,
        status: 'CONNECTED',
        latencyMs: auth.latencyMs || latencyMs,
        lastChecked,
        hasCredentials: true,
        endpoint,
        supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
        dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
      };
    } catch (err: any) {
      return {
        providerCode: this.code,
        providerName: this.name,
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        lastChecked,
        hasCredentials: true,
        endpoint,
        errorMessage: err.message || 'Không thể kết nối đến máy chủ SSI FastConnect.',
        errorCode: 'NETWORK_TIMEOUT',
        supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
        dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
      };
    }
  }

  /**
   * Lấy danh sách mã chứng khoán: GET /Market/Securities
   */
  async getSecurities(market?: Exchange): Promise<NormalizedSecurity[]> {
    const auth = await this.getAccessToken();
    if (!auth) {
      throw new Error('SSI FastConnect chưa được cấu hình hoặc xác thực không thành công.');
    }

    const marketParam = market ? market.toLowerCase() : '';
    const url = `${this.baseUrl}/Market/Securities?pageIndex=1&pageSize=1000${marketParam ? `&market=${marketParam}` : ''}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
    });

    const json = await res.json();
    if (!json?.data || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any) => ({
      symbol: normalizeSymbol(item.Symbol || item.symbol),
      name: item.StockName || item.stockName || '',
      enName: item.StockEnName || item.stockEnName || '',
      market: normalizeExchange(item.Market || item.market),
      secType: 'STOCK',
      lotSize: 100,
    }));
  }

  /**
   * Lấy lịch sử nến ngày (EOD): GET /Market/DailyOhlc
   */
  async getDailyOhlcv(
    symbol: string,
    fromDate: string,
    toDate: string,
    pageIndex: number = 1,
    pageSize: number = 100
  ): Promise<NormalizedOhlcv[]> {
    const auth = await this.getAccessToken();
    if (!auth) {
      throw new Error('SSI FastConnect chưa được cấu hình hoặc xác thực không thành công.');
    }

    const ssiFrom = formatDateToSsi(fromDate);
    const ssiTo = formatDateToSsi(toDate);
    const cleanSym = normalizeSymbol(symbol);

    const url = `${this.baseUrl}/Market/DailyOhlc?symbol=${cleanSym}&fromDate=${ssiFrom}&toDate=${ssiTo}&pageIndex=${pageIndex}&pageSize=${pageSize}&ascending=true`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
    });

    const json = await res.json();
    if (!json?.data || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any) => ({
      symbol: cleanSym,
      date: normalizeDate(item.TradingDate || item.tradingDate),
      open: normalizePrice(item.Open || item.open),
      high: normalizePrice(item.High || item.high),
      low: normalizePrice(item.Low || item.low),
      close: normalizePrice(item.Close || item.close),
      volume: normalizeVolume(item.Volume || item.volume),
      value: typeof item.Value === 'number' ? item.Value : parseFloat(item.Value || '0'),
      dataMode: 'EOD',
      source: 'SSI FastConnect Data',
    }));
  }

  /**
   * Lấy nến trong phiên (Intraday): GET /Market/IntradayOhlc
   */
  async getIntradayOhlcv(
    symbol: string,
    fromDate: string,
    toDate: string,
    resolutionMinutes: number = 1
  ): Promise<NormalizedOhlcv[]> {
    const auth = await this.getAccessToken();
    if (!auth) {
      throw new Error('SSI FastConnect chưa được cấu hình hoặc xác thực không thành công.');
    }

    const ssiFrom = formatDateToSsi(fromDate);
    const ssiTo = formatDateToSsi(toDate);
    const cleanSym = normalizeSymbol(symbol);

    const url = `${this.baseUrl}/Market/IntradayOhlc?symbol=${cleanSym}&fromDate=${ssiFrom}&toDate=${ssiTo}&pageIndex=1&pageSize=1000&ascending=true&resolution=${resolutionMinutes}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
    });

    const json = await res.json();
    if (!json?.data || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any) => ({
      symbol: cleanSym,
      date: normalizeDate(item.TradingDate || item.tradingDate),
      time: item.Time || item.time,
      open: normalizePrice(item.Open || item.open),
      high: normalizePrice(item.High || item.high),
      low: normalizePrice(item.Low || item.low),
      close: normalizePrice(item.Close || item.close),
      volume: normalizeVolume(item.Volume || item.volume),
      value: typeof item.Value === 'number' ? item.Value : parseFloat(item.Value || '0'),
      dataMode: 'INTRADAY_DELAYED',
      source: 'SSI FastConnect Data',
    }));
  }

  /**
   * Lấy báo giá chi tiết từng mã: GET /Market/DailyStockPrice
   */
  async getStockQuote(symbol: string): Promise<NormalizedQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes[0] || null;
  }

  /**
   * Lấy danh sách báo giá: GET /Market/DailyStockPrice
   */
  async getQuotes(symbols?: string[], market?: Exchange): Promise<NormalizedQuote[]> {
    const auth = await this.getAccessToken();
    if (!auth) {
      throw new Error('SSI FastConnect chưa được cấu hình hoặc xác thực không thành công.');
    }

    const todayStr = formatDateToSsi(new Date().toISOString());
    const marketParam = market ? `&market=${market}` : '';
    const symParam = symbols && symbols.length === 1 ? `&symbol=${normalizeSymbol(symbols[0])}` : '';

    const url = `${this.baseUrl}/Market/DailyStockPrice?fromDate=${todayStr}&toDate=${todayStr}&pageIndex=1&pageSize=1000${marketParam}${symParam}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
    });

    const json = await res.json();
    if (!json?.data || !Array.isArray(json.data)) {
      return [];
    }

    const results: NormalizedQuote[] = json.data.map((item: any) => {
      const sym = normalizeSymbol(item.Symbol);
      const ref = normalizePrice(item.RefPrice);
      const close = normalizePrice(item.ClosePrice) || ref;
      const change = typeof item.PriceChange === 'number' ? item.PriceChange : parseFloat(item.PriceChange || '0');
      const changePct = typeof item.PerPriceChange === 'number' ? item.PerPriceChange : parseFloat(item.PerPriceChange || '0');

      return {
        symbol: sym,
        companyName: item.SymbolName || sym,
        market: normalizeExchange(item.Market || market || 'HOSE'),
        refPrice: ref,
        ceilingPrice: normalizePrice(item.CeilingPrice),
        floorPrice: normalizePrice(item.FloorPrice),
        openPrice: normalizePrice(item.OpenPrice),
        highPrice: normalizePrice(item.HighestPrice),
        lowPrice: normalizePrice(item.LowestPrice),
        closePrice: close,
        priceChange: change,
        changePercent: changePct,
        matchVolume: normalizeVolume(item.TotalMatchVol || item.TotalTradedVol),
        matchValue: typeof item.TotalMatchVal === 'number' ? item.TotalMatchVal : parseFloat(item.TotalMatchVal || '0'),
        foreignBuyVol: normalizeVolume(item.ForeignBuyVolTotal),
        foreignSellVol: normalizeVolume(item.ForeignSellVolTotal),
        updatedTime: item.Time || '15:00:00',
        dataMode: 'EOD',
        source: 'SSI FastConnect Data',
        isDemo: false,
        isValid: true,
        isStale: false,
        qualityScore: 100,
      };
    });

    if (symbols && symbols.length > 0) {
      const upperSyms = new Set(symbols.map(s => normalizeSymbol(s)));
      return results.filter(q => upperSyms.has(q.symbol));
    }

    return results;
  }

  /**
   * Lấy thông số các chỉ số thị trường: GET /Market/DailyIndex
   */
  async getMarketIndices(): Promise<NormalizedIndex[]> {
    const auth = await this.getAccessToken();
    if (!auth) {
      throw new Error('SSI FastConnect chưa được cấu hình.');
    }

    const todayStr = formatDateToSsi(new Date().toISOString());
    const indexCodes = [
      { code: 'VNINDEX', name: 'VN-Index', exchange: 'HOSE' as Exchange },
      { code: 'VN30', name: 'VN30-Index', exchange: 'HOSE' as Exchange },
      { code: 'HNXINDEX', name: 'HNX-Index', exchange: 'HNX' as Exchange },
      { code: 'UPCOMINDEX', name: 'UPCoM-Index', exchange: 'UPCOM' as Exchange },
    ];

    const results: NormalizedIndex[] = [];

    for (const idx of indexCodes) {
      try {
        const url = `${this.baseUrl}/Market/DailyIndex?indexId=${idx.code}&fromDate=${todayStr}&toDate=${todayStr}&pageIndex=1&pageSize=1`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json',
          },
        });
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const item = json.data[0];
          results.push({
            code: idx.code,
            name: idx.name,
            exchange: idx.exchange,
            value: parseFloat(item.IndexValue || '0'),
            change: parseFloat(item.Change || '0'),
            changePercent: parseFloat(item.RatioChange || '0'),
            totalVolume: normalizeVolume(item.TotalVol || item.TotalMatchVol),
            totalValue: parseFloat(item.TotalVal || item.TotalMatchVal || '0'),
            advances: parseInt(item.Advances || '0', 10),
            declines: parseInt(item.Declines || '0', 10),
            noChanges: parseInt(item.NoChanges || '0', 10),
            ceilings: parseInt(item.Ceilings || '0', 10),
            floors: parseInt(item.Floors || '0', 10),
            tradingSession: item.TradingSession,
            updatedTime: item.Time || '15:00:00',
            dataMode: 'EOD',
            source: 'SSI FastConnect Data',
          });
        }
      } catch (err) {
        console.error(`[SSI Provider] Không thể tải chỉ số ${idx.code}:`, err);
      }
    }

    return results;
  }
}
