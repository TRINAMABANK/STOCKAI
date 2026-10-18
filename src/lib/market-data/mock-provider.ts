import { Exchange } from '@/types';
import { 
  IMarketDataProvider, 
  NormalizedSecurity, 
  NormalizedOhlcv, 
  NormalizedQuote, 
  NormalizedIndex, 
  ProviderHealthStatus 
} from './types';
import { normalizeDate } from './normalizer';

/**
 * Mock Market Data Provider (Chế độ mô phỏng DEMO)
 * 
 * Mục đích:
 * - Cho phép phát triển, kiểm thử giao diện và thuật toán khi người dùng chưa có API Key SSI
 * - GẮN NHÃN DEMO 100% TRÊN MỌI BẢN GHI
 * - TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU NÀY ĐỂ PHÁT TÍN HIỆU GIAO DỊCH THẬT
 */
export class MockMarketDataProvider implements IMarketDataProvider {
  readonly code = 'MOCK_DEMO';
  readonly name = 'StockAI Demo Simulation';
  readonly description = 'Dữ liệu mô phỏng thị trường Việt Nam (HOSE/HNX/UPCoM) phục vụ thử nghiệm và kiểm định tính năng';

  async testConnection(): Promise<ProviderHealthStatus> {
    return {
      providerCode: this.code,
      providerName: this.name,
      status: 'CONNECTED',
      latencyMs: 15,
      lastChecked: new Date().toISOString(),
      hasCredentials: true,
      endpoint: 'local://mock-simulation-engine',
      supportedMarkets: ['HOSE', 'HNX', 'UPCOM'],
      dataModes: ['DEMO'],
    };
  }

  async getSecurities(market?: Exchange): Promise<NormalizedSecurity[]> {
    const all: NormalizedSecurity[] = [
      { symbol: 'FPT', name: 'CTCP FPT', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 1270000000 },
      { symbol: 'TCB', name: 'Ngân hàng Techcombank', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 3522000000 },
      { symbol: 'HPG', name: 'Tập đoàn Hòa Phát', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 5814000000 },
      { symbol: 'VNM', name: 'CTCP Sữa Việt Nam', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 2089000000 },
      { symbol: 'MWG', name: 'CTCP Đầu tư Thế Giới Di Động', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 1463000000 },
      { symbol: 'NVL', name: 'CTCP Tập đoàn Đầu tư Địa ốc No Va', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 1950000000 },
      { symbol: 'PDR', name: 'CTCP Phát triển Bất động sản Phát Đạt', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 873000000 },
      { symbol: 'DXG', name: 'CTCP Tập đoàn Đất Xanh', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 720000000 },
      { symbol: 'SSI', name: 'CTCP Chứng khoán SSI', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 1501000000 },
      { symbol: 'VCG', name: 'Tổng CTCP XNK & Xây dựng VN', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 534000000 },
      { symbol: 'DGC', name: 'Tập đoàn Hóa chất Đức Giang', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 379000000 },
      { symbol: 'GVR', name: 'Tập đoàn Cao su Việt Nam', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 4000000000 },
      { symbol: 'MBB', name: 'Ngân hàng Quân Đội', market: 'HOSE', secType: 'STOCK', lotSize: 100, listedShares: 5214000000 },
      { symbol: 'SHS', name: 'Chứng khoán Sài Gòn Hà Nội', market: 'HNX', secType: 'STOCK', lotSize: 100, listedShares: 813000000 },
      { symbol: 'BSR', name: 'Lọc hóa dầu Bình Sơn', market: 'UPCOM', secType: 'STOCK', lotSize: 100, listedShares: 3100000000 },
    ];

    if (market) {
      return all.filter(s => s.market === market);
    }
    return all;
  }

  async getDailyOhlcv(
    symbol: string,
    fromDate: string,
    toDate: string,
    pageIndex: number = 1,
    pageSize: number = 100
  ): Promise<NormalizedOhlcv[]> {
    const sym = symbol.toUpperCase();
    const basePrices: Record<string, number> = {
      FPT: 135600,
      TCB: 33100,
      HPG: 27800,
      VNM: 68500,
      MWG: 62300,
      NVL: 10450,
      PDR: 21800,
      DXG: 16250,
      SSI: 24600,
      VCG: 18200,
      DGC: 118000,
      GVR: 34600,
      MBB: 24200,
      SHS: 14800,
      BSR: 22400,
    };

    const currentPrice = basePrices[sym] || 30000;
    const bars: NormalizedOhlcv[] = [];
    const numBars = 35; // 35 phiên lịch sử đủ để tính MA20, MA50, RSI

    let rollingPrice = currentPrice * 0.88;
    const now = new Date();

    for (let i = numBars; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 1.4); // tính ngày xấp xỉ

      // Bỏ qua thứ 7 và CN
      if (d.getDay() === 0) d.setDate(d.getDate() - 2);
      if (d.getDay() === 6) d.setDate(d.getDate() - 1);

      const changePct = ((i * 17) % 7 - 3) * 0.008; // dao động giả lập nhẹ
      rollingPrice = Math.round(rollingPrice * (1 + changePct));

      const open = Math.round(rollingPrice * 0.995);
      const close = rollingPrice;
      const high = Math.round(Math.max(open, close) * 1.012);
      const low = Math.round(Math.min(open, close) * 0.988);
      const volume = Math.round(3000000 + ((i * 37) % 50) * 150000);

      bars.push({
        symbol: sym,
        date: normalizeDate(d),
        open,
        high,
        low,
        close,
        volume,
        value: close * volume,
        dataMode: 'DEMO',
        source: 'STOCKAI_DEMO_SIMULATION',
      });
    }

    return bars;
  }

  async getIntradayOhlcv(symbol: string): Promise<NormalizedOhlcv[]> {
    return this.getDailyOhlcv(symbol, '', '');
  }

  async getStockQuote(symbol: string): Promise<NormalizedQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes[0] || null;
  }

  async getQuotes(symbols?: string[], market?: Exchange): Promise<NormalizedQuote[]> {
    const sampleQuotes: NormalizedQuote[] = [
      {
        symbol: 'FPT', companyName: 'CTCP FPT', market: 'HOSE',
        refPrice: 131000, ceilingPrice: 140100, floorPrice: 121900,
        openPrice: 131500, highPrice: 136000, lowPrice: 131200, closePrice: 135600,
        priceChange: 4600, changePercent: 3.51, matchVolume: 4850000, matchValue: 652000000000,
        foreignBuyVol: 1200000, foreignSellVol: 450000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'TCB', companyName: 'Ngân hàng Techcombank', market: 'HOSE',
        refPrice: 32400, ceilingPrice: 34650, floorPrice: 30150,
        openPrice: 32500, highPrice: 33300, lowPrice: 32400, closePrice: 33100,
        priceChange: 700, changePercent: 2.16, matchVolume: 14200000, matchValue: 468000000000,
        foreignBuyVol: 2800000, foreignSellVol: 900000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'HPG', companyName: 'Tập đoàn Hòa Phát', market: 'HOSE',
        refPrice: 27300, ceilingPrice: 29200, floorPrice: 25400,
        openPrice: 27300, highPrice: 28000, lowPrice: 27250, closePrice: 27800,
        priceChange: 500, changePercent: 1.83, matchVolume: 28500000, matchValue: 790000000000,
        foreignBuyVol: 4500000, foreignSellVol: 2100000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'VNM', companyName: 'CTCP Sữa Việt Nam', market: 'HOSE',
        refPrice: 66500, ceilingPrice: 71100, floorPrice: 61900,
        openPrice: 66800, highPrice: 68800, lowPrice: 66500, closePrice: 68500,
        priceChange: 2000, changePercent: 3.01, matchVolume: 3200000, matchValue: 218000000000,
        foreignBuyVol: 950000, foreignSellVol: 300000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'MWG', companyName: 'CTCP Đầu tư Thế Giới Di Động', market: 'HOSE',
        refPrice: 61100, ceilingPrice: 65300, floorPrice: 56900,
        openPrice: 61200, highPrice: 62600, lowPrice: 61100, closePrice: 62300,
        priceChange: 1200, changePercent: 1.97, matchVolume: 6100000, matchValue: 379000000000,
        foreignBuyVol: 1800000, foreignSellVol: 650000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'NVL', companyName: 'CTCP Tập đoàn Địa ốc No Va', market: 'HOSE',
        refPrice: 10900, ceilingPrice: 11650, floorPrice: 10150,
        openPrice: 10900, highPrice: 10950, lowPrice: 10400, closePrice: 10450,
        priceChange: -450, changePercent: -4.13, matchVolume: 18500000, matchValue: 196000000000,
        foreignBuyVol: 250000, foreignSellVol: 1800000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'SHS', companyName: 'Chứng khoán Sài Gòn Hà Nội', market: 'HNX',
        refPrice: 14500, ceilingPrice: 15900, floorPrice: 13100,
        openPrice: 14500, highPrice: 15000, lowPrice: 14400, closePrice: 14800,
        priceChange: 300, changePercent: 2.07, matchVolume: 12500000, matchValue: 185000000000,
        foreignBuyVol: 600000, foreignSellVol: 200000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
      {
        symbol: 'BSR', companyName: 'Lọc hóa dầu Bình Sơn', market: 'UPCOM',
        refPrice: 22600, ceilingPrice: 25900, floorPrice: 19300,
        openPrice: 22600, highPrice: 22700, lowPrice: 22300, closePrice: 22400,
        priceChange: -200, changePercent: -0.88, matchVolume: 6400000, matchValue: 144000000000,
        foreignBuyVol: 400000, foreignSellVol: 550000,
        updatedTime: '15:00:00', dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
        isDemo: true, isValid: true, isStale: false, qualityScore: 100,
      },
    ];

    let result = sampleQuotes;
    if (market) {
      result = result.filter(q => q.market === market);
    }
    if (symbols && symbols.length > 0) {
      const set = new Set(symbols.map(s => s.toUpperCase()));
      result = result.filter(q => set.has(q.symbol));
    }
    return result;
  }

  async getMarketIndices(): Promise<NormalizedIndex[]> {
    return [
      {
        code: 'VNINDEX', name: 'VN-Index', exchange: 'HOSE',
        value: 1286.24, change: 12.45, changePercent: 0.98,
        totalVolume: 845000000, totalValue: 21350000000000,
        advances: 268, declines: 142, noChanges: 65, ceilings: 14, floors: 2,
        tradingSession: 'CLOSED', updatedTime: '15:00:00',
        dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
      },
      {
        code: 'VN30', name: 'VN30-Index', exchange: 'HOSE',
        value: 1342.10, change: 14.80, changePercent: 1.11,
        totalVolume: 310000000, totalValue: 11200000000000,
        advances: 22, declines: 6, noChanges: 2, ceilings: 2, floors: 0,
        tradingSession: 'CLOSED', updatedTime: '15:00:00',
        dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
      },
      {
        code: 'HNXINDEX', name: 'HNX-Index', exchange: 'HNX',
        value: 238.50, change: 1.62, changePercent: 0.68,
        totalVolume: 92000000, totalValue: 1850000000000,
        advances: 95, declines: 71, noChanges: 48, ceilings: 6, floors: 1,
        tradingSession: 'CLOSED', updatedTime: '15:00:00',
        dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
      },
      {
        code: 'UPCOMINDEX', name: 'UPCoM-Index', exchange: 'UPCOM',
        value: 94.20, change: 0.35, changePercent: 0.37,
        totalVolume: 48000000, totalValue: 720000000000,
        advances: 145, declines: 110, noChanges: 82, ceilings: 8, floors: 3,
        tradingSession: 'CLOSED', updatedTime: '15:00:00',
        dataMode: 'DEMO', source: 'STOCKAI_DEMO_SIMULATION',
      },
    ];
  }
}
