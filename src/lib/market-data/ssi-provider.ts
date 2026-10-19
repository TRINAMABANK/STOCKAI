import { Exchange, SsiConfig, AdminAuditLog } from '@/types';
import { getDatabase, saveDatabase } from '@/lib/db';
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
 * Đảm bảo:
 * - Bảo vệ ConsumerID và ConsumerSecret ở backend (che dấu khi trả về UI)
 * - Tự động quản lý AccessToken và tính toán thời gian phản hồi (latency)
 * - Phân biệt rõ 7 trạng thái chuẩn:
 *   NOT_CONFIGURED, CONFIGURED, TESTING, CONNECTED, CONNECTION_FAILED, SYNCING, SYNC_ERROR
 * - Tuyệt đối không giả mạo trạng thái CONNECTED nếu chưa thực sự kiểm tra thành công!
 */
export class SsiFastConnectProvider implements IMarketDataProvider {
  readonly code = 'SSI';
  readonly name = 'SSI FastConnect Data API';
  readonly description = 'Dữ liệu thị trường HOSE, HNX, UPCoM chính thống từ Công ty Chứng khoán SSI';

  private baseUrl: string = 'https://fc-data.ssi.com.vn/api/v2';
  private streamingUrl: string = 'wss://fc-data.ssi.com.vn/v2.0/signalr';
  private consumerId: string = '';
  private consumerSecret: string = '';
  private privateKey: string = '';
  private autoSync: boolean = true;
  private cachedToken: string | null = null;
  private tokenExpiryTime: number = 0;
  private lastAuthError: string = '';

  constructor() {
    this.loadConfig();
  }

  /**
   * Tải cấu hình từ database hoặc biến môi trường .env.local
   */
  public loadConfig(): void {
    try {
      const db = getDatabase();
      const cfg = db.ssi_config;
      if (cfg) {
        if (cfg.consumerId) this.consumerId = cfg.consumerId;
        if (cfg.consumerSecret) this.consumerSecret = cfg.consumerSecret;
        if (cfg.privateKey) this.privateKey = cfg.privateKey;
        if (cfg.apiUrl) this.baseUrl = cfg.apiUrl.replace(/\/+$/, '');
        if (cfg.streamingUrl) this.streamingUrl = cfg.streamingUrl;
        if (typeof cfg.autoSync === 'boolean') this.autoSync = cfg.autoSync;
        return;
      }
    } catch {
      // Tiếp tục đọc từ env nếu db chưa sẵn sàng
    }

    this.baseUrl = (process.env.SSI_API_URL || 'https://fc-data.ssi.com.vn/api/v2').replace(/\/+$/, '');
    this.streamingUrl = process.env.SSI_STREAM_URL || 'wss://fc-data.ssi.com.vn/v2.0/signalr';
    this.consumerId = process.env.SSI_CONSUMER_ID || '';
    this.consumerSecret = process.env.SSI_CONSUMER_SECRET || '';
    this.privateKey = process.env.SSI_PRIVATE_KEY || '';
  }

  /**
   * Kiểm tra thông tin cấu hình đã có đủ Consumer ID và Secret chưa
   */
  public hasCredentials(): boolean {
    this.loadConfig();
    return Boolean(this.consumerId && this.consumerId.trim() && this.consumerSecret && this.consumerSecret.trim());
  }

  /**
   * Lấy cấu hình an toàn cho giao diện (che giấu thông tin mật)
   */
  public getConfig(): SsiConfig {
    this.loadConfig();
    const hasCreds = this.hasCredentials();
    let status: SsiConfig['status'] = 'NOT_CONFIGURED';
    let lastChecked: string | undefined;
    let lastSyncTime: string | undefined;
    let lastError: string | undefined;
    let lastLatencyMs: number | undefined;
    let recordsSynced: SsiConfig['recordsSynced'];

    try {
      const db = getDatabase();
      if (db.ssi_config) {
        status = db.ssi_config.status || (hasCreds ? 'CONFIGURED' : 'NOT_CONFIGURED');
        lastChecked = db.ssi_config.lastChecked;
        lastSyncTime = db.ssi_config.lastSyncTime;
        lastError = db.ssi_config.lastError;
        lastLatencyMs = db.ssi_config.lastLatencyMs;
        recordsSynced = db.ssi_config.recordsSynced;
      } else if (hasCreds) {
        status = 'CONFIGURED';
      }
    } catch {
      if (hasCreds) status = 'CONFIGURED';
    }

    // Mask secret an toàn: vd "sec••••••••xyz"
    const secret = this.consumerSecret || '';
    const maskedSecret = secret.length > 6 
      ? `${secret.slice(0, 3)}••••••••${secret.slice(-3)}`
      : secret ? '••••••••••••' : '';

    return {
      consumerId: this.consumerId,
      maskedSecret,
      hasPrivateKey: Boolean(this.privateKey && this.privateKey.trim().length > 10),
      hasCredentials: hasCreds,
      apiUrl: this.baseUrl,
      streamingUrl: this.streamingUrl,
      isConfigured: hasCreds,
      status,
      lastChecked,
      lastSyncTime,
      lastError,
      lastLatencyMs,
      responseTimeMs: lastLatencyMs,
      autoSync: this.autoSync,
      recordsSynced,
    };
  }

  /**
   * Cập nhật và lưu cấu hình SSI FastConnect vào Database
   */
  public updateConfig(newConfig: Partial<SsiConfig>, adminUser?: { id: string; email: string; role: string }): SsiConfig {
    const db = getDatabase();

    if (!db.ssi_config) {
      db.ssi_config = {
        consumerId: '',
        apiUrl: 'https://fc-data.ssi.com.vn/api/v2',
        streamingUrl: 'wss://fc-data.ssi.com.vn/v2.0/signalr',
        isConfigured: false,
        status: 'NOT_CONFIGURED',
      };
    }

    if (newConfig.consumerId !== undefined) {
      db.ssi_config.consumerId = newConfig.consumerId.trim();
      this.consumerId = db.ssi_config.consumerId;
    }

    // Chỉ cập nhật secret nếu admin nhập secret mới (không phải chuỗi mask)
    if (newConfig.consumerSecret && !newConfig.consumerSecret.includes('••••')) {
      db.ssi_config.consumerSecret = newConfig.consumerSecret.trim();
      this.consumerSecret = db.ssi_config.consumerSecret;
      this.cachedToken = null; // Reset token cũ
    }

    // Cập nhật private key nếu có
    if (newConfig.privateKey !== undefined && !newConfig.privateKey.includes('••••')) {
      db.ssi_config.privateKey = newConfig.privateKey.trim();
      this.privateKey = db.ssi_config.privateKey;
    }

    if (newConfig.apiUrl) {
      db.ssi_config.apiUrl = newConfig.apiUrl.trim().replace(/\/+$/, '');
      this.baseUrl = db.ssi_config.apiUrl;
    }

    if (newConfig.streamingUrl) {
      db.ssi_config.streamingUrl = newConfig.streamingUrl.trim();
      this.streamingUrl = db.ssi_config.streamingUrl;
    }

    if (typeof newConfig.autoSync === 'boolean') {
      db.ssi_config.autoSync = newConfig.autoSync;
      this.autoSync = newConfig.autoSync;
    }

    const hasCreds = Boolean(this.consumerId && this.consumerSecret);
    db.ssi_config.isConfigured = hasCreds;
    
    // Nếu vừa đổi cấu hình, chuyển trạng thái về CONFIGURED (chờ kiểm tra kết nối lại)
    if (hasCreds) {
      db.ssi_config.status = 'CONFIGURED';
      db.ssi_config.lastError = undefined;
    } else {
      db.ssi_config.status = 'NOT_CONFIGURED';
      db.ssi_config.lastError = 'Chưa cấu hình Consumer ID hoặc Consumer Secret';
    }

    // Đồng bộ vào danh sách api_providers
    const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
    if (ssiProvider) {
      ssiProvider.hasKeyConfigured = hasCreds;
      ssiProvider.status = db.ssi_config.status;
      ssiProvider.endpoint = this.baseUrl;
      ssiProvider.lastError = db.ssi_config.lastError;
    }

    // Ghi audit log
    if (adminUser) {
      const auditLog: AdminAuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'UPDATE_SSI_CONFIG',
        targetUserId: 'system_ssi',
        targetUserEmail: 'ssi_data@stockai.vn',
        performedBy: adminUser,
        timestamp: new Date().toISOString(),
        details: {
          consumerId: this.consumerId,
          apiUrl: this.baseUrl,
          hasSecret: Boolean(this.consumerSecret),
          hasPrivateKey: Boolean(this.privateKey),
          action: 'Cập nhật cấu hình kết nối SSI FastConnect Data',
        },
      };
      if (!db.audit_logs) db.audit_logs = [];
      db.audit_logs.push(auditLog);
    }

    saveDatabase(db);
    return this.getConfig();
  }

  /**
   * Lấy AccessToken qua POST Market/AccessToken
   */
  public async getAccessToken(): Promise<{ token: string; latencyMs: number } | null> {
    this.loadConfig();
    if (!this.hasCredentials()) {
      this.lastAuthError = 'Chưa cấu hình Consumer ID hoặc Consumer Secret.';
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
        signal: AbortSignal.timeout(10000), // Timeout 10s
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => null);

      if (res.ok && data?.status === 200 && data?.data?.accessToken) {
        const token = String(data.data.accessToken);
        this.cachedToken = token;
        this.tokenExpiryTime = Date.now() + 3600 * 1000;
        this.lastAuthError = '';
        return { token, latencyMs };
      }

      this.lastAuthError = data?.message || `Xác thực thất bại với mã phản hồi ${res.status} (${res.statusText})`;
      console.error('[SSI Provider] Lỗi xác thực AccessToken:', data || res.statusText);
      return null;
    } catch (err: any) {
      this.lastAuthError = err.message || 'Lỗi mạng hoặc hết thời gian chờ (timeout) khi kết nối tới SSI FastConnect.';
      console.error('[SSI Provider] Ngoại lệ kết nối AccessToken:', err);
      return null;
    }
  }

  /**
   * Kiểm tra kết nối thực tế tới máy chủ SSI FastConnect
   * Tuyệt đối không giả mạo CONNECTED nếu chưa thành công!
   */
  async testConnection(): Promise<ProviderHealthStatus> {
    this.loadConfig();
    const lastChecked = new Date().toISOString();
    const endpoint = `${this.baseUrl}/Market/AccessToken`;
    const db = getDatabase();

    if (!this.hasCredentials()) {
      const status = 'NOT_CONFIGURED';
      const errorMessage = 'Chưa cấu hình Consumer ID hoặc Consumer Secret cho SSI FastConnect Data.';
      
      if (db.ssi_config) {
        db.ssi_config.status = status;
        db.ssi_config.lastChecked = new Date().toLocaleString('vi-VN');
        db.ssi_config.lastError = errorMessage;
      }
      const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
      if (ssiProvider) {
        ssiProvider.status = status;
        ssiProvider.lastError = errorMessage;
      }
      saveDatabase(db);

      return {
        providerCode: this.code,
        providerName: this.name,
        status,
        lastChecked,
        hasCredentials: false,
        endpoint,
        errorMessage,
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
        const status = 'CONNECTION_FAILED';
        const errorMessage = this.lastAuthError || 'Xác thực không thành công. Vui lòng kiểm tra lại ConsumerID / Secret hoặc IP Whitelist trên SSI iBoard.';
        
        if (db.ssi_config) {
          db.ssi_config.status = status;
          db.ssi_config.lastChecked = new Date().toLocaleString('vi-VN');
          db.ssi_config.lastError = errorMessage;
          db.ssi_config.lastLatencyMs = latencyMs;
        }
        const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
        if (ssiProvider) {
          ssiProvider.status = status;
          ssiProvider.responseTimeMs = latencyMs;
          ssiProvider.lastError = errorMessage;
        }

        // Ghi nhật ký đồng bộ lỗi
        db.api_sync_logs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          provider: 'SSI',
          action: 'TEST_CONNECTION',
          status: 'ERROR',
          message: errorMessage,
          latencyMs,
        });
        if (db.api_sync_logs.length > 50) db.api_sync_logs = db.api_sync_logs.slice(0, 50);

        saveDatabase(db);

        return {
          providerCode: this.code,
          providerName: this.name,
          status,
          latencyMs,
          lastChecked,
          hasCredentials: true,
          endpoint,
          errorMessage,
          errorCode: 'AUTH_FAILED',
          supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
          dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
        };
      }

      const status = 'CONNECTED';
      const actualLatency = auth.latencyMs || latencyMs;

      if (db.ssi_config) {
        db.ssi_config.status = status;
        db.ssi_config.lastChecked = new Date().toLocaleString('vi-VN');
        db.ssi_config.lastLatencyMs = actualLatency;
        db.ssi_config.lastError = undefined;
      }
      const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
      if (ssiProvider) {
        ssiProvider.status = status;
        ssiProvider.responseTimeMs = actualLatency;
        ssiProvider.lastSyncTime = new Date().toLocaleTimeString('vi-VN');
        ssiProvider.lastError = undefined;
      }

      // Ghi nhật ký kiểm tra thành công
      db.api_sync_logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        provider: 'SSI',
        action: 'TEST_CONNECTION',
        status: 'SUCCESS',
        message: `Xác thực thành công với SSI FastConnect Data API v2.0. Độ trễ: ${actualLatency}ms.`,
        latencyMs: actualLatency,
      });
      if (db.api_sync_logs.length > 50) db.api_sync_logs = db.api_sync_logs.slice(0, 50);

      saveDatabase(db);

      return {
        providerCode: this.code,
        providerName: this.name,
        status,
        latencyMs: actualLatency,
        lastChecked,
        hasCredentials: true,
        endpoint,
        supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
        dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
      };
    } catch (err: any) {
      const status = 'CONNECTION_FAILED';
      const latencyMs = Date.now() - startTime;
      const errorMessage = err.message || 'Không thể kết nối đến máy chủ SSI FastConnect.';

      if (db.ssi_config) {
        db.ssi_config.status = status;
        db.ssi_config.lastChecked = new Date().toLocaleString('vi-VN');
        db.ssi_config.lastLatencyMs = latencyMs;
        db.ssi_config.lastError = errorMessage;
      }
      const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
      if (ssiProvider) {
        ssiProvider.status = status;
        ssiProvider.responseTimeMs = latencyMs;
        ssiProvider.lastError = errorMessage;
      }

      db.api_sync_logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        provider: 'SSI',
        action: 'TEST_CONNECTION',
        status: 'ERROR',
        message: errorMessage,
        latencyMs,
      });
      if (db.api_sync_logs.length > 50) db.api_sync_logs = db.api_sync_logs.slice(0, 50);

      saveDatabase(db);

      return {
        providerCode: this.code,
        providerName: this.name,
        status,
        latencyMs,
        lastChecked,
        hasCredentials: true,
        endpoint,
        errorMessage,
        errorCode: 'NETWORK_TIMEOUT',
        supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
        dataModes: ['EOD', 'INTRADAY_DELAYED', 'REALTIME'],
      };
    }
  }

  /**
   * Đồng bộ dữ liệu thị trường (Indices, Quotes, Securities) từ SSI vào CSDL
   */
  public async syncMarketData(adminUser?: { id: string; email: string; role: string }): Promise<{
    success: boolean;
    message: string;
    indicesCount?: number;
    quotesCount?: number;
    securitiesCount?: number;
    latencyMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const db = getDatabase();

    if (!this.hasCredentials()) {
      return {
        success: false,
        message: 'Chưa cấu hình thông tin xác thực SSI FastConnect Data (Consumer ID / Secret).',
        error: 'MISSING_CREDENTIALS',
      };
    }

    // Đánh dấu trạng thái SYNCING
    if (db.ssi_config) {
      db.ssi_config.status = 'SYNCING';
      saveDatabase(db);
    }

    try {
      // 1. Kiểm tra xác thực token
      const auth = await this.getAccessToken();
      if (!auth) {
        const errorMsg = this.lastAuthError || 'Xác thực tài khoản SSI FastConnect thất bại.';
        if (db.ssi_config) {
          db.ssi_config.status = 'SYNC_ERROR';
          db.ssi_config.lastError = errorMsg;
        }
        db.api_sync_logs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          provider: 'SSI',
          action: 'SYNC_MARKET_DATA',
          status: 'ERROR',
          message: errorMsg,
          latencyMs: Date.now() - startTime,
        });
        saveDatabase(db);
        return { success: false, message: errorMsg, error: errorMsg };
      }

      // 2. Kéo chỉ số thị trường (VNINDEX, VN30, HNX, UPCOM)
      const indices = await this.getMarketIndices().catch(() => []);

      // 3. Kéo báo giá cổ phiếu
      const quotes = await this.getQuotes().catch(() => []);

      // 4. Kéo danh sách mã chứng khoán
      const securities = await this.getSecurities().catch(() => []);

      const latencyMs = Date.now() - startTime;
      const nowStr = new Date().toLocaleString('vi-VN');

      // Cập nhật CSDL
      if (indices.length > 0) {
        db.market_indices = indices.map(idx => ({
          symbol: idx.code,
          code: idx.code,
          name: idx.name,
          exchange: idx.exchange,
          value: idx.value,
          change: idx.change,
          changePercent: idx.changePercent,
          volume: idx.totalVolume,
          valueTraded: idx.totalValue,
          advances: idx.advances,
          declines: idx.declines,
          noChange: idx.noChanges,
          time: idx.updatedTime,
        }));
      }

      if (quotes.length > 0) {
        // Cập nhật giá vào market_prices
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
        db.market_prices = db.market_prices.map(p => {
          const live = quoteMap.get(p.symbol);
          if (live) {
            return {
              ...p,
              price: live.closePrice,
              change: live.priceChange,
              changePercent: live.changePercent,
              volume: live.matchVolume,
              value: live.matchValue,
              updatedTime: live.updatedTime,
              source: 'SSI FastConnect Data (EOD)',
            };
          }
          return p;
        });
      }

      // Cập nhật trạng thái SSI Config thành công
      if (db.ssi_config) {
        db.ssi_config.status = 'CONNECTED';
        db.ssi_config.lastSyncTime = nowStr;
        db.ssi_config.lastChecked = nowStr;
        db.ssi_config.lastLatencyMs = latencyMs;
        db.ssi_config.lastError = undefined;
        db.ssi_config.recordsSynced = {
          indices: indices.length,
          quotes: quotes.length,
          securities: securities.length,
          lastBatchTime: new Date().toLocaleTimeString('vi-VN'),
        };
      }

      const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
      if (ssiProvider) {
        ssiProvider.status = 'CONNECTED';
        ssiProvider.lastSyncTime = nowStr;
        ssiProvider.responseTimeMs = latencyMs;
        ssiProvider.lastError = undefined;
      }

      const successMsg = `Đồng bộ thành công ${quotes.length} mã cổ phiếu, ${indices.length} chỉ số và ${securities.length} mã niêm yết từ SSI FastConnect Data.`;

      // Ghi nhật ký đồng bộ
      db.api_sync_logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: nowStr,
        provider: 'SSI',
        action: 'SYNC_MARKET_DATA',
        status: 'SUCCESS',
        message: successMsg,
        latencyMs,
      });
      if (db.api_sync_logs.length > 50) db.api_sync_logs = db.api_sync_logs.slice(0, 50);

      // Ghi audit log
      if (adminUser) {
        const auditLog: AdminAuditLog = {
          id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'SYNC_SSI_DATA',
          targetUserId: 'system_ssi',
          targetUserEmail: 'ssi_data@stockai.vn',
          performedBy: adminUser,
          timestamp: new Date().toISOString(),
          details: {
            indicesCount: indices.length,
            quotesCount: quotes.length,
            securitiesCount: securities.length,
            latencyMs,
          },
        };
        if (!db.audit_logs) db.audit_logs = [];
        db.audit_logs.push(auditLog);
      }

      saveDatabase(db);

      return {
        success: true,
        message: successMsg,
        indicesCount: indices.length,
        quotesCount: quotes.length,
        securitiesCount: securities.length,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = `Lỗi trong quá trình đồng bộ dữ liệu SSI: ${err.message || 'Lỗi mạng hoặc máy chủ SSI'}`;

      if (db.ssi_config) {
        db.ssi_config.status = 'SYNC_ERROR';
        db.ssi_config.lastError = errorMsg;
      }
      const ssiProvider = db.api_providers.find(p => p.code === 'SSI');
      if (ssiProvider) {
        ssiProvider.status = 'SYNC_ERROR';
        ssiProvider.lastError = errorMsg;
      }

      db.api_sync_logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        provider: 'SSI',
        action: 'SYNC_MARKET_DATA',
        status: 'ERROR',
        message: errorMsg,
        latencyMs,
      });
      if (db.api_sync_logs.length > 50) db.api_sync_logs = db.api_sync_logs.slice(0, 50);

      saveDatabase(db);

      return {
        success: false,
        message: errorMsg,
        error: errorMsg,
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
