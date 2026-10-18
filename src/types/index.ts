export type Exchange = 'HOSE' | 'HNX' | 'UPCOM';

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
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
}

export interface AdminAuditLog {
  id: string;
  action: 'VERIFY_PAYMENT' | 'REJECT_PAYMENT' | 'MANUAL_GRANT' | 'REVOKE_SUBSCRIPTION' | 'UPDATE_BANK_CONFIG';
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

export type ApiConnectionStatus = 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'ERROR' 
  | 'TESTING' 
  | 'NOT_CONFIGURED' 
  | 'NOT_SUPPORTED';

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
