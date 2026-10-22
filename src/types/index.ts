export type Exchange = 'HOSE' | 'HNX' | 'UPCOM';
export type DataMode = 'EOD' | 'INTRADAY_DELAYED' | 'REALTIME' | 'DEMO';

export interface MarketIndex {
  symbol: string;
  code?: string;
  name: string;
  exchange?: Exchange;
  value: number;
  change: number;
  changePercent: number;
  volume?: number;
  valueTraded?: number;
  advances?: number;
  declines?: number;
  noChange?: number;
  time?: string;
  history?: number[];
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
  pe?: number;
  pb?: number;
  roe?: number;
  eps?: number;
  marketCap?: number;
  industry: string;
  rsi?: number;
  macd?: number;
  updatedTime: string;
  source: string;
  isValid: boolean;
  isStale: boolean;
}

export type T3Strategy = 'Breakout' | 'Pullback' | 'Momentum' | 'Reversal';
export type RiskLevel = 'Thấp' | 'Trung bình' | 'Cao';
export type T3Period = 'T+1' | 'T+3' | 'T+5';
export type T3SignalType = 'BUY' | 'SELL' | 'WATCHLIST';

export const STOCKAI_SECTORS = [
  'Tất cả ngành',
  'Ngân hàng',
  'Chứng khoán',
  'Bất động sản',
  'Thép',
  'Bán lẻ',
  'Công nghệ thông tin',
  'Dầu khí',
  'Điện và tiện ích',
  'Xây dựng và vật liệu',
  'Thực phẩm và đồ uống',
  'Vận tải và logistics',
  'Hóa chất',
  'Khác/chưa phân ngành',
] as const;

export type StockAiSector = typeof STOCKAI_SECTORS[number];

export interface T3Signal {
  id: string;
  symbol: string;
  companyName: string;
  exchange: Exchange;
  currentPrice: number;
  change?: number;
  changePercent?: number;
  dataTimestamp: string;
  t3Score: number;
  strategy: T3Strategy;
  buyZone: string;
  targetPrice: string;
  stopLoss: number;
  rewardRiskRatio: number;
  riskLevel: RiskLevel;
  liquidity: string;
  liquidityValue?: number;
  holdingDays: string;
  rationale: string;
  confirmationCondition: string;
  invalidationLevel: number;
  risksAndEvents: string;
  isFavorite?: boolean;
  isDemo?: boolean;
  qualityScore?: number;
  industry?: string;
  signalType?: T3SignalType;
  period?: T3Period;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  companyName: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weightPercent: number;
  sector: string;
}

export interface PortfolioSummary {
  totalAssets: number;
  stockValue: number;
  cash: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalReturnPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  symbol?: string;
  shares?: number;
  price?: number;
  grossAmount: number;
  fee: number;
  tax: number;
  netAmount: number;
  notes?: string;
}

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  tier: SubscriptionTier;
  validUntil: string;
  features: string[];
  avatarUrl?: string;
  googleId?: string;
  createdAt?: string;
  isLocked?: boolean;
  lockedReason?: string;
  lockedAt?: string;
  lockedBy?: string;
  phone?: string;
  lastLoginAt?: string;
}

export type OrderStatus = 'PENDING' | 'PENDING_CONFIRMATION' | 'PAID' | 'REJECTED' | 'CANCELLED';

export interface SubscriptionOrder {
  id: string; // ord_...
  orderCode: string; // STOCKAI-123456
  userId: string;
  userEmail: string;
  userName: string;
  tier: SubscriptionTier;
  amount: number;
  formattedAmount: string;
  currency: 'VND';
  status: OrderStatus;
  transferContent: string;
  createdAt: string;
  expiresAt: string; // 15 mins expiry for payment session
  customerReportedAt?: string;
  customerNote?: string;
  paymentGateway?: 'VIETQR' | 'PAY2S';
  pay2sTransactionId?: string;
  // Reconciliation fields (Admin only upon verification)
  reconciledAt?: string;
  reconciledBy?: { id: string; email: string; name: string };
  actualAmount?: number;
  bankTransactionRef?: string;
  transactionTime?: string;
  reconciliationNotes?: string;
  // Rejection fields
  rejectedAt?: string;
  rejectedBy?: { id: string; email: string };
  rejectionReason?: string;
  // QR metadata
  qrUrl?: string;
}

export interface BankConfig {
  isConfigured: boolean;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  template: string;
  webhookSecret?: string;
  pay2sMerchantId?: string;
  pay2sSecretKey?: string;
  pay2sConfigured?: boolean;
}

export type AdminActionType =
  | 'VERIFY_PAYMENT'
  | 'REJECT_PAYMENT'
  | 'MANUAL_GRANT'
  | 'REVOKE_SUBSCRIPTION'
  | 'UPDATE_BANK_CONFIG'
  | 'UPDATE_SSI_CONFIG'
  | 'TEST_SSI_CONNECTION'
  | 'SYNC_SSI_DATA'
  | 'LOCK_USER'
  | 'UNLOCK_USER'
  | 'UPDATE_PLAN_PRICE'
  | 'UPDATE_PLAN_CONFIG'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_CHANGE_PASSWORD'
  | 'SYSTEM_CONFIG_UPDATE';

export interface AdminAuditLog {
  id: string;
  action: AdminActionType;
  orderId?: string;
  orderCode?: string;
  targetUserId: string;
  targetUserEmail: string;
  performedBy: { id: string; email: string; role: string };
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface AdminOverviewKpis {
  totalOrders: number;
  pendingApproval: number;
  confirmedPaid: number;
  rejected: number;
  totalRevenue: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
}

/**
 * 7 trạng thái kết nối và đồng bộ chuẩn của SSI FastConnect Data
 */
export type ApiConnectionStatus = 
  | 'NOT_CONFIGURED'     // 1. Chưa cấu hình
  | 'CONFIGURED'         // 2. Đã cấu hình
  | 'TESTING'            // 3. Đang kiểm tra
  | 'CONNECTED'          // 4. Kết nối thành công
  | 'CONNECTION_FAILED'  // 5. Kết nối thất bại
  | 'SYNCING'            // 6. Đang đồng bộ
  | 'SYNC_ERROR'         // 7. Đồng bộ lỗi
  | 'DISCONNECTED' 
  | 'ERROR' 
  | 'NOT_SUPPORTED';

export interface SsiConfig {
  consumerId: string;
  consumerSecret?: string;
  maskedSecret?: string;
  privateKey?: string;
  hasPrivateKey?: boolean;
  hasCredentials?: boolean;
  apiUrl: string;
  streamingUrl?: string;
  isConfigured: boolean;
  status: ApiConnectionStatus;
  lastChecked?: string;
  lastSyncTime?: string;
  lastError?: string;
  lastLatencyMs?: number;
  responseTimeMs?: number;
  autoSync?: boolean;
  syncedRecordsCount?: number;
  marketDataVersion?: string;
  timeoutSeconds?: number;
  recordsSynced?: {
    indices?: number;
    quotes?: number;
    securities?: number;
    lastBatchTime?: string;
  };
}

export interface ApiProvider {
  id: string;
  name: string;
  code: 'SSI' | 'MOCK_DEMO' | 'BMSC' | 'VIETSTOCK' | 'FIINTRADE' | 'OPENAI';
  description: string;
  status: ApiConnectionStatus;
  responseTimeMs?: number;
  lastSyncTime?: string;
  lastError?: string;
  endpoint?: string;
  hasKeyConfigured: boolean;
  details?: Record<string, any>;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url?: string;
  imageUrl?: string;
  relatedSymbols?: string[];
}

export interface BacktestResult {
  strategy: string;
  timeframe: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturnPercent: number;
  avgReturnPerTradePercent: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  benchmarkReturnPercent: number;
  trades: Array<{
    id: string;
    symbol: string;
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    shares: number;
    pnl: number;
    pnlPercent: number;
    holdingDays: number;
    exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT';
  }>;
}


/**
 * ==========================================================
 * PHÂN HỆ CẢNH BÁO THỊ TRƯỜNG VÀ DÒNG TIỀN (VERSION V2)
 * ==========================================================
 */
export type MarketAlertEventType =
  | 'BREAKOUT_20'        // 1. Mua / Bứt phá đỉnh 20 phiên
  | 'FAILED_BREAKOUT'    // 2. Bứt phá thất bại (Bull trap)
  | 'TREND_WEAKENING'    // 3. Suy yếu xu hướng (MA20/MA50/RSI)
  | 'STOP_LOSS'          // 4. Cắt lỗ theo kế hoạch
  | 'TAKE_PROFIT'        // 5. Chốt lời theo mục tiêu
  | 'CONSECUTIVE_UP'     // 6. Tăng nhiều phiên liên tiếp (3, 5, 6, 8 phiên)
  | 'VOLUME_SURGE'       // 7. Khối lượng đột biến (KL/TB20 >= 1.5x)
  | 'CORPORATE_ACTION'   // 8. Sự kiện quyền doanh nghiệp
  | 'PORTFOLIO_WATCHLIST'; // 9. Cổ phiếu trong danh mục / theo dõi

export type MarketAlertStatus =
  | 'NEW'          // MỚI
  | 'WATCHING'     // ĐANG THEO DÕI
  | 'CONFIRMED'    // ĐÃ XÁC NHẬN
  | 'FAILED'       // THẤT BẠI
  | 'CLOSED';      // ĐÃ KẾT THÚC

export type MarketAlertRiskLevel = 'THẤP' | 'TRUNG BÌNH' | 'CAO';

export interface MarketAlertStatusLog {
  status: MarketAlertStatus;
  timestamp: string;
  note?: string;
  price?: number;
}

export interface MarketAlertItem {
  id: string;
  symbol: string;
  exchange: Exchange; // 'HOSE' | 'HNX' | 'UPCOM'
  eventType: MarketAlertEventType;
  tradingSession: string; // YYYY-MM-DD
  detectedAt: string; // ISO string hoặc YYYY-MM-DD HH:mm:ss
  alertPrice: number; // Giá tại thời điểm cảnh báo ban đầu (BẢO LƯU, KHÔNG GHI ĐÈ)
  currentPrice: number; // Giá hiện tại hoặc giá đóng cửa mới nhất
  priceChangeFromAlertPercent: number; // % thay đổi từ giá cảnh báo
  volumeRatio: number; // KL/TB20 (ví dụ: 2.25)
  indicatorValues: {
    rsi?: number;
    ma20?: number;
    ma50?: number;
    breakoutPeak20?: number;
    streakDays?: number;
    intradayOnly?: boolean;
    targetPrice?: number;
    stopLossPrice?: number;
    confirmedAtClose?: boolean;
    referenceVolume20?: number;
    currentVolume?: number;
    [key: string]: any;
  };
  dataSource: string; // 'SSI FastConnect' | 'STOCKAI_DEMO_SIMULATION'
  dataMode: 'REALTIME' | 'INTRADAY_DELAYED' | 'EOD' | 'DEMO';
  ruleVersion: string; // 'v2.0'
  status: MarketAlertStatus;
  riskLevel: MarketAlertRiskLevel;
  title: string;
  description: string;
  cautionNote?: string;
  statusLogs: MarketAlertStatusLog[];
  updatedAt: string;
  notes?: string;
}

export interface MarketOverviewData {
  indexCode: string; // VNINDEX
  indexName: string; // VN-Index
  currentValue: number;
  changeValue: number;
  changePercent: number;
  marketStatus: 'TĂNG' | 'GIẢM' | 'ĐI NGANG';
  indexMa20: number;
  indexMa50: number;
  indexAboveMa20: boolean;
  indexAboveMa50: boolean;
  ma20AboveMa50: boolean;
  stocksAboveMa20Percent: number; // % cổ phiếu > MA20
  stocksAboveMa50Percent: number; // % cổ phiếu > MA50
  advances: number; // Mã tăng
  declines: number; // Mã giảm
  noChanges: number; // Mã đứng giá
  ceilings: number; // Mã kịch trần
  floors: number; // Mã kịch sàn
  breakoutRatioPercent: number; // Tỷ lệ cổ phiếu bứt phá
  failedBreakoutRatioPercent: number; // Tỷ lệ bứt phá thất bại
  weakeningRatioPercent: number; // Tỷ lệ cổ phiếu suy yếu
  marketRiskLevel: MarketAlertRiskLevel; // THẤP | TRUNG BÌNH | CAO
  portfolioAllocationReference: {
    stockPercent: number; // % Cổ phiếu tham khảo
    cashPercent: number; // % Tiền mặt tham khảo
    recommendationText: string;
    disclaimer: string;
  };
  lastUpdated: string;
  dataMode: 'REALTIME' | 'INTRADAY_DELAYED' | 'EOD' | 'DEMO';
  dataSource: string;
}

export interface MarketAlertFilterCounts {
  all: number;
  breakout: number;
  failed_breakout: number;
  weakening: number;
  stop_loss: number;
  take_profit: number;
  consecutive_up: number;
  volume_surge: number;
  corporate_action: number;
  watchlist: number;
}

export interface StockAlert {
  id: string;
  symbol: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'VOLUME_SPIKE';
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  notes?: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN';
  passwordHash: string; // scrypt salt:hash
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}
