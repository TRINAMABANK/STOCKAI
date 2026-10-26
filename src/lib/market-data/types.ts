import { Exchange } from '@/types';

/**
 * Phân loại chế độ và độ trễ dữ liệu thị trường
 */
export type DataMode = 
  | 'EOD'              // Dữ liệu cuối ngày (sau khi đóng phiên 15:00)
  | 'INTRADAY_DELAYED' // Dữ liệu trong phiên có độ trễ (15 phút trễ)
  | 'REALTIME'         // Dữ liệu thời gian thực (Streaming WebSocket / Direct Ticker)
  | 'DEMO';            // Dữ liệu mô phỏng / mẫu (Chưa cấu hình API Key)

/**
 * Trạng thái chất lượng dữ liệu
 */
export type DataQualityStatus = 
  | 'VALID'            // Dữ liệu toàn vẹn, hợp lệ 100%
  | 'WARNING'          // Có cảnh báo nhẹ (ví dụ: khối lượng thấp, có gap nhỏ)
  | 'CORRUPTED'        // Lỗi logic OHLC hoặc vi phạm biên độ trần/sàn
  | 'STALE'            // Dữ liệu quá cũ so với phiên giao dịch hiện tại
  | 'INSUFFICIENT';    // Không đủ số phiên tối thiểu để chạy thuật toán (cần >= 20 nến)

/**
 * Báo cáo kiểm định chất lượng nến / dữ liệu
 */
export interface DataQualityReport {
  symbol: string;
  totalBars: number;
  validBars: number;
  status: DataQualityStatus;
  qualityScore: number; // Thang điểm 0 - 100
  isStale: boolean;
  isDemo: boolean;
  errors: string[];
  warnings: string[];
  lastUpdated: string;
  dataMode: DataMode;
}

/**
 * Cổ phiếu chuẩn hóa (Normalized Security)
 */
export interface NormalizedSecurity {
  symbol: string;
  name: string;
  enName?: string;
  market: Exchange;
  secType: 'STOCK' | 'ETF' | 'CW' | 'BOND';
  lotSize: number;
  listedShares?: number;
  isin?: string;
  status?: string;
}

/**
 * Nến OHLCV chuẩn hóa
 */
export interface NormalizedOhlcv {
  symbol: string;
  date: string;       // Định dạng chuẩn ISO: YYYY-MM-DD
  time?: string;      // HH:mm:ss (nếu là Intraday)
  open: number;       // Đơn vị: VNĐ
  high: number;       // Đơn vị: VNĐ
  low: number;        // Đơn vị: VNĐ
  close: number;      // Đơn vị: VNĐ
  volume: number;     // Khối lượng khớp lệnh (đơn vị: cổ phiếu)
  value?: number;     // Giá trị giao dịch (đơn vị: VNĐ)
  dataMode: DataMode;
  source: string;
}

/**
 * Báo giá thị trường chuẩn hóa (Full Quote / Board Item)
 */
export interface NormalizedQuote {
  symbol: string;
  companyName: string;
  market: Exchange;
  refPrice: number;       // Giá tham chiếu (VNĐ)
  ceilingPrice: number;   // Giá trần (VNĐ)
  floorPrice: number;     // Giá sàn (VNĐ)
  openPrice: number;      // Giá mở cửa (VNĐ)
  highPrice: number;      // Giá cao nhất (VNĐ)
  lowPrice: number;       // Giá thấp nhất (VNĐ)
  closePrice: number;     // Giá đóng cửa / khớp gần nhất (VNĐ)
  priceChange: number;    // Thay đổi giá (VNĐ)
  changePercent: number;  // % thay đổi
  matchVolume: number;    // Khối lượng khớp (cổ phiếu)
  matchValue: number;     // Giá trị khớp (VNĐ)
  foreignBuyVol?: number; // Khối ngoại mua
  foreignSellVol?: number;// Khối ngoại bán
  foreignNetValue?: number; // Giá trị mua ròng khối ngoại (VNĐ)
  foreignNetVolume?: number; // Khối lượng mua ròng khối ngoại
  updatedTime: string;    // Thời điểm cập nhật
  dataMode: DataMode;
  source: string;
  isDemo: boolean;
  isValid: boolean;
  isStale: boolean;
  qualityScore: number;
}

/**
 * Chỉ số thị trường chuẩn hóa (VN-Index, VN30, HNX-Index, UPCoM-Index)
 */
export interface NormalizedIndex {
  code: string;           // VNINDEX, VN30, HNX30, HNXINDEX, UPCOM
  name: string;
  exchange: Exchange;
  value: number;
  change: number;
  changePercent: number;
  totalVolume: number;
  totalValue: number;
  advances: number;       // Số mã tăng
  declines: number;       // Số mã giảm
  noChanges: number;      // Số mã đứng giá
  ceilings: number;       // Số mã kịch trần
  floors: number;         // Số mã kịch sàn
  tradingSession?: string;// ATO, CONTINUOUS, ATC, CLOSED
  updatedTime: string;
  dataMode: DataMode;
  source: string;
}

/**
 * Trạng thái kết nối của Nhà cung cấp dữ liệu
 */
export interface ProviderHealthStatus {
  providerCode: string;
  providerName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'CONFIGURED' | 'ERROR' | 'TESTING' | 'CONNECTION_FAILED' | 'SYNCING' | 'SYNC_ERROR';
  latencyMs?: number;
  lastChecked: string;
  hasCredentials: boolean;
  endpoint: string;
  errorMessage?: string;
  errorCode?: string;
  supportedMarkets: Exchange[];
  dataModes: DataMode[];
}

/**
 * Giao diện trừu tượng chuẩn mực của Nhà cung cấp dữ liệu thị trường (Market Data Provider Interface)
 * Cho phép hoán đổi SSI FastConnect, Vietstock, CafeF, MockProvider mà không sửa đổi bộ phân tích!
 */
export interface IMarketDataProvider {
  readonly code: string;
  readonly name: string;
  readonly description: string;

  /**
   * Kiểm tra kết nối và chứng thực API
   */
  testConnection(): Promise<ProviderHealthStatus>;

  /**
   * Lấy danh sách mã chứng khoán theo sàn
   */
  getSecurities(market?: Exchange): Promise<NormalizedSecurity[]>;

  /**
   * Lấy lịch sử nến ngày OHLCV (End-of-Day)
   */
  getDailyOhlcv(
    symbol: string,
    fromDate: string, // YYYY-MM-DD hoặc DD/MM/YYYY
    toDate: string,   // YYYY-MM-DD hoặc DD/MM/YYYY
    pageIndex?: number,
    pageSize?: number
  ): Promise<NormalizedOhlcv[]>;

  /**
   * Lấy dữ liệu nến trong phiên (Intraday)
   */
  getIntradayOhlcv(
    symbol: string,
    fromDate: string,
    toDate: string,
    resolutionMinutes?: number
  ): Promise<NormalizedOhlcv[]>;

  /**
   * Lấy bảng giá / báo giá chi tiết của 1 mã
   */
  getStockQuote(symbol: string): Promise<NormalizedQuote | null>;

  /**
   * Lấy bảng giá nhiều mã cùng lúc
   */
  getQuotes(symbols?: string[], market?: Exchange): Promise<NormalizedQuote[]>;

  /**
   * Lấy thông tin các chỉ số thị trường chính (VN-Index, VN30, HNX, UPCoM)
   */
  getMarketIndices(): Promise<NormalizedIndex[]>;
}
