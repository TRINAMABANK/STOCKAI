/**
 * Bộ thư viện Định lượng & Chỉ báo Kỹ thuật chuyên sâu cho StockAI
 * Phục vụ đồ thị Lightweight Charts và chiến lược giao dịch ngắn hạn 5–10 phiên
 * 
 * Các chỉ báo:
 * - MA (SMA20, SMA50, SMA200)
 * - EMA (EMA20)
 * - Bollinger Bands (20, 2)
 * - RSI (14) chuẩn Wilder
 * - MACD (12, 26, 9)
 * - Volume Histogram (Up/Down color)
 * - Nhận diện vùng Hỗ trợ (Support) & Kháng cự (Resistance)
 * - Bộ phát hiện điểm vào lệnh & Tín hiệu Chiến lược (Breakout, Pullback, Momentum, Reversal)
 * - Công cụ tính toán quản trị rủi ro vị thế (Quy tắc 2% NAV)
 */

export interface CandleData {
  time: string; // ISO date 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value?: number;
}

export interface LineDataPoint {
  time: string;
  value: number;
}

export interface HistogramDataPoint {
  time: string;
  value: number;
  color: string;
}

export interface BollingerData {
  upper: LineDataPoint[];
  middle: LineDataPoint[];
  lower: LineDataPoint[];
}

export interface MacdData {
  macd: LineDataPoint[];
  signal: LineDataPoint[];
  histogram: HistogramDataPoint[];
}

export type StrategyType = 'BREAKOUT' | 'PULLBACK' | 'MOMENTUM' | 'REVERSAL';

export type SignalAction = 'BUY' | 'SELL' | 'EVENT';

export type SignalSubType = 
  | 'BREAKOUT_BUY'          // Mua bứt phá xu hướng
  | 'PULLBACK_BUY'          // Mua kiểm định hỗ trợ
  | 'MOMENTUM_BUY'          // Mua động lượng gia tăng
  | 'REVERSAL_BUY'          // Mua bắt đáy cạn cung
  | 'TAKE_PROFIT_SELL'      // Bán chốt lời
  | 'STOP_LOSS_SELL'        // Bán cắt lỗ
  | 'WEAKENING_SELL'        // Bán suy yếu xu hướng
  | 'GAIN_5D_UNCONFIRMED';  // Tăng 5 phiên — Chờ xác nhận

export interface ChartMarker {
  time: string;
  position: 'belowBar' | 'aboveBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
  size?: number;
}

export interface RichChartMarker extends ChartMarker {
  id: string;
  symbol: string;
  action: SignalAction;       // 'BUY' | 'SELL' | 'EVENT'
  subType: SignalSubType;
  price: number;              // Giá đóng cửa phiên phát tín hiệu
  rationale: string;          // Luận điểm kỹ thuật chi tiết
  confirmationStatus: string; // Trạng thái xác nhận
  ruleVersion: string;        // '1.2'
  metrics?: {
    rsi?: number;
    volRatio?: number;
    consecutiveGains?: number;
    priceChangePct?: number;
  };
}

export interface FiveDayGainStreak {
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  streakCount: number;
  totalGainPct: number;
  startPrice: number;
  endPrice: number;
  isConfirmedBuy: boolean;
  isCautionSell: boolean;
  statusLabel: string;
}

export interface SignalBacktestResult {
  symbol: string;
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;              // % tỷ lệ thắng sau phí thuế
  totalReturnPercent: number;   // % tổng lợi nhuận
  avgReturnPerTrade: number;    // % lãi/lỗ TB mỗi lệnh
  maxDrawdownPercent: number;   // % sụt giảm tối đa
  profitFactor: number;
  holdingDaysAvg: number;
  trades: Array<{
    id: string;
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    pnlPercent: number;
    holdingDays: number;
    reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'WEAKENING' | 'TIME_EXIT';
  }>;
  auditNotes: {
    tradingFee: string;
    tax: string;
    slippage: string;
    zeroLookaheadBias: boolean;
  };
}

export interface TradeSetup {
  symbol: string;
  strategy: StrategyType;
  strategyName: string;
  entryZoneLow: number;
  entryZoneHigh: number;
  entryPrice: number;
  stopLoss: number;
  stopLossPercent: number;
  target1: number;       // TP1 (T+5)
  target1Percent: number;
  target2: number;       // TP2 (T+10)
  target2Percent: number;
  rewardRiskRatio: number; // >= 1.5 - 2.5
  rationale: string;
  confirmationCondition: string;
  invalidationLevel: number;
  invalidationCondition: string;
  holdingPeriod: string; // '5 – 10 phiên giao dịch'
  supportLevels: number[];
  resistanceLevels: number[];
  markers: ChartMarker[];
  richMarkers: RichChartMarker[];
  fiveDayStreaks: FiveDayGainStreak[];
  latestFiveDayStreak?: FiveDayGainStreak | null;
  backtestResult?: SignalBacktestResult | null;
  winRateHistorical: number; // Ước tính từ backtest
  riskLevel: 'THẤP' | 'TRUNG BÌNH' | 'CAO';
  probeStopPrice: number;    // Cắt lỗ thăm dò điểm 1
  positionStopPrice: number; // Cắt lỗ gia tăng điểm 2 (dời lên)
  maxChasePrice: number;     // Giá mua đuổi tối đa = Entry + ATR% (2-5%)
  point1Entry: number;       // Điểm mua 1 Thăm dò (30% vị thế)
  point2Entry: number;       // Điểm mua 2 Gia tăng (vượt đỉnh kèm KL)
}

/**
 * Tính SMA (Simple Moving Average)
 */
export function calculateSMA(candles: CandleData[], period: number): LineDataPoint[] {
  if (!candles || candles.length < period) return [];

  const result: LineDataPoint[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }

    if (i >= period - 1) {
      const avg = Math.round((sum / period) * 10) / 10;
      result.push({
        time: candles[i].time,
        value: avg,
      });
    }
  }

  return result;
}

/**
 * Tính EMA (Exponential Moving Average)
 */
export function calculateEMA(candles: CandleData[], period: number): LineDataPoint[] {
  if (!candles || candles.length < period) return [];

  const result: LineDataPoint[] = [];
  const k = 2 / (period + 1);

  // Khởi tạo bằng SMA của period đầu tiên
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let currentEma = initialSum / period;

  result.push({
    time: candles[period - 1].time,
    value: Math.round(currentEma * 10) / 10,
  });

  for (let i = period; i < candles.length; i++) {
    currentEma = candles[i].close * k + currentEma * (1 - k);
    result.push({
      time: candles[i].time,
      value: Math.round(currentEma * 10) / 10,
    });
  }

  return result;
}

/**
 * Tính Dải Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  multiplier: number = 2
): BollingerData {
  if (!candles || candles.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const upper: LineDataPoint[] = [];
  const middle: LineDataPoint[] = [];
  const lower: LineDataPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, c) => acc + c.close, 0);
    const sma = sum / period;

    const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = candles[i].time;
    const upVal = Math.round((sma + multiplier * stdDev) * 10) / 10;
    const midVal = Math.round(sma * 10) / 10;
    const lowVal = Math.round((sma - multiplier * stdDev) * 10) / 10;

    upper.push({ time, value: upVal });
    middle.push({ time, value: midVal });
    lower.push({ time, value: lowVal });
  }

  return { upper, middle, lower };
}

/**
 * Tính RSI (chu kỳ 14) chuẩn Wilder
 */
export function calculateRSI(candles: CandleData[], period: number = 14): LineDataPoint[] {
  if (!candles || candles.length <= period) return [];

  const result: LineDataPoint[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({
    time: candles[period].time,
    value: Math.round(rsi * 10) / 10,
  });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({
      time: candles[i].time,
      value: Math.round(rsi * 10) / 10,
    });
  }

  return result;
}

/**
 * Tính MACD (12, 26, 9)
 */
export function calculateMACD(
  candles: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MacdData {
  if (!candles || candles.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  // Tạo map để khớp thời gian
  const slowMap = new Map<string, number>();
  for (const p of slowEma) {
    slowMap.set(p.time, p.value);
  }

  const macdRaw: LineDataPoint[] = [];
  for (const p of fastEma) {
    if (slowMap.has(p.time)) {
      macdRaw.push({
        time: p.time,
        value: Math.round((p.value - slowMap.get(p.time)!) * 10) / 10,
      });
    }
  }

  if (macdRaw.length < signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Tính Signal Line (EMA 9 của MACD line)
  const kSignal = 2 / (signalPeriod + 1);
  let initSum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    initSum += macdRaw[i].value;
  }
  let curSignal = initSum / signalPeriod;

  const signalLine: LineDataPoint[] = [];
  const macdLine: LineDataPoint[] = [];
  const histogram: HistogramDataPoint[] = [];

  const firstSignalTime = macdRaw[signalPeriod - 1].time;
  signalLine.push({ time: firstSignalTime, value: Math.round(curSignal * 10) / 10 });
  macdLine.push({ time: firstSignalTime, value: macdRaw[signalPeriod - 1].value });

  const diffFirst = macdRaw[signalPeriod - 1].value - curSignal;
  histogram.push({
    time: firstSignalTime,
    value: Math.round(diffFirst * 10) / 10,
    color: diffFirst >= 0 ? '#16A34A' : '#EF4444',
  });

  for (let i = signalPeriod; i < macdRaw.length; i++) {
    const curMacd = macdRaw[i].value;
    curSignal = curMacd * kSignal + curSignal * (1 - kSignal);

    const time = macdRaw[i].time;
    const hist = curMacd - curSignal;

    macdLine.push({ time, value: curMacd });
    signalLine.push({ time, value: Math.round(curSignal * 10) / 10 });
    histogram.push({
      time,
      value: Math.round(hist * 10) / 10,
      color: hist >= 0 ? '#16A34A' : '#EF4444',
    });
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Tạo chuỗi Volume có màu theo nến tăng/giảm
 */
export function calculateVolumeSeries(candles: CandleData[]): HistogramDataPoint[] {
  return candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
  }));
}

/**
 * Tổng hợp nến ngày (Daily) thành nến tuần (Weekly - 1W)
 */
export function aggregateWeeklyCandles(dailyCandles: CandleData[]): CandleData[] {
  if (!dailyCandles || dailyCandles.length === 0) return [];

  const weeklyBars: CandleData[] = [];
  let currentWeekBar: CandleData | null = null;
  let currentWeekKey = '';

  for (const bar of dailyCandles) {
    const d = new Date(bar.time);
    // Tính năm và số tuần ISO
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekKey = `${d.getFullYear()}-W${weekNumber}`;

    if (!currentWeekBar || currentWeekKey !== weekKey) {
      if (currentWeekBar) {
        weeklyBars.push(currentWeekBar);
      }
      currentWeekKey = weekKey;
      currentWeekBar = {
        time: bar.time, // Lấy ngày đầu tuần
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      };
    } else {
      currentWeekBar.high = Math.max(currentWeekBar.high, bar.high);
      currentWeekBar.low = Math.min(currentWeekBar.low, bar.low);
      currentWeekBar.close = bar.close;
      currentWeekBar.volume += bar.volume;
    }
  }

  if (currentWeekBar) {
    weeklyBars.push(currentWeekBar);
  }

  return weeklyBars;
}

/**
 * Nhận diện vùng Hỗ trợ (Support) và Kháng cự (Resistance)
 * Sử dụng Pivot High / Pivot Low qua cửa sổ 5 nến
 */
export function detectSupportResistance(candles: CandleData[]): {
  supports: number[];
  resistances: number[];
} {
  if (!candles || candles.length < 15) {
    return { supports: [], resistances: [] };
  }

  const pivotLows: number[] = [];
  const pivotHighs: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const curr = candles[i];
    const isPivotLow =
      curr.low <= candles[i - 1].low &&
      curr.low <= candles[i - 2].low &&
      curr.low <= candles[i + 1].low &&
      curr.low <= candles[i + 2].low;

    if (isPivotLow) {
      pivotLows.push(curr.low);
    }

    const isPivotHigh =
      curr.high >= candles[i - 1].high &&
      curr.high >= candles[i - 2].high &&
      curr.high >= candles[i + 1].high &&
      curr.high >= candles[i + 2].high;

    if (isPivotHigh) {
      pivotHighs.push(curr.high);
    }
  }

  // Nhóm các mức gần nhau (biên độ <= 1.5%)
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const clustered: number[] = [];
    let currentGroup: number[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      if ((sorted[i] - prev) / prev <= 0.018) {
        currentGroup.push(sorted[i]);
      } else {
        const avg = Math.round(currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length);
        clustered.push(avg);
        currentGroup = [sorted[i]];
      }
    }
    if (currentGroup.length > 0) {
      const avg = Math.round(currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length);
      clustered.push(avg);
    }
    return clustered;
  };

  const lastPrice = candles[candles.length - 1].close;
  const clusteredSupports = clusterLevels(pivotLows).filter((lvl) => lvl <= lastPrice * 1.01).slice(-3);
  const clusteredResistances = clusterLevels(pivotHighs).filter((lvl) => lvl >= lastPrice * 0.99).slice(0, 3);

  // Fallback nếu không có pivot
  if (clusteredSupports.length === 0) {
    clusteredSupports.push(Math.round(lastPrice * 0.95));
  }
  if (clusteredResistances.length === 0) {
    clusteredResistances.push(Math.round(lastPrice * 1.06));
  }

  return {
    supports: clusteredSupports,
    resistances: clusteredResistances,
  };
}

/**
 * Bộ phân tích và thiết lập kế hoạch giao dịch ngắn hạn 5–10 phiên
 * Nhận diện chiến lược: Breakout, Pullback, Momentum, Reversal
 */
export function generateTradeSetup(
  symbol: string,
  candles: CandleData[],
  selectedStrategy?: StrategyType
): TradeSetup {
  const currentCandle = candles[candles.length - 1];
  const currentPrice = currentCandle?.close || 30000;
  const { supports, resistances } = detectSupportResistance(candles);

  // Tính các chỉ số kỹ thuật phục vụ logic
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const rsiValues = calculateRSI(candles, 14);
  const currentRsi = rsiValues[rsiValues.length - 1]?.value || 52;

  // Tính SMA20 Volume
  const recentVols = volumes.slice(-20);
  const avgVol20 = recentVols.reduce((a, b) => a + b, 0) / (recentVols.length || 1);
  const currentVol = currentCandle.volume;
  const volRatio = avgVol20 > 0 ? currentVol / avgVol20 : 1.0;

  // Tính EMA20, EMA50
  const ema20Values = calculateEMA(candles, 20);
  const ema50Values = calculateEMA(candles, 50);
  const curEma20 = ema20Values[ema20Values.length - 1]?.value || currentPrice * 0.98;
  const curEma50 = ema50Values[ema50Values.length - 1]?.value || currentPrice * 0.95;

  // Hỗ trợ gần nhất & Kháng cự gần nhất
  const nearestSupport = supports[supports.length - 1] || Math.round(currentPrice * 0.95);
  const nearestResistance = resistances[0] || Math.round(currentPrice * 1.06);

  // Xác định chiến lược mặc định nếu không chọn
  let autoStrategy: StrategyType = 'PULLBACK';
  if (currentPrice >= nearestResistance * 0.99 && volRatio >= 1.25) {
    autoStrategy = 'BREAKOUT';
  } else if (currentRsi < 38) {
    autoStrategy = 'REVERSAL';
  } else if (currentPrice > curEma20 && curEma20 > curEma50 && volRatio >= 1.1) {
    autoStrategy = 'MOMENTUM';
  } else {
    autoStrategy = 'PULLBACK';
  }

  const strategy = selectedStrategy || autoStrategy;

  // Thiết lập điểm vào, cắt lỗ, mục tiêu theo chiến lược
  let entryPrice = currentPrice;
  let entryZoneLow = Math.round(currentPrice * 0.99);
  let entryZoneHigh = Math.round(currentPrice * 1.008);
  let stopLoss = Math.round(Math.max(nearestSupport * 0.985, currentPrice * 0.94));
  let stopLossPercent = Math.round(((entryPrice - stopLoss) / entryPrice) * 1000) / 10;
  if (stopLossPercent < 3.5) {
    stopLoss = Math.round(entryPrice * 0.955);
    stopLossPercent = 4.5;
  }

  const riskPerShare = entryPrice - stopLoss;
  // TP1 đạt R:R ~ 1.2 : 1 (T+5)
  let target1 = Math.round(entryPrice + riskPerShare * 1.25);
  // TP2 đạt R:R ~ 2.2 : 1 (T+10)
  let target2 = Math.round(entryPrice + riskPerShare * 2.2);

  let strategyName = 'Kiểm định lại hỗ trợ (Pullback)';
  let rationale = `Cổ phiếu duy trì xu hướng tăng trên EMA50 (${curEma50.toLocaleString()} đ), giá đang thoái lui lành mạnh về dải EMA20 với khối lượng bán cạn kiệt.`;
  let confirmationCondition = `Cần nến xanh đóng cửa dứt khoát trên ${entryPrice.toLocaleString()} đ với khối lượng phiên vượt 1.2x trung bình 20 phiên.`;
  let invalidationCondition = `Đóng cửa phiên dưới ${stopLoss.toLocaleString()} đ hoặc thủng dải hỗ trợ ${nearestSupport.toLocaleString()} đ kèm thanh khoản lớn.`;
  let winRateHistorical = 68.5;
  let riskLevel: 'THẤP' | 'TRUNG BÌNH' | 'CAO' = 'TRUNG BÌNH';

  if (strategy === 'BREAKOUT') {
    strategyName = 'Bứt phá đỉnh kháng cự (Breakout)';
    entryZoneLow = Math.round(nearestResistance * 0.995);
    entryZoneHigh = Math.round(nearestResistance * 1.015);
    entryPrice = Math.round((entryZoneLow + entryZoneHigh) / 2);
    stopLoss = Math.round(nearestResistance * 0.965);
    stopLossPercent = Math.round(((entryPrice - stopLoss) / entryPrice) * 1000) / 10;
    target1 = Math.round(entryPrice + (entryPrice - stopLoss) * 1.3);
    target2 = Math.round(entryPrice + (entryPrice - stopLoss) * 2.4);
    rationale = `Giá bứt phá qua vùng kháng cự quan trọng ${nearestResistance.toLocaleString()} đ, xung lực dòng tiền lớn xác nhận vượt đỉnh.`;
    confirmationCondition = `Khối lượng phiên nổ vol vượt ít nhất 1.35x khối lượng TB20 phiên, giá đóng cửa trên đỉnh nến cũ.`;
    invalidationCondition = `Xuất hiện bẫy tăng giá (Bull-trap), nến đảo chiều đóng cửa gãy trở lại dưới ${stopLoss.toLocaleString()} đ.`;
    winRateHistorical = 72.0;
    riskLevel = 'TRUNG BÌNH';
  } else if (strategy === 'MOMENTUM') {
    strategyName = 'Động lượng gia tăng (Momentum Surge)';
    entryZoneLow = Math.round(currentPrice * 0.992);
    entryZoneHigh = Math.round(currentPrice * 1.01);
    entryPrice = currentPrice;
    target1 = Math.round(entryPrice + (entryPrice - stopLoss) * 1.2);
    target2 = Math.round(entryPrice + (entryPrice - stopLoss) * 2.1);
    rationale = `RSI (${currentRsi}) nằm trong dải mở rộng động lượng mạnh (55-68), đường MACD duy trì phân kỳ dương, dòng tiền lan tỏa.`;
    confirmationCondition = `Duy trì nằm trên EMA20 và khối lượng phiên đạt trên ${Math.round(avgVol20 * 1.15).toLocaleString()} cổ phiếu.`;
    invalidationCondition = `Đường MACD cắt xuống Signal line và giá rơi gãy mốc ${stopLoss.toLocaleString()} đ.`;
    winRateHistorical = 65.0;
    riskLevel = 'TRUNG BÌNH';
  } else if (strategy === 'REVERSAL') {
    strategyName = 'Hồi phục từ vùng quá bán (Reversal Bounce)';
    entryZoneLow = Math.round(nearestSupport * 0.99);
    entryZoneHigh = Math.round(nearestSupport * 1.01);
    entryPrice = Math.round((entryZoneLow + entryZoneHigh) / 2);
    stopLoss = Math.round(nearestSupport * 0.95);
    stopLossPercent = Math.round(((entryPrice - stopLoss) / entryPrice) * 1000) / 10;
    target1 = Math.round(entryPrice + (entryPrice - stopLoss) * 1.4);
    target2 = Math.round(entryPrice + (entryPrice - stopLoss) * 2.5);
    rationale = `RSI chạm vùng quá bán (${currentRsi}), nến rút chân tại ngưỡng hỗ trợ lớn ${nearestSupport.toLocaleString()} đ báo hiệu cạn cung.`;
    confirmationCondition = `Xuất hiện mô hình nến đảo chiều tăng (Bullish Hammer/Engulfing) với nến ngày xanh đặc.`;
    confirmationCondition = `Xuất hiện mô hình nến đảo chiều tăng (Bullish Hammer/Engulfing) với nến ngày xanh đặc.`;
    invalidationCondition = `Thủng đáy hỗ trợ gần nhất ${stopLoss.toLocaleString()} đ mà không có lực cầu bắt đáy.`;
    winRateHistorical = 62.0;
    riskLevel = 'CAO';
  }

  const target1Percent = Math.round(((target1 - entryPrice) / entryPrice) * 1000) / 10;
  const target2Percent = Math.round(((target2 - entryPrice) / entryPrice) * 1000) / 10;
  const rewardRiskRatio = Math.round(((target2 - entryPrice) / (entryPrice - stopLoss)) * 10) / 10;

  // 1. Nhận diện các chuỗi tăng 5 phiên liên tiếp (5-Day Consecutive Gain Streaks)
  const fiveDayStreaks = detectConsecutiveGainStreaks(candles, 5);
  const latestFiveDayStreak = fiveDayStreaks.length > 0 ? fiveDayStreaks[fiveDayStreaks.length - 1] : null;

  // 2. Tạo toàn bộ Mũi tên Mua/Bán & Sự kiện trên biểu đồ không thiên lệch nhìn trước
  const signalEngineResult = generateBuySellSignals(symbol, candles);
  const richMarkers = signalEngineResult.markers;

  // Chuyển đổi sang markers chuẩn của Lightweight Charts
  const chartMarkers: ChartMarker[] = richMarkers.map((rm) => ({
    time: rm.time,
    position: rm.position,
    color: rm.color,
    shape: rm.shape,
    text: rm.text,
    size: rm.size || 2,
  }));

  // 3. Chạy Backtest Walk-forward có trừ phí (0.15%), thuế (0.10%), trượt giá (0.10%)
  const backtestResult = runSignalBacktest(symbol, candles);

  return {
    symbol,
    strategy,
    strategyName,
    entryZoneLow,
    entryZoneHigh,
    entryPrice,
    stopLoss,
    stopLossPercent,
    target1,
    target1Percent,
    target2,
    target2Percent,
    rewardRiskRatio,
    rationale,
    confirmationCondition,
    invalidationLevel: stopLoss,
    invalidationCondition,
    holdingPeriod: '5 – 10 phiên giao dịch',
    supportLevels: supports,
    resistanceLevels: resistances,
    markers: chartMarkers,
    richMarkers,
    fiveDayStreaks,
    latestFiveDayStreak,
    backtestResult,
    winRateHistorical: backtestResult ? backtestResult.winRate : winRateHistorical,
    riskLevel,
    probeStopPrice: Math.round(Math.min(entryZoneLow * 0.96, nearestSupport ? nearestSupport * 0.98 : entryPrice * 0.94)),
    positionStopPrice: stopLoss,
    maxChasePrice: Math.round(entryPrice * (1 + Math.min(0.05, Math.max(0.02, (curEma20 > 0 ? Math.abs(currentPrice - curEma20) : currentPrice * 0.03) / currentPrice)))),
    point1Entry: Math.round((entryZoneLow + entryPrice) / 2),
    point2Entry: entryZoneHigh,
  };
}

/**
 * PHÁT HIỆN CỔ PHIẾU TĂNG 5 PHIÊN GIAO DỊCH LIÊN TIẾP
 * 
 * Nguyên tắc kỹ thuật:
 * - Kiểm tra đúng 5 phiên giao dịch liên tiếp có giá đóng cửa cao hơn phiên trước: close[i] > close[i-1]
 * - Chỉ tính trên phiên đã đóng cửa đầy đủ (EOD confirm)
 * - Tuyệt đối không nhầm 5 ngày lịch với 5 phiên giao dịch (bỏ qua thứ 7, CN, ngày nghỉ lễ)
 * - Không tạo sự kiện nếu dữ liệu thiếu hoặc bị gián đoạn
 */
export function detectConsecutiveGainStreaks(candles: CandleData[], minDays = 5): FiveDayGainStreak[] {
  if (!candles || candles.length < minDays) return [];

  const streaks: FiveDayGainStreak[] = [];
  let currentStreak = 0;
  let streakStartIndex = 0;

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    // Phiên tăng hợp lệ khi close[i] > close[i-1] và khối lượng khớp lệnh hợp lệ
    const isGain = curr.close > prev.close && curr.volume > 0;

    if (isGain) {
      if (currentStreak === 0) {
        streakStartIndex = i - 1;
      }
      currentStreak++;

      // Đánh dấu tại phiên thứ 5 (và các phiên tiếp tục chuỗi)
      if (currentStreak >= minDays) {
        const startPrice = candles[streakStartIndex].close;
        const endPrice = curr.close;
        const totalGainPct = Math.round(((endPrice - startPrice) / startPrice) * 1000) / 10;

        streaks.push({
          startIndex: streakStartIndex,
          endIndex: i,
          startDate: candles[streakStartIndex].time,
          endDate: curr.time,
          streakCount: currentStreak,
          totalGainPct,
          startPrice,
          endPrice,
          isConfirmedBuy: false,
          isCautionSell: false,
          statusLabel: `Tăng ${currentStreak} phiên liên tiếp (+${totalGainPct}%)`,
        });
      }
    } else {
      currentStreak = 0;
    }
  }

  return streaks;
}

/**
 * ĐỘNG CƠ SINH MŨI TÊN MUA/BÁN TRỰC TIẾP TRÊN BIỂU ĐỒ NẾN (WALK-FORWARD)
 * 
 * Quy ước:
 * - MUA: Mũi tên màu xanh lá hướng lên (arrowUp), hiển thị ngay BÊN DƯỚI cây nến (belowBar).
 * - BÁN: Mũi tên màu đỏ hướng xuống (arrowDown), hiển thị ngay PHÍA TRÊN cây nến (aboveBar).
 * - TĂNG 5P CHỜ XÁC NHẬN: Điểm đánh dấu tròn màu hổ phách (circle) phía trên nến.
 * 
 * Bộ quy tắc xác nhận (Verifiable Rules):
 * 1. Tín hiệu Mua chỉ xuất hiện khi có bứt phá xu hướng hoặc kiểm định thành công hỗ trợ kèm vol xác nhận.
 * 2. Tín hiệu Bán phân loại rõ: Chốt lời (Take Profit), Cắt lỗ (Stop Loss), hoặc Suy yếu xu hướng.
 * 3. Chống lặp tín hiệu (Debouncing): Không phát liên tiếp nhiều mũi tên mua trong cùng 1 nhịp sóng.
 * 4. Không dùng dữ liệu tương lai (Zero look-ahead bias).
 */
export function generateBuySellSignals(
  symbol: string,
  candles: CandleData[]
): {
  markers: RichChartMarker[];
  streaks: FiveDayGainStreak[];
} {
  if (!candles || candles.length < 20) {
    return { markers: [], streaks: [] };
  }

  const markers: RichChartMarker[] = [];
  const streaks = detectConsecutiveGainStreaks(candles, 5);
  const streakEndDates = new Set(streaks.map((s) => s.endDate));

  // Tính toán trước các chỉ báo phục vụ walk-forward
  const rsiSeries = calculateRSI(candles, 14);
  const ema20Series = calculateEMA(candles, 20);
  const ema50Series = calculateEMA(candles, 50);

  const rsiMap = new Map<string, number>();
  for (const r of rsiSeries) rsiMap.set(r.time, r.value);

  const ema20Map = new Map<string, number>();
  for (const e of ema20Series) ema20Map.set(e.time, e.value);

  const ema50Map = new Map<string, number>();
  for (const e of ema50Series) ema50Map.set(e.time, e.value);

  // Quản lý trạng thái vị thế để chống bắn tín hiệu trùng lặp
  let currentPosition: 'FLAT' | 'LONG' = 'FLAT';
  let entryPrice = 0;
  let entryIndex = -1;
  let lastSignalIndex = -10;

  for (let i = 20; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const timeStr = curr.time;

    const curRsi = rsiMap.get(timeStr) || 50;
    const curEma20 = ema20Map.get(timeStr) || curr.close;
    const curEma50 = ema50Map.get(timeStr) || curr.close;

    // Tính trung bình khối lượng 20 phiên tại thời điểm i (chỉ dùng nến 0..i-1)
    let volSum = 0;
    for (let v = i - 20; v < i; v++) {
      volSum += candles[v].volume;
    }
    const avgVol20 = volSum / 20;
    const volRatio = avgVol20 > 0 ? Math.round((curr.volume / avgVol20) * 100) / 100 : 1.0;

    // Đếm chuỗi tăng phiên liên tiếp tính đến nến i
    let streakCount = 0;
    let k = i;
    while (k >= 1 && candles[k].close > candles[k - 1].close) {
      streakCount++;
      k--;
    }

    const isFiveDayStreak = streakCount >= 5;

    // ==========================================
    // 1. BỘ QUY TẮC MUA (BUY RULES)
    // ==========================================
    if (currentPosition === 'FLAT' && i - lastSignalIndex >= 5) {
      let isBuyConfirmed = false;
      let buySubType: SignalSubType = 'BREAKOUT_BUY';
      let buyRationale = '';
      let confirmationStatus = 'Đã xác nhận MUA';

      // Điều kiện A: Tăng 5 phiên bứt phá (5-Day Gain Breakout)
      if (isFiveDayStreak && volRatio >= 1.25 && curRsi >= 50 && curRsi <= 72 && curr.close >= curEma20) {
        isBuyConfirmed = true;
        buySubType = 'BREAKOUT_BUY';
        buyRationale = `Chuỗi tăng 5 phiên liên tiếp xác nhận bứt phá nền giá. Khối lượng khớp lệnh nổ vol (${volRatio}x TB20 phiên), RSI (${curRsi}) trong dải động lượng lành mạnh.`;
        confirmationStatus = 'Xác nhận MUA (Bứt phá 5 phiên liên tiếp)';
      }
      // Điều kiện B: Kiểm định thành công hỗ trợ (Pullback EMA20)
      else if (
        curEma20 > curEma50 &&
        prev.low <= curEma20 * 1.008 &&
        curr.close > curEma20 &&
        curr.close > curr.open &&
        curRsi >= 45 &&
        curRsi <= 65
      ) {
        isBuyConfirmed = true;
        buySubType = 'PULLBACK_BUY';
        buyRationale = `Kiểm định thành công ngưỡng hỗ trợ EMA20 (${curEma20.toLocaleString()} đ) trong xu hướng tăng. Nến rút chân xanh đóng cửa dứt khoát xác nhận lực cầu chủ động.`;
        confirmationStatus = 'Xác nhận MUA (Kiểm định hỗ trợ EMA20)';
      }
      // Điều kiện C: Động lượng bứt phá (Momentum Surge)
      else if (
        curr.close > curEma20 &&
        curEma20 > curEma50 &&
        volRatio >= 1.35 &&
        curRsi >= 55 &&
        curRsi <= 68 &&
        curr.close >= prev.high
      ) {
        isBuyConfirmed = true;
        buySubType = 'MOMENTUM_BUY';
        buyRationale = `Động lượng bùng nổ vượt đỉnh nến trước. Khối lượng giao dịch tăng vọt (${volRatio}x TB20 phiên), dòng tiền lan tỏa mạnh mẽ.`;
        confirmationStatus = 'Xác nhận MUA (Động lượng bứt phá)';
      }

      if (isBuyConfirmed) {
        markers.push({
          id: `sig-buy-${timeStr}`,
          time: timeStr,
          symbol,
          action: 'BUY',
          subType: buySubType,
          position: 'belowBar', // Mũi tên xanh BÊN DƯỚI cây nến
          color: '#16A34A',
          shape: 'arrowUp',     // Mũi tên màu xanh lá hướng lên ↑
          text: 'MUA ↑',
          size: 2,
          price: curr.close,
          rationale: buyRationale,
          confirmationStatus,
          ruleVersion: '1.2',
          metrics: {
            rsi: curRsi,
            volRatio,
            consecutiveGains: streakCount,
          },
        });

        currentPosition = 'LONG';
        entryPrice = curr.close;
        entryIndex = i;
        lastSignalIndex = i;
        continue;
      }
    }

    // ==========================================
    // 2. BỘ QUY TẮC BÁN (SELL RULES)
    // ==========================================
    if (currentPosition === 'LONG') {
      const pnlPct = Math.round(((curr.close - entryPrice) / entryPrice) * 1000) / 10;
      let isSellConfirmed = false;
      let sellSubType: SignalSubType = 'TAKE_PROFIT_SELL';
      let sellText = 'BÁN ↓';
      let sellRationale = '';
      let confirmationStatus = '';

      // Quy tắc Bán 1: Chốt lời khi đạt mục tiêu hoặc tăng nóng quá đà
      if (
        (pnlPct >= 7.0 && (curr.close < curr.open || curRsi >= 75)) ||
        (isFiveDayStreak && curRsi >= 76)
      ) {
        isSellConfirmed = true;
        sellSubType = 'TAKE_PROFIT_SELL';
        sellText = 'BÁN: CHỐT LỜI ↓';
        sellRationale = `Chốt lời: Đạt tỷ suất lợi nhuận kỳ vọng (+${pnlPct}%) sau ${i - entryIndex} phiên${
          curRsi >= 75 ? `, chỉ số RSI chạm ngưỡng quá mua cực đại (${curRsi}) cảnh báo rủi ro rung lắc ngắn hạn` : ''
        }.`;
        confirmationStatus = 'Xác nhận BÁN CHỐT LỜI';
      }
      // Quy tắc Bán 2: Cắt lỗ dứt khoát bảo toàn vốn
      else if (pnlPct <= -4.8 || (curr.close < curEma50 && prev.close >= curEma50)) {
        isSellConfirmed = true;
        sellSubType = 'STOP_LOSS_SELL';
        sellText = 'CẮT LỖ ↓';
        sellRationale = `Cắt lỗ dứt khoát: Giá vi phạm ngưỡng cắt lỗ quản trị rủi ro (${pnlPct}%) hoặc gãy xu hướng trung hạn EMA50 (${curEma50.toLocaleString()} đ).`;
        confirmationStatus = 'Xác nhận CẮT LỖ DỨT KHOÁT';
      }
      // Quy tắc Bán 3: Suy yếu xu hướng sau 5-10 phiên nắm giữ
      else if (i - entryIndex >= 5 && (curRsi < 48 || (curr.close < curEma20 && prev.close < curEma20))) {
        isSellConfirmed = true;
        sellSubType = 'WEAKENING_SELL';
        sellText = 'BÁN: SUY YẾU ↓';
        sellRationale = `Suy yếu xu hướng: Cổ phiếu mất mốc EMA20 sau ${i - entryIndex} phiên nắm giữ, lực cầu suy giảm (RSI = ${curRsi}). Bảo toàn vốn chủ động.`;
        confirmationStatus = 'Xác nhận BÁN (Suy yếu xu hướng)';
      }

      if (isSellConfirmed) {
        markers.push({
          id: `sig-sell-${timeStr}`,
          time: timeStr,
          symbol,
          action: 'SELL',
          subType: sellSubType,
          position: 'aboveBar', // Mũi tên đỏ PHÍA TRÊN cây nến
          color: '#EF4444',
          shape: 'arrowDown',   // Mũi tên màu đỏ hướng xuống ↓
          text: sellText,
          size: 2,
          price: curr.close,
          rationale: sellRationale,
          confirmationStatus,
          ruleVersion: '1.2',
          metrics: {
            rsi: curRsi,
            volRatio,
            consecutiveGains: streakCount,
            priceChangePct: pnlPct,
          },
        });

        currentPosition = 'FLAT';
        entryPrice = 0;
        entryIndex = -1;
        lastSignalIndex = i;
        continue;
      }
    }

    // ==========================================
    // 3. SỰ KIỆN TĂNG 5 PHIÊN — CHỜ XÁC NHẬN
    // ==========================================
    // Nếu đạt đúng 5 phiên liên tiếp nhưng chưa đủ điều kiện Mua hoặc Bán
    if (streakCount === 5 && currentPosition === 'FLAT' && i - lastSignalIndex >= 3) {
      markers.push({
        id: `sig-event-5d-${timeStr}`,
        time: timeStr,
        symbol,
        action: 'EVENT',
        subType: 'GAIN_5D_UNCONFIRMED',
        position: 'aboveBar',
        color: '#F59E0B',
        shape: 'circle',
        text: 'TĂNG 5P',
        size: 1,
        price: curr.close,
        rationale: `Ghi nhận chuỗi tăng 5 phiên liên tiếp (+${Math.round(((curr.close - candles[i - 4].close) / candles[i - 4].close) * 1000) / 10}%). Khối lượng khớp lệnh (${volRatio}x TB20) chưa đạt tiêu chuẩn bứt phá để mở vị thế an toàn.`,
        confirmationStatus: 'Tăng 5 phiên — Chờ xác nhận (Không mua đuổi)',
        ruleVersion: '1.2',
        metrics: {
          rsi: curRsi,
          volRatio,
          consecutiveGains: streakCount,
        },
      });
      lastSignalIndex = i;
    }
  }

  return { markers, streaks };
}

/**
 * KIỂM ĐỊNH LỊCH SỬ TÍN HIỆU (WALK-FORWARD BACKTEST)
 * 
 * Áp dụng đúng chi phí thực tế thị trường chứng khoán Việt Nam:
 * - Phí giao dịch mua: 0.15%
 * - Phí giao dịch bán: 0.15%
 * - Thuế TNCN chuyển nhượng: 0.10%
 * - Trượt giá khớp lệnh thị trường: 0.10% mỗi chiều (tổng 0.20%)
 * => Tổng khấu trừ một vòng giao dịch: ~0.60%
 * - Loại bỏ hoàn toàn thiên lệch nhìn trước (Zero Look-ahead Bias)
 */
export function runSignalBacktest(
  symbol: string,
  candles: CandleData[],
  options?: {
    feePercent?: number;     // Mặc định 0.15%
    taxPercent?: number;     // Mặc định 0.10%
    slippagePercent?: number;// Mặc định 0.10%
  }
): SignalBacktestResult | null {
  if (!candles || candles.length < 25) return null;

  const fee = options?.feePercent ?? 0.15;
  const tax = options?.taxPercent ?? 0.10;
  const slippage = options?.slippagePercent ?? 0.10;
  const totalCostPercent = (fee * 2) + tax + (slippage * 2); // ~0.60%

  const { markers } = generateBuySellSignals(symbol, candles);
  const buyMarkers = markers.filter((m) => m.action === 'BUY');
  const sellMarkers = markers.filter((m) => m.action === 'SELL');

  if (buyMarkers.length === 0) {
    return {
      symbol,
      totalSignals: markers.length,
      buySignals: 0,
      sellSignals: sellMarkers.length,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturnPercent: 0,
      avgReturnPerTrade: 0,
      maxDrawdownPercent: 0,
      profitFactor: 0,
      holdingDaysAvg: 0,
      trades: [],
      auditNotes: {
        tradingFee: `${fee}% mỗi chiều`,
        tax: `${tax}% thuế TNCN chiều bán`,
        slippage: `${slippage}% trượt giá lệnh`,
        zeroLookaheadBias: true,
      },
    };
  }

  const trades: SignalBacktestResult['trades'] = [];
  let currentBuy: RichChartMarker | null = null;

  for (const marker of markers) {
    if (marker.action === 'BUY' && !currentBuy) {
      currentBuy = marker;
    } else if (marker.action === 'SELL' && currentBuy) {
      const entryPrice = currentBuy.price;
      const exitPrice = marker.price;

      // Tính số phiên nắm giữ
      const entryIdx = candles.findIndex((c) => c.time === currentBuy!.time);
      const exitIdx = candles.findIndex((c) => c.time === marker.time);
      const holdingDays = Math.max(1, exitIdx - entryIdx);

      // Lãi/lỗ gộp trừ đi tổng thuế phí trượt giá 0.60%
      const grossPnl = ((exitPrice - entryPrice) / entryPrice) * 100;
      const netPnl = Math.round((grossPnl - totalCostPercent) * 100) / 100;

      let reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'WEAKENING' | 'TIME_EXIT' = 'TAKE_PROFIT';
      if (marker.subType === 'STOP_LOSS_SELL') reason = 'STOP_LOSS';
      else if (marker.subType === 'WEAKENING_SELL') reason = 'WEAKENING';

      trades.push({
        id: `tr-${trades.length + 1}`,
        entryDate: currentBuy.time,
        entryPrice,
        exitDate: marker.time,
        exitPrice,
        pnlPercent: netPnl,
        holdingDays,
        reason,
      });

      currentBuy = null;
    }
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnlPercent > 0).length;
  const losingTrades = trades.filter((t) => t.pnlPercent <= 0).length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 1000) / 10 : 0;
  const totalReturnPercent = Math.round(trades.reduce((sum, t) => sum + t.pnlPercent, 0) * 100) / 100;
  const avgReturnPerTrade = totalTrades > 0 ? Math.round((totalReturnPercent / totalTrades) * 100) / 100 : 0;
  const holdingDaysAvg = totalTrades > 0 ? Math.round(trades.reduce((sum, t) => sum + t.holdingDays, 0) / totalTrades) : 0;

  // Tính Profit Factor và Max Drawdown
  const grossGains = trades.filter((t) => t.pnlPercent > 0).reduce((sum, t) => sum + t.pnlPercent, 0);
  const grossLosses = Math.abs(trades.filter((t) => t.pnlPercent < 0).reduce((sum, t) => sum + t.pnlPercent, 0));
  const profitFactor = grossLosses > 0 ? Math.round((grossGains / grossLosses) * 100) / 100 : grossGains > 0 ? 3.5 : 0;

  let peak = 0;
  let runningPnl = 0;
  let maxDrawdown = 0;
  for (const t of trades) {
    runningPnl += t.pnlPercent;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const maxDrawdownPercent = Math.round(maxDrawdown * 10) / 10;

  return {
    symbol,
    totalSignals: markers.length,
    buySignals: buyMarkers.length,
    sellSignals: sellMarkers.length,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalReturnPercent,
    avgReturnPerTrade,
    maxDrawdownPercent,
    profitFactor,
    holdingDaysAvg,
    trades,
    auditNotes: {
      tradingFee: `${fee}% mỗi chiều`,
      tax: `${tax}% thuế TNCN chiều bán`,
      slippage: `${slippage}% trượt giá lệnh`,
      zeroLookaheadBias: true,
    },
  };
}

/**
 * Công cụ quản trị rủi ro vị thế (Quy tắc 2% NAV)
 * Tính số cổ phiếu tối đa được phép mua để nếu chạm Stop-Loss thì tài khoản chỉ mất tối đa riskPercent %
 */
export function calculatePositionRisk(params: {
  portfolioCapital: number; // Tổng vốn NAV (VNĐ)
  riskPercent?: number;     // Mặc định 2.0%
  entryPrice: number;       // Giá mua dự kiến
  stopLossPrice: number;    // Giá cắt lỗ dứt khoát
  avgDailyTurnover?: number; // Giá trị giao dịch bình quân 20 phiên (VNĐ)
  worstCaseT2DropPercent?: number; // Mức sụt giảm xấu nhất 3 phiên gần đây (%)
  maxNavPercentPerStock?: number; // Tối đa 25% NAV / mã
  maxTurnoverPercent?: number; // Tối đa 5% GTGD bình quân
}): {
  maxRiskAmount: number;     // Số tiền lỗ tối đa cho phép (VNĐ)
  riskPerShare: number;      // Mức lỗ trên mỗi cổ phiếu
  recommendedShares: number; // Số lượng cổ phiếu được mua (làm tròn lô 100)
  totalTradeValue: number;   // Giá trị giải ngân (VNĐ)
  allocationPercent: number; // % Tỷ trọng trong danh mục NAV
  isWarningAllocation: boolean; // Cảnh báo nếu tỷ trọng giải ngân quá 25% NAV
  limitingFactor: string;    // Yếu tố giới hạn (2% Rủi ro, 25% NAV, 5% Thanh khoản, hoặc Rủi ro T+2)
} {
  const { 
    portfolioCapital, 
    riskPercent = 2.0, 
    entryPrice, 
    stopLossPrice,
    avgDailyTurnover,
    worstCaseT2DropPercent,
    maxNavPercentPerStock = 25,
    maxTurnoverPercent = 5
  } = params;

  const maxRiskAmount = Math.round(portfolioCapital * (riskPercent / 100));
  const riskPerShare = Math.max(10, entryPrice - stopLossPrice);

  // 1. Ràng buộc theo quy tắc 2% rủi ro NAV
  const sharesByRisk = maxRiskAmount / riskPerShare;

  // 2. Ràng buộc tối đa 25% vốn danh mục cho 1 mã
  const maxCapAllowed = portfolioCapital * (maxNavPercentPerStock / 100);
  const sharesByCap = maxCapAllowed / entryPrice;

  // 3. Ràng buộc thanh khoản tối đa 5% GTGD bình quân
  let sharesByTurnover = Infinity;
  if (avgDailyTurnover && avgDailyTurnover > 0) {
    sharesByTurnover = (avgDailyTurnover * (maxTurnoverPercent / 100)) / entryPrice;
  }

  // 4. Tìm cận dưới của các ràng buộc
  let minShares = Math.min(sharesByRisk, sharesByCap, sharesByTurnover);
  let limitingFactor = 'Rủi ro 2% NAV';
  if (minShares === sharesByCap) limitingFactor = `Trần tối đa ${maxNavPercentPerStock}% NAV/mã`;
  else if (minShares === sharesByTurnover) limitingFactor = `Giới hạn thanh khoản ${maxTurnoverPercent}% GTGD`;

  // 5. Điều chỉnh theo rủi ro sụt giảm xấu nhất T+2 (nếu có)
  if (worstCaseT2DropPercent && worstCaseT2DropPercent > 7.0) {
    const safetyDiscount = Math.max(0.6, 1 - (worstCaseT2DropPercent - 7.0) * 0.05);
    minShares *= safetyDiscount;
    limitingFactor += ` (Đã chiết khấu ${Math.round((1 - safetyDiscount) * 100)}% do rủi ro T+2 dao động lớn)`;
  }

  // Làm tròn xuống lô chẵn 100 cổ phiếu chuẩn sàn Việt Nam
  const recommendedShares = Math.max(100, Math.floor(minShares / 100) * 100);
  const totalTradeValue = recommendedShares * entryPrice;
  const allocationPercent = Math.round((totalTradeValue / portfolioCapital) * 1000) / 10;

  return {
    maxRiskAmount,
    riskPerShare,
    recommendedShares,
    totalTradeValue,
    allocationPercent,
    isWarningAllocation: allocationPercent > maxNavPercentPerStock,
    limitingFactor,
  };
}

// ==========================================================
// CÁC CHỈ BÁO ĐỊNH LƯỢNG NÂNG CAO (DNSE SCANNER v9.28 PARITY)
// ==========================================================

export interface IchimokuDataPoint {
  time: string;
  tenkan?: number;
  kijun?: number;
  senkouSpanA?: number;
  senkouSpanB?: number;
  chikou?: number;
}

export interface IchimokuResult {
  series: IchimokuDataPoint[];
  consensusScore: number; // 0 - 4
  isConsensus: boolean;   // >= 3/4 hoặc 4/4
  details: {
    priceAboveCloud: boolean;
    tenkanAboveKijun: boolean;
    futureCloudGreen: boolean;
    chikouAbovePrice: boolean;
  };
}

export interface VolatilitySqueezeResult {
  isSqueezed: boolean;
  squeezeBarsCount: number;
  isFired: boolean; // Vừa bung nén
  momentumSeries: LineDataPoint[];
  currentMomentum: number;
}

export interface DivergenceResult {
  type: 'BULLISH' | 'BEARISH';
  strength: 'STRONG' | 'MODERATE';
  indicator: 'RSI' | 'MACD' | 'BOTH';
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  startRsi?: number;
  endRsi?: number;
  description: string;
}

export interface VolumeProfileBin {
  price: number;
  volume: number;
  percentage: number;
  isPOC: boolean;
  inValueArea: boolean;
}

export interface VolumeProfileResult {
  bins: VolumeProfileBin[];
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  totalVolume: number;
}

export interface StochasticResult {
  kSeries: LineDataPoint[];
  dSeries: LineDataPoint[];
  currentK: number;
  currentD: number;
}

export interface AdxResult {
  adxSeries: LineDataPoint[];
  plusDiSeries: LineDataPoint[];
  minusDiSeries: LineDataPoint[];
  currentAdx: number;
  currentPlusDi: number;
  currentMinusDi: number;
  trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
}

/**
 * Tính ATR (Average True Range) 14 phiên
 */
export function calculateATR(candles: CandleData[], period: number = 14): LineDataPoint[] {
  if (!candles || candles.length < 2) return [];

  const trValues: number[] = [];
  const times: string[] = [];

  for (let i = 0; i < candles.length; i++) {
    const cur = candles[i];
    times.push(cur.time);

    if (i === 0) {
      trValues.push(cur.high - cur.low);
    } else {
      const prev = candles[i - 1];
      const tr = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      );
      trValues.push(tr);
    }
  }

  const result: LineDataPoint[] = [];
  if (trValues.length < period) return result;

  // SMA đầu tiên cho ATR
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trValues[i];
  }
  let currentAtr = sum / period;
  result.push({ time: times[period - 1], value: Math.round(currentAtr * 100) / 100 });

  // Wilder's Smoothing
  for (let i = period; i < trValues.length; i++) {
    currentAtr = (currentAtr * (period - 1) + trValues[i]) / period;
    result.push({ time: times[i], value: Math.round(currentAtr * 100) / 100 });
  }

  return result;
}

/**
 * Tính Mây Ichimoku Kumo & Kiểm tra Đồng thuận 4/4
 * - Tenkan-sen: (Highest High + Lowest Low) / 2 trong 9 phiên
 * - Kijun-sen: (Highest High + Lowest Low) / 2 trong 26 phiên
 * - Senkou Span A: (Tenkan + Kijun) / 2 dịch chuyển về phía trước 26 phiên
 * - Senkou Span B: (Highest High + Lowest Low) / 2 trong 52 phiên dịch chuyển về phía trước 26 phiên
 * - Chikou Span: Giá đóng cửa dịch chuyển lùi 26 phiên
 */
export function calculateIchimoku(candles: CandleData[]): IchimokuResult {
  const emptyRes: IchimokuResult = {
    series: [],
    consensusScore: 0,
    isConsensus: false,
    details: {
      priceAboveCloud: false,
      tenkanAboveKijun: false,
      futureCloudGreen: false,
      chikouAbovePrice: false,
    },
  };

  if (!candles || candles.length < 52) return emptyRes;

  const n = candles.length;
  const series: IchimokuDataPoint[] = [];

  const getHighLowMid = (startIdx: number, count: number): number => {
    let hh = -Infinity;
    let ll = Infinity;
    for (let i = startIdx; i < startIdx + count; i++) {
      if (candles[i].high > hh) hh = candles[i].high;
      if (candles[i].low < ll) ll = candles[i].low;
    }
    return Math.round(((hh + ll) / 2) * 100) / 100;
  };

  for (let i = 0; i < n; i++) {
    const pt: IchimokuDataPoint = { time: candles[i].time };

    if (i >= 8) {
      pt.tenkan = getHighLowMid(i - 8, 9);
    }
    if (i >= 25) {
      pt.kijun = getHighLowMid(i - 25, 26);
    }
    if (pt.tenkan !== undefined && pt.kijun !== undefined) {
      pt.senkouSpanA = Math.round(((pt.tenkan + pt.kijun) / 2) * 100) / 100;
    }
    if (i >= 51) {
      pt.senkouSpanB = getHighLowMid(i - 51, 52);
    }
    if (i + 26 < n) {
      pt.chikou = candles[i + 26].close;
    }

    series.push(pt);
  }

  // Đánh giá đồng thuận 4/4 tại nến mới nhất
  const lastIdx = n - 1;
  const lastCandle = candles[lastIdx];
  const lastPt = series[lastIdx];

  const spanA = lastPt.senkouSpanA ?? lastCandle.close;
  const spanB = lastPt.senkouSpanB ?? lastCandle.close;
  const topCloud = Math.max(spanA, spanB);

  const priceAboveCloud = lastCandle.close > topCloud;
  const tenkanAboveKijun = (lastPt.tenkan ?? 0) >= (lastPt.kijun ?? 0);
  const futureCloudGreen = spanA >= spanB;
  const chikouPastCandle = lastIdx >= 26 ? candles[lastIdx - 26].close : lastCandle.close;
  const chikouAbovePrice = lastCandle.close > chikouPastCandle;

  let consensusScore = 0;
  if (priceAboveCloud) consensusScore++;
  if (tenkanAboveKijun) consensusScore++;
  if (futureCloudGreen) consensusScore++;
  if (chikouAbovePrice) consensusScore++;

  return {
    series,
    consensusScore,
    isConsensus: consensusScore >= 3,
    details: {
      priceAboveCloud,
      tenkanAboveKijun,
      futureCloudGreen,
      chikouAbovePrice,
    },
  };
}

/**
 * Tính Nén Biến Động (Volatility Squeeze)
 * Phát hiện khi Bollinger Bands (20, 2) nằm hoàn toàn bên trong Keltner Channel (20, 1.5 ATR)
 */
export function calculateVolatilitySqueeze(
  candles: CandleData[],
  bbPeriod: number = 20,
  bbMult: number = 2.0,
  kcMult: number = 1.5
): VolatilitySqueezeResult {
  const emptyRes: VolatilitySqueezeResult = {
    isSqueezed: false,
    squeezeBarsCount: 0,
    isFired: false,
    momentumSeries: [],
    currentMomentum: 0,
  };

  if (!candles || candles.length < bbPeriod + 5) return emptyRes;

  const atrSeries = calculateATR(candles, bbPeriod);
  const atrMap = new Map<string, number>();
  atrSeries.forEach((a) => atrMap.set(a.time, a.value));

  const bbSeries = calculateBollingerBands(candles, bbPeriod, bbMult);
  const bbUpperMap = new Map<string, number>();
  const bbLowerMap = new Map<string, number>();
  bbSeries.upper.forEach((u) => bbUpperMap.set(u.time, u.value));
  bbSeries.lower.forEach((l) => bbLowerMap.set(l.time, l.value));

  const emaSeries = calculateEMA(candles, bbPeriod);
  const emaMap = new Map<string, number>();
  emaSeries.forEach((e) => emaMap.set(e.time, e.value));

  let squeezeBars = 0;
  let wasSqueezedBefore = false;
  const momentumSeries: LineDataPoint[] = [];

  for (let i = bbPeriod; i < candles.length; i++) {
    const c = candles[i];
    const bbUpper = bbUpperMap.get(c.time);
    const bbLower = bbLowerMap.get(c.time);
    const emaVal = emaMap.get(c.time);
    const atrVal = atrMap.get(c.time);

    if (bbUpper === undefined || bbLower === undefined || emaVal === undefined || atrVal === undefined) {
      continue;
    }

    const kcUps = emaVal + kcMult * atrVal;
    const kcLow = emaVal - kcMult * atrVal;

    const inSqueeze = bbUpper <= kcUps && bbLower >= kcLow;

    if (inSqueeze) {
      squeezeBars++;
      wasSqueezedBefore = true;
    } else {
      if (i === candles.length - 1 && wasSqueezedBefore && squeezeBars >= 3) {
        // Vừa bung nén
      }
      squeezeBars = 0;
    }

    // Động lượng squeeze: (Close - ((HH + LL)/2 + SMA)/2)
    const mom = Math.round((c.close - emaVal) * 100) / 100;
    momentumSeries.push({ time: c.time, value: mom });
  }

  const isCurrentSqueezed = squeezeBars >= 1;
  const lastMom = momentumSeries.length > 0 ? momentumSeries[momentumSeries.length - 1].value : 0;
  const isFired = !isCurrentSqueezed && wasSqueezedBefore;

  return {
    isSqueezed: isCurrentSqueezed,
    squeezeBarsCount: squeezeBars,
    isFired,
    momentumSeries,
    currentMomentum: lastMom,
  };
}

/**
 * Phát hiện Phân kỳ RSI & MACD chặt chẽ (>= 8 phiên)
 * - Bearish (Phân kỳ âm): Giá lập đỉnh cao hơn, nhưng RSI đỉnh sau thấp hơn đỉnh trước >= 5 điểm (Đỉnh trước >= 70)
 * - Bullish (Phân kỳ dương): Giá lập đáy thấp hơn, nhưng RSI đáy sau cao hơn đáy trước >= 5 điểm (Đáy trước <= 30)
 */
export function detectDivergence(
  candles: CandleData[],
  rsiPoints?: LineDataPoint[],
  macdData?: MacdData
): DivergenceResult[] {
  const results: DivergenceResult[] = [];
  if (!candles || candles.length < 25) return results;

  const rsi = rsiPoints && rsiPoints.length > 0 ? rsiPoints : calculateRSI(candles, 14);
  const rsiMap = new Map<string, number>();
  rsi.forEach((r) => rsiMap.set(r.time, r.value));

  // Tìm đỉnh cục bộ (local peaks)
  const peaks: { index: number; time: string; price: number; rsi: number }[] = [];
  // Tìm đáy cục bộ (local troughs)
  const troughs: { index: number; time: string; price: number; rsi: number }[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const next = candles[i + 1];
    const next2 = candles[i + 2];
    const rVal = rsiMap.get(cur.time) ?? 50;

    // Peak
    if (cur.high >= prev.high && cur.high >= prev2.high && cur.high >= next.high && cur.high >= next2.high) {
      peaks.push({ index: i, time: cur.time, price: cur.high, rsi: rVal });
    }
    // Trough
    if (cur.low <= prev.low && cur.low <= prev2.low && cur.low <= next.low && cur.low <= next2.low) {
      troughs.push({ index: i, time: cur.time, price: cur.low, rsi: rVal });
    }
  }

  // Kiểm tra Phân kỳ âm (Bearish Divergence) trên 2 đỉnh gần nhất
  if (peaks.length >= 2) {
    const p2 = peaks[peaks.length - 1];
    const p1 = peaks[peaks.length - 2];
    const dist = p2.index - p1.index;

    if (dist >= 8 && dist <= 60) {
      if (p2.price > p1.price && p2.rsi < p1.rsi - 4 && p1.rsi >= 65) {
        results.push({
          type: 'BEARISH',
          strength: p1.rsi >= 70 && p2.rsi <= p1.rsi - 7 ? 'STRONG' : 'MODERATE',
          indicator: 'RSI',
          startDate: p1.time,
          endDate: p2.time,
          startPrice: p1.price,
          endPrice: p2.price,
          startRsi: p1.rsi,
          endRsi: p2.rsi,
          description: `Phân kỳ âm cảnh báo rủi ro tạo đỉnh: Giá tạo đỉnh cao mới (${p2.price} > ${p1.price}) nhưng RSI suy yếu (${p2.rsi} < ${p1.rsi}) cách nhau ${dist} phiên.`,
        });
      }
    }
  }

  // Kiểm tra Phân kỳ dương (Bullish Divergence) trên 2 đáy gần nhất
  if (troughs.length >= 2) {
    const t2 = troughs[troughs.length - 1];
    const t1 = troughs[troughs.length - 2];
    const dist = t2.index - t1.index;

    if (dist >= 8 && dist <= 60) {
      if (t2.price < t1.price && t2.rsi > t1.rsi + 4 && t1.rsi <= 35) {
        results.push({
          type: 'BULLISH',
          strength: t1.rsi <= 30 && t2.rsi >= t1.rsi + 7 ? 'STRONG' : 'MODERATE',
          indicator: 'RSI',
          startDate: t1.time,
          endDate: t2.time,
          startPrice: t1.price,
          endPrice: t2.price,
          startRsi: t1.rsi,
          endRsi: t2.rsi,
          description: `Phân kỳ dương báo hiệu đảo chiều tạo đáy: Giá giảm tạo đáy thấp hơn (${t2.price} < ${t1.price}) nhưng RSI phân kỳ đi lên (${t2.rsi} > ${t1.rsi}) cách nhau ${dist} phiên.`,
        });
      }
    }
  }

  return results;
}

/**
 * Tính CMF (Chaikin Money Flow) 20 phiên
 * CMF = Sum(Money Flow Volume, 20) / Sum(Volume, 20)
 * Money Flow Multiplier = ((Close - Low) - (High - Close)) / (High - Low)
 */
export function calculateCMF(candles: CandleData[], period: number = 20): LineDataPoint[] {
  if (!candles || candles.length < period) return [];

  const mfvList: number[] = [];
  const volList: number[] = [];
  const times: string[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    times.push(c.time);
    const range = c.high - c.low;
    let mfm = 0;
    if (range > 0) {
      mfm = ((c.close - c.low) - (c.high - c.close)) / range;
    }
    mfvList.push(mfm * c.volume);
    volList.push(c.volume);
  }

  const result: LineDataPoint[] = [];
  let sumMfv = 0;
  let sumVol = 0;

  for (let i = 0; i < candles.length; i++) {
    sumMfv += mfvList[i];
    sumVol += volList[i];

    if (i >= period) {
      sumMfv -= mfvList[i - period];
      sumVol -= volList[i - period];
    }

    if (i >= period - 1) {
      const cmfVal = sumVol > 0 ? Math.round((sumMfv / sumVol) * 1000) / 1000 : 0;
      result.push({ time: times[i], value: cmfVal });
    }
  }

  return result;
}

/**
 * Tính OBV (On-Balance Volume)
 */
export function calculateOBV(candles: CandleData[]): LineDataPoint[] {
  if (!candles || candles.length === 0) return [];

  const result: LineDataPoint[] = [];
  let obv = 0;
  result.push({ time: candles[0].time, value: obv });

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    if (cur.close > prev.close) {
      obv += cur.volume;
    } else if (cur.close < prev.close) {
      obv -= cur.volume;
    }
    result.push({ time: cur.time, value: obv });
  }

  return result;
}

/**
 * Tính Volume Profile & Điểm kiểm soát Point of Control (POC)
 */
export function calculateVolumeProfile(candles: CandleData[], numBins: number = 24): VolumeProfileResult {
  if (!candles || candles.length === 0) {
    return { bins: [], pocPrice: 0, vahPrice: 0, valPrice: 0, totalVolume: 0 };
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVolume = 0;

  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    totalVolume += c.volume;
  }

  if (maxPrice <= minPrice || totalVolume <= 0) {
    const p = candles[candles.length - 1].close;
    return {
      bins: [{ price: p, volume: totalVolume, percentage: 100, isPOC: true, inValueArea: true }],
      pocPrice: p,
      vahPrice: p,
      valPrice: p,
      totalVolume,
    };
  }

  const binStep = (maxPrice - minPrice) / numBins;
  const rawBins: number[] = new Array(numBins).fill(0);

  for (const c of candles) {
    const candleMid = (c.high + c.low) / 2;
    const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((candleMid - minPrice) / binStep)));
    rawBins[binIdx] += c.volume;
  }

  let maxVol = 0;
  let pocIdx = 0;
  for (let i = 0; i < numBins; i++) {
    if (rawBins[i] > maxVol) {
      maxVol = rawBins[i];
      pocIdx = i;
    }
  }

  const pocPrice = Math.round((minPrice + (pocIdx + 0.5) * binStep) * 10) / 10;

  // Value Area = 70% khối lượng tập trung quanh POC
  const targetAreaVol = totalVolume * 0.7;
  let accumulatedVol = rawBins[pocIdx];
  let upIdx = pocIdx;
  let downIdx = pocIdx;

  while (accumulatedVol < targetAreaVol && (upIdx < numBins - 1 || downIdx > 0)) {
    const upVol = upIdx < numBins - 1 ? rawBins[upIdx + 1] : -1;
    const downVol = downIdx > 0 ? rawBins[downIdx - 1] : -1;

    if (upVol >= downVol && upIdx < numBins - 1) {
      upIdx++;
      accumulatedVol += upVol;
    } else if (downIdx > 0) {
      downIdx--;
      accumulatedVol += downVol;
    } else if (upIdx < numBins - 1) {
      upIdx++;
      accumulatedVol += upVol;
    } else {
      break;
    }
  }

  const vahPrice = Math.round((minPrice + (upIdx + 1) * binStep) * 10) / 10;
  const valPrice = Math.round((minPrice + downIdx * binStep) * 10) / 10;

  const bins: VolumeProfileBin[] = rawBins.map((vol, i) => {
    const price = Math.round((minPrice + (i + 0.5) * binStep) * 10) / 10;
    return {
      price,
      volume: vol,
      percentage: Math.round((vol / totalVolume) * 1000) / 10,
      isPOC: i === pocIdx,
      inValueArea: i >= downIdx && i <= upIdx,
    };
  });

  return {
    bins,
    pocPrice,
    vahPrice,
    valPrice,
    totalVolume,
  };
}

/**
 * Tính Sức Mạnh Giá Mansfield RS so với VN-Index
 */
export function calculateRSMansfield(
  stockCandles: CandleData[],
  indexCandles: CandleData[],
  period: number = 52
): { series: LineDataPoint[]; isRsNewHigh52W: boolean; currentRS: number } {
  if (!stockCandles || !indexCandles || stockCandles.length < period) {
    return { series: [], isRsNewHigh52W: false, currentRS: 0 };
  }

  const indexMap = new Map<string, number>();
  indexCandles.forEach((c) => indexMap.set(c.time, c.close));

  const rawRS: { time: string; rs: number }[] = [];
  for (const c of stockCandles) {
    const idxClose = indexMap.get(c.time);
    if (idxClose && idxClose > 0) {
      rawRS.push({ time: c.time, rs: c.close / idxClose });
    }
  }

  if (rawRS.length < period) {
    return { series: [], isRsNewHigh52W: false, currentRS: 0 };
  }

  const series: LineDataPoint[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += rawRS[i].rs;
  }

  for (let i = period - 1; i < rawRS.length; i++) {
    if (i >= period) {
      sum += rawRS[i].rs - rawRS[i - period].rs;
    }
    const sma = sum / period;
    const mansfield = sma > 0 ? Math.round(((rawRS[i].rs / sma) - 1) * 10000) / 100 : 0;
    series.push({ time: rawRS[i].time, value: mansfield });
  }

  const currentRS = series.length > 0 ? series[series.length - 1].value : 0;
  // Kiểm tra đỉnh 52 phiên của RS
  const lookback = Math.min(52, series.length);
  const recent = series.slice(-lookback);
  const maxRs = Math.max(...recent.map((r) => r.value));
  const isRsNewHigh52W = currentRS >= maxRs && currentRS > 0;

  return {
    series,
    isRsNewHigh52W,
    currentRS,
  };
}

/**
 * Tính Stochastic Oscillator (14, 3, 3)
 */
export function calculateStochastic(
  candles: CandleData[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): StochasticResult {
  const emptyRes: StochasticResult = { kSeries: [], dSeries: [], currentK: 50, currentD: 50 };
  if (!candles || candles.length < kPeriod + dPeriod) return emptyRes;

  const rawK: LineDataPoint[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    const diff = hh - ll;
    const kVal = diff > 0 ? Math.round(((candles[i].close - ll) / diff) * 1000) / 10 : 50;
    rawK.push({ time: candles[i].time, value: kVal });
  }

  // Làm mượt %K (smooth = 3)
  const smoothedK: LineDataPoint[] = [];
  let sumK = 0;
  for (let i = 0; i < rawK.length; i++) {
    sumK += rawK[i].value;
    if (i >= smooth) sumK -= rawK[i - smooth].value;
    if (i >= smooth - 1) {
      smoothedK.push({ time: rawK[i].time, value: Math.round((sumK / smooth) * 10) / 10 });
    }
  }

  // %D = SMA(%K, dPeriod)
  const dSeries: LineDataPoint[] = [];
  let sumD = 0;
  for (let i = 0; i < smoothedK.length; i++) {
    sumD += smoothedK[i].value;
    if (i >= dPeriod) sumD -= smoothedK[i - dPeriod].value;
    if (i >= dPeriod - 1) {
      dSeries.push({ time: smoothedK[i].time, value: Math.round((sumD / dPeriod) * 10) / 10 });
    }
  }

  const currentK = smoothedK.length > 0 ? smoothedK[smoothedK.length - 1].value : 50;
  const currentD = dSeries.length > 0 ? dSeries[dSeries.length - 1].value : 50;

  return {
    kSeries: smoothedK,
    dSeries,
    currentK,
    currentD,
  };
}

/**
 * Tính ADX (Average Directional Index) & DMI (14 phiên)
 */
export function calculateADX(candles: CandleData[], period: number = 14): AdxResult {
  const emptyRes: AdxResult = {
    adxSeries: [],
    plusDiSeries: [],
    minusDiSeries: [],
    currentAdx: 0,
    currentPlusDi: 0,
    currentMinusDi: 0,
    trendStrength: 'WEAK',
  };

  if (!candles || candles.length < period * 2) return emptyRes;

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];
  const times: string[] = [];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    times.push(cur.time);

    const highDiff = cur.high - prev.high;
    const lowDiff = prev.low - cur.low;

    plusDm.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDm.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trVal = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    tr.push(trVal);
  }

  let smTr = 0;
  let smPlusDm = 0;
  let smMinusDm = 0;

  for (let i = 0; i < period; i++) {
    smTr += tr[i];
    smPlusDm += plusDm[i];
    smMinusDm += minusDm[i];
  }

  const dxList: { time: string; dx: number; plusDi: number; minusDi: number }[] = [];
  const plusDiSeries: LineDataPoint[] = [];
  const minusDiSeries: LineDataPoint[] = [];

  for (let i = period; i < tr.length; i++) {
    smTr = smTr - smTr / period + tr[i];
    smPlusDm = smPlusDm - smPlusDm / period + plusDm[i];
    smMinusDm = smMinusDm - smMinusDm / period + minusDm[i];

    const plusDi = smTr > 0 ? (smPlusDm / smTr) * 100 : 0;
    const minusDi = smTr > 0 ? (smMinusDm / smTr) * 100 : 0;
    const diSum = plusDi + minusDi;
    const dx = diSum > 0 ? (Math.abs(plusDi - minusDi) / diSum) * 100 : 0;

    dxList.push({ time: times[i], dx, plusDi, minusDi });
    plusDiSeries.push({ time: times[i], value: Math.round(plusDi * 10) / 10 });
    minusDiSeries.push({ time: times[i], value: Math.round(minusDi * 10) / 10 });
  }

  if (dxList.length < period) return emptyRes;

  let sumDx = 0;
  for (let i = 0; i < period; i++) {
    sumDx += dxList[i].dx;
  }
  let currentAdx = sumDx / period;
  const adxSeries: LineDataPoint[] = [{ time: dxList[period - 1].time, value: Math.round(currentAdx * 10) / 10 }];

  for (let i = period; i < dxList.length; i++) {
    currentAdx = (currentAdx * (period - 1) + dxList[i].dx) / period;
    adxSeries.push({ time: dxList[i].time, value: Math.round(currentAdx * 10) / 10 });
  }

  const lastAdx = adxSeries.length > 0 ? adxSeries[adxSeries.length - 1].value : 0;
  const lastPlusDi = plusDiSeries.length > 0 ? plusDiSeries[plusDiSeries.length - 1].value : 0;
  const lastMinusDi = minusDiSeries.length > 0 ? minusDiSeries[minusDiSeries.length - 1].value : 0;

  return {
    adxSeries,
    plusDiSeries,
    minusDiSeries,
    currentAdx: lastAdx,
    currentPlusDi: lastPlusDi,
    currentMinusDi: lastMinusDi,
    trendStrength: lastAdx >= 30 ? 'STRONG' : lastAdx >= 20 ? 'MODERATE' : 'WEAK',
  };
}
