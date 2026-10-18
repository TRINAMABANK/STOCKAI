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

export interface T3Signal {
  id: string;
  symbol: string;
  companyName: string;
  exchange: Exchange;
  currentPrice: number;
  dataTimestamp: string;
  t3Score: number;
  strategy: T3Strategy;
  buyZone: string;
  targetPrice: string;
  stopLoss: number;
  rewardRiskRatio: number;
  riskLevel: RiskLevel;
  liquidity: string;
  holdingDays: string;
  rationale: string;
  confirmationCondition: string;
  invalidationLevel: number;
  risksAndEvents: string;
  isFavorite?: boolean;
  isDemo?: boolean;
  qualityScore?: number;
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
