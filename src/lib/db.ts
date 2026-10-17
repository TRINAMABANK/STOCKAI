import fs from 'fs';
import path from 'path';
import { 
  T3Signal, 
  PortfolioItem, 
  PortfolioSummary, 
  Transaction, 
  ApiProvider, 
  NewsItem, 
  MarketIndex, 
  StockQuote,
  StockAlert,
  BacktestResult
} from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'stockai_db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export interface DatabaseSchema {
  instruments: StockQuote[];
  market_prices: StockQuote[];
  historical_prices: Record<string, Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>>;
  financial_statements: Record<string, { eps: number; pe: number; pb: number; roe: number; revenueGrowth: number; profitGrowth: number }>;
  corporate_events: Array<{ symbol: string; date: string; event: string; content: string }>;
  portfolios: PortfolioSummary;
  holdings: PortfolioItem[];
  transactions: Transaction[];
  cash_movements: Array<{ id: string; date: string; type: 'DEPOSIT' | 'WITHDRAW'; amount: number; balance: number; note: string }>;
  holdings_snapshots: Array<{ date: string; totalAssets: number; stockValue: number; cash: number; pnl: number }>;
  watchlists: Array<{ id: string; name: string; symbols: string[] }>;
  alerts: StockAlert[];
  analysis_reports: Array<{ id: string; symbol: string; date: string; score: number; summary: string }>;
  api_providers: ApiProvider[];
  api_sync_logs: Array<{ id: string; timestamp: string; provider: string; action: string; status: 'SUCCESS' | 'ERROR'; message: string; latencyMs?: number }>;
  app_settings: {
    theme: string;
    defaultFeeRate: number;
    defaultTaxRate: number;
    openAiApiKey?: string;
    openAiModel: string;
    marketDataProvider: string;
    lastBackupTime?: string;
  };
  t3_signals: T3Signal[];
  news: NewsItem[];
  market_indices: MarketIndex[];
}

// Dữ liệu hạt giống (Seed Data) chuẩn xác theo hình ảnh thiết kế GIAO DIEN.png
const DEFAULT_DATABASE: DatabaseSchema = {
  portfolios: {
    totalAssets: 1268450000,
    stockValue: 985320000,
    cash: 283130000,
    realizedPnL: 48320000,
    unrealizedPnL: 64200000,
    totalReturnPercent: 8.92,
    dailyChange: 35620000,
    dailyChangePercent: 2.89,
  },
  holdings: [
    {
      id: 'h-1',
      symbol: 'FPT',
      companyName: 'CTCP FPT',
      shares: 2500,
      costBasis: 122000,
      currentPrice: 135600,
      marketValue: 339000000,
      unrealizedPnL: 34000000,
      unrealizedPnLPercent: 11.15,
      weightPercent: 32.5,
      sector: 'Công nghệ',
    },
    {
      id: 'h-2',
      symbol: 'TCB',
      companyName: 'Ngân hàng Techcombank',
      shares: 7500,
      costBasis: 30500,
      currentPrice: 33100,
      marketValue: 248250000,
      unrealizedPnL: 19500000,
      unrealizedPnLPercent: 8.52,
      weightPercent: 24.8,
      sector: 'Ngân hàng',
    },
    {
      id: 'h-3',
      symbol: 'HPG',
      companyName: 'Tập đoàn Hòa Phát',
      shares: 5500,
      costBasis: 26000,
      currentPrice: 27800,
      marketValue: 152900000,
      unrealizedPnL: 9900000,
      unrealizedPnLPercent: 6.92,
      weightPercent: 15.2,
      sector: 'Thép',
    },
    {
      id: 'h-4',
      symbol: 'VNM',
      companyName: 'CTCP Sữa Việt Nam',
      shares: 1800,
      costBasis: 65000,
      currentPrice: 68500,
      marketValue: 123300000,
      unrealizedPnL: 6300000,
      unrealizedPnLPercent: 5.38,
      weightPercent: 12.6,
      sector: 'Bất động sản', // phân loại theo tỷ trọng hiển thị
    },
    {
      id: 'h-5',
      symbol: 'SSI',
      companyName: 'CTCP Chứng khoán SSI',
      shares: 3400,
      costBasis: 23200,
      currentPrice: 24600,
      marketValue: 83640000,
      unrealizedPnL: 4760000,
      unrealizedPnLPercent: 6.03,
      weightPercent: 8.3,
      sector: 'Chứng khoán',
    },
    {
      id: 'h-6',
      symbol: 'MWG',
      companyName: 'Thế Giới Di Động',
      shares: 614,
      costBasis: 59500,
      currentPrice: 62300,
      marketValue: 38230000,
      unrealizedPnL: 1719200,
      unrealizedPnLPercent: 4.71,
      weightPercent: 6.6,
      sector: 'Khác',
    },
  ],
  transactions: [
    {
      id: 'tx-001',
      date: '2025-03-20',
      type: 'BUY',
      symbol: 'FPT',
      shares: 1000,
      price: 125000,
      grossAmount: 125000000,
      fee: 187500,
      tax: 0,
      netAmount: 125187500,
      notes: 'Mua tích lũy theo chiến lược Momentum T+3',
    },
    {
      id: 'tx-002',
      date: '2025-03-22',
      type: 'SELL',
      symbol: 'DGC',
      shares: 500,
      price: 120000,
      grossAmount: 60000000,
      fee: 90000,
      tax: 60000,
      netAmount: 59850000,
      notes: 'Chốt lời mục tiêu 1, lợi nhuận +8.5%',
    },
    {
      id: 'tx-003',
      date: '2025-03-24',
      type: 'BUY',
      symbol: 'TCB',
      shares: 2500,
      price: 31000,
      grossAmount: 77500000,
      fee: 116250,
      tax: 0,
      netAmount: 77616250,
      notes: 'Bắt nhịp Pullback MA20',
    },
  ],
  cash_movements: [
    { id: 'cm-1', date: '2025-01-10', type: 'DEPOSIT', amount: 300000000, balance: 300000000, note: 'Nộp tiền vào tài khoản BMSC' },
    { id: 'cm-2', date: '2025-02-15', type: 'DEPOSIT', amount: 50000000, balance: 283130000, note: 'Nộp bổ sung ký quỹ' },
  ],
  holdings_snapshots: [
    { date: '2025-03-01', totalAssets: 1180000000, stockValue: 890000000, cash: 290000000, pnl: 12500000 },
    { date: '2025-03-05', totalAssets: 1195000000, stockValue: 910000000, cash: 285000000, pnl: 18200000 },
    { date: '2025-03-10', totalAssets: 1215000000, stockValue: 935000000, cash: 280000000, pnl: 24600000 },
    { date: '2025-03-15', totalAssets: 1230000000, stockValue: 950000000, cash: 280000000, pnl: 28400000 },
    { date: '2025-03-20', totalAssets: 1245000000, stockValue: 965000000, cash: 280000000, pnl: 31200000 },
    { date: '2025-03-26', totalAssets: 1268450000, stockValue: 985320000, cash: 283130000, pnl: 35620000 },
  ],
  market_indices: [
    { symbol: 'VNINDEX', name: 'VN-Index', value: 1286.24, change: 12.34, changePercent: 0.97, history: [1270, 1272, 1276, 1280, 1286.24] },
    { symbol: 'VN30', name: 'VN30-Index', value: 1337.56, change: 15.62, changePercent: 1.18, history: [1320, 1324, 1328, 1333, 1337.56] },
    { symbol: 'HNXINDEX', name: 'HNX-Index', value: 239.15, change: 2.21, changePercent: 0.93, history: [236, 237, 237.8, 238.4, 239.15] },
    { symbol: 'UPCOMINDEX', name: 'UPCoM-Index', value: 91.32, change: 0.46, changePercent: 0.51, history: [90.5, 90.8, 91.0, 91.1, 91.32] },
  ],
  t3_signals: [
    {
      id: 't3-hpg',
      symbol: 'HPG',
      companyName: 'Tập đoàn Hòa Phát',
      exchange: 'HOSE',
      currentPrice: 27800,
      dataTimestamp: '14:35:22',
      t3Score: 85,
      strategy: 'Breakout',
      buyZone: '27.4 - 27.8',
      targetPrice: '29.5 / 30.2',
      stopLoss: 26.8,
      rewardRiskRatio: 2.4,
      riskLevel: 'Thấp',
      liquidity: 'Rất cao (>25 triệu cp/phiên)',
      holdingDays: '1 - 5 phiên',
      rationale: 'Khối lượng bùng nổ vượt 180% MA20 volume, giá phá vỡ nền kháng cự 27.5 với nến Marubozu tăng mạnh.',
      confirmationCondition: 'Đóng nến trên 27.6 với thanh khoản duy trì cao',
      invalidationLevel: 26.8,
      risksAndEvents: 'Biến động giá quặng sắt thế giới, áp lực chốt lời nhóm thép tại vùng 30.0',
      isFavorite: true,
    },
    {
      id: 't3-tcb',
      symbol: 'TCB',
      companyName: 'Ngân hàng Techcombank',
      exchange: 'HOSE',
      currentPrice: 33100,
      dataTimestamp: '14:35:22',
      t3Score: 82,
      strategy: 'Pullback',
      buyZone: '32.5 - 33.0',
      targetPrice: '35.0 / 36.0',
      stopLoss: 31.8,
      rewardRiskRatio: 2.1,
      riskLevel: 'Trung bình',
      liquidity: 'Cao (>12 triệu cp/phiên)',
      holdingDays: '2 - 4 phiên',
      rationale: 'Test thành công đường EMA20 sau nhịp tăng trước đó, xuất hiện nến Hammer rút chân vùng hỗ trợ 32.5.',
      confirmationCondition: 'Mở cửa phiên kế tiếp giữ vững trên mốc 32.8',
      invalidationLevel: 31.8,
      risksAndEvents: 'Động thái lãi suất liên ngân hàng, tỷ giá USD/VND',
      isFavorite: true,
    },
    {
      id: 't3-fpt',
      symbol: 'FPT',
      companyName: 'CTCP FPT',
      exchange: 'HOSE',
      currentPrice: 135600,
      dataTimestamp: '14:35:22',
      t3Score: 78,
      strategy: 'Momentum',
      buyZone: '133.0 - 136.0',
      targetPrice: '141.0 / 146.0',
      stopLoss: 131.0,
      rewardRiskRatio: 2.3,
      riskLevel: 'Trung bình',
      liquidity: 'Trung bình (3 - 5 triệu cp/phiên)',
      holdingDays: '3 - 5 phiên',
      rationale: 'RSI(14) đạt 64 dốc lên, MACD Histogram mở rộng dương, dòng tiền nước ngoài mua ròng 5 phiên liên tục.',
      confirmationCondition: 'Khối lượng phiên sáng đạt tối thiểu 1.5 triệu đơn vị',
      invalidationLevel: 131.0,
      risksAndEvents: 'Định giá P/E vùng cao lịch sử (24x), áp lực bán từ quỹ cơ cấu',
      isFavorite: false,
    },
    {
      id: 't3-dgc',
      symbol: 'DGC',
      companyName: 'Hóa chất Đức Giang',
      exchange: 'HOSE',
      currentPrice: 118000,
      dataTimestamp: '14:35:22',
      t3Score: 75,
      strategy: 'Reversal',
      buyZone: '115.0 - 118.0',
      targetPrice: '123.0 / 127.0',
      stopLoss: 112.0,
      rewardRiskRatio: 1.8,
      riskLevel: 'Cao',
      liquidity: 'Trung bình (2 - 4 triệu cp/phiên)',
      holdingDays: '2 - 5 phiên',
      rationale: 'Phân kỳ dương kép RSI tại vùng hỗ trợ đáy cũ 115.0, lực cầu bắt đáy xuất hiện với nến xanh bao phủ.',
      confirmationCondition: 'Vượt dứt khoát 119.0 với dòng tiền lớn',
      invalidationLevel: 112.0,
      risksAndEvents: 'Giá Phốt pho vàng thế giới giảm nhẹ, biến động thị trường bán dẫn',
      isFavorite: false,
    },
    {
      id: 't3-gvr',
      symbol: 'GVR',
      companyName: 'Tập đoàn Cao su Việt Nam',
      exchange: 'HOSE',
      currentPrice: 34600,
      dataTimestamp: '14:35:22',
      t3Score: 72,
      strategy: 'Pullback',
      buyZone: '33.8 - 34.8',
      targetPrice: '37.0 / 38.5',
      stopLoss: 32.5,
      rewardRiskRatio: 1.9,
      riskLevel: 'Thấp',
      liquidity: 'Cao (>8 triệu cp/phiên)',
      holdingDays: '3 - 5 phiên',
      rationale: 'Tích lũy cạn kiệt khối lượng trên vùng hỗ trợ MA50, xuất hiện lực cầu gom chủ động phiên chiều.',
      confirmationCondition: 'Khối lượng giao dịch vượt trung bình 10 phiên',
      invalidationLevel: 32.5,
      risksAndEvents: 'Tiến độ chuyển đổi đất khu công nghiệp và chính sách giá đất',
      isFavorite: false,
    },
  ],
  news: [
    {
      id: 'news-1',
      title: 'VN-Index tăng gần 13 điểm, dòng tiền quay lại nhóm ngân hàng',
      source: 'Cafef',
      timeAgo: '2 giờ trước',
      imageUrl: '/images/news1.jpg',
      relatedSymbols: ['TCB', 'MBB', 'VCB'],
    },
    {
      id: 'news-2',
      title: 'FPT công bố kết quả kinh doanh Quý 1/2025 với mức tăng trưởng ấn tượng',
      source: 'VnExpress',
      timeAgo: '3 giờ trước',
      imageUrl: '/images/news2.jpg',
      relatedSymbols: ['FPT'],
    },
    {
      id: 'news-3',
      title: 'Giá dầu giảm mạnh, tác động đến nhóm cổ phiếu dầu khí',
      source: 'Vietstock',
      timeAgo: '5 giờ trước',
      imageUrl: '/images/news3.jpg',
      relatedSymbols: ['PVD', 'PVS', 'BSR'],
    },
  ],
  api_providers: [
    {
      id: 'api-bmsc',
      name: 'Bảo Minh Securities (BMSC)',
      code: 'BMSC',
      description: 'Chưa có Open API công khai từ BMSC — Hỗ trợ nhập sao kê định dạng CSV/Excel',
      status: 'DISCONNECTED',
      responseTimeMs: undefined,
      lastSyncTime: 'Chưa đồng bộ tự động',
      lastError: 'BMSC chưa cung cấp Open API chính thức cho cá nhân',
      hasKeyConfigured: false,
    },
    {
      id: 'api-vietstock',
      name: 'Dữ liệu thị trường (Vietstock)',
      code: 'VIETSTOCK',
      description: 'Dữ liệu giá khớp lệnh, chỉ số VN-Index, HNX, UPCoM thời gian thực',
      status: 'CONNECTED',
      responseTimeMs: 42,
      lastSyncTime: 'Vừa xong',
      hasKeyConfigured: true,
    },
    {
      id: 'api-fiintrade',
      name: 'Dữ liệu doanh nghiệp (FiinTrade)',
      code: 'FIINTRADE',
      description: 'Báo cáo tài chính, chỉ số P/E, P/B, ROE, EPS và sự kiện doanh nghiệp',
      status: 'CONNECTED',
      responseTimeMs: 58,
      lastSyncTime: 'Vừa xong',
      hasKeyConfigured: true,
    },
    {
      id: 'api-openai',
      name: 'OpenAI API',
      code: 'OPENAI',
      description: 'Mô hình ngôn ngữ GPT-4o phân tích cơ bản, kỹ thuật và giải thích T+3',
      status: 'CONNECTED',
      responseTimeMs: 310,
      lastSyncTime: 'Vừa xong',
      hasKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
  ],
  api_sync_logs: [
    { id: 'log-1', timestamp: '2025-03-26 14:35:22', provider: 'VIETSTOCK', action: 'SYNC_QUOTES', status: 'SUCCESS', message: 'Đồng bộ 420 mã HOSE/HNX thành công', latencyMs: 42 },
    { id: 'log-2', timestamp: '2025-03-26 14:35:22', provider: 'FIINTRADE', action: 'SYNC_FINANCIALS', status: 'SUCCESS', message: 'Cập nhật báo cáo tài chính Q1', latencyMs: 58 },
  ],
  watchlists: [
    { id: 'wl-1', name: 'VN30 Tiềm năng', symbols: ['FPT', 'TCB', 'HPG', 'VNM', 'MWG', 'SSI', 'MBB', 'VPB'] },
    { id: 'wl-2', name: 'Cổ phiếu T+3 theo dõi', symbols: ['HPG', 'TCB', 'FPT', 'DGC', 'GVR'] },
  ],
  alerts: [
    { id: 'alt-1', symbol: 'HPG', condition: 'PRICE_ABOVE', targetValue: 28000, isActive: true, createdAt: '2025-03-25' },
    { id: 'alt-2', symbol: 'FPT', condition: 'PRICE_ABOVE', targetValue: 140000, isActive: true, createdAt: '2025-03-24' },
  ],
  analysis_reports: [],
  corporate_events: [
    { symbol: 'HPG', date: '2025-04-15', event: 'Đại hội đồng Cổ đông', content: 'Họp ĐHĐCĐ thường niên năm 2025' },
    { symbol: 'FPT', date: '2025-05-10', event: 'Cổ tức tiền mặt', content: 'Chi trả cổ tức đợt 2/2024 tỷ lệ 15%' },
  ],
  financial_statements: {
    FPT: { eps: 5200, pe: 26.0, pb: 5.8, roe: 28.5, revenueGrowth: 21.2, profitGrowth: 22.8 },
    TCB: { eps: 3850, pe: 8.6, pb: 1.2, roe: 16.4, revenueGrowth: 18.5, profitGrowth: 25.1 },
    HPG: { eps: 2100, pe: 13.2, pb: 1.6, roe: 12.8, revenueGrowth: 14.2, profitGrowth: 38.6 },
    VNM: { eps: 4200, pe: 16.3, pb: 3.9, roe: 24.1, revenueGrowth: 5.2, profitGrowth: 6.8 },
    MWG: { eps: 2400, pe: 25.9, pb: 2.8, roe: 11.5, revenueGrowth: 12.4, profitGrowth: 64.2 },
  },
  historical_prices: {},
  instruments: [],
  market_prices: [],
  app_settings: {
    theme: 'dark-navy',
    defaultFeeRate: 0.0015,
    defaultTaxRate: 0.0010,
    openAiModel: 'gpt-4o',
    marketDataProvider: 'vietstock',
  },
};

/**
 * Khởi tạo và đọc Database từ đĩa cứng
 */
export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(DEFAULT_DATABASE);
    return DEFAULT_DATABASE;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATABASE, ...parsed };
  } catch (error) {
    console.error('Lỗi khi đọc file database, dùng dữ liệu mặc định:', error);
    return DEFAULT_DATABASE;
  }
}

/**
 * Lưu dữ liệu an toàn (Atomic Write để chống hỏng file khi mất điện/restart)
 */
export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

/**
 * Tạo bản sao lưu Snapshot (Backup)
 */
export function createBackup(): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const db = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `stockai_backup_${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf-8');
  
  // Cập nhật log sao lưu
  db.app_settings.lastBackupTime = new Date().toLocaleString('vi-VN');
  saveDatabase(db);

  return backupFileName;
}

/**
 * Khôi phục Database từ dữ liệu sao lưu
 */
export function restoreBackup(jsonData: string): boolean {
  try {
    const parsed = JSON.parse(jsonData);
    if (!parsed.portfolios || !parsed.holdings) {
      throw new Error('Dữ liệu sao lưu không đúng định dạng StockAI Database');
    }
    saveDatabase(parsed);
    return true;
  } catch (err) {
    console.error('Lỗi khôi phục sao lưu:', err);
    return false;
  }
}
