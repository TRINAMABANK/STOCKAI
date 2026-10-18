import { Exchange } from '@/types';
import { Candle, calculateRSI, calculateSMA, calculateATR } from './t3-engine';
import { DataQualityReport } from './market-data/types';

export type ShortTermTradeStatus = 
  | 'BUY_CONFIRMED'  // Cơ hội mua cần xác nhận
  | 'WATCHLIST'      // Chờ theo dõi
  | 'UNSUITABLE';    // Không phù hợp / Rủi ro cao

export interface ScoreBreakdown {
  trendScore: number;       // Tối đa 25 điểm: EMA20, EMA50, cấu trúc đỉnh đáy
  momentumScore: number;    // Tối đa 20 điểm: RSI, MACD, sức mạnh tương quan
  liquidityScore: number;   // Tối đa 15 điểm: Giá trị giao dịch trung bình
  volumeScore: number;      // Tối đa 15 điểm: Khối lượng bứt phá, không xả hàng
  entryRiskRewardScore: number; // Tối đa 15 điểm: Vị thế vào, tỷ lệ R:R >= 1.5
  newsRiskScore: number;    // Tối đa 10 điểm: Tin tức, sự kiện và quản trị rủi ro
  totalScore: number;       // Thang 100 điểm
}

export interface ShortTermSignal {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  currentPrice: number;     // VNĐ
  status: ShortTermTradeStatus;
  statusLabel: 'Cơ hội mua cần xác nhận' | 'Chờ theo dõi' | 'Không phù hợp';
  score: ScoreBreakdown;
  holdingPeriod: string;    // '5 - 10 phiên giao dịch'
  buyZone: string;          // Vùng mua tham khảo (VNĐ hoặc k-VNĐ)
  buyZoneLow: number;
  buyZoneHigh: number;
  targetPrice1: number;     // Mục tiêu 1
  targetPrice2: number;     // Mục tiêu 2
  stopLoss: number;         // Cắt lỗ dứt khoát
  stopLossPercent: number;  // % rủi ro cắt lỗ
  rewardRiskRatio: number;  // Tỷ lệ R:R
  invalidationCondition: string; // Điều kiện vô hiệu hóa
  rationale: string;        // Lý do phát sinh cơ hội
  riskFactors: string[];    // Các yếu tố rủi ro cần lưu ý
  liquidityTier: 'Rất cao (>50 tỷ)' | 'Cao (20-50 tỷ)' | 'Trung bình (5-20 tỷ)' | 'Thấp (<5 tỷ)';
  averageDailyValue: number;// Giá trị giao dịch trung bình 20 phiên (VNĐ)
  isExcluded: boolean;      // Bị loại bởi bộ lọc loại trừ bắt buộc
  exclusionReason?: string; // Lý do loại trừ
  updatedAt: string;
  dataQuality?: DataQualityReport;
}

/**
 * Tính toán EMA (Exponential Moving Average)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const nextEma = values[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(Number(nextEma.toFixed(2)));
  }

  return emaArray;
}

/**
 * Tính toán MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[]): { macdLine: number; signalLine: number; histogram: number } {
  if (closes.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const macdSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdSeries.push(ema12[i] - ema26[i]);
  }

  const signalSeries = calculateEMA(macdSeries, 9);

  const lastMacd = macdSeries[macdSeries.length - 1];
  const lastSignal = signalSeries[signalSeries.length - 1];
  const histogram = lastMacd - lastSignal;

  return {
    macdLine: Number(lastMacd.toFixed(2)),
    signalLine: Number(lastSignal.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
  };
}

/**
 * ĐỘNG CƠ ĐỊNH LƯỢNG STOCKAI PHÂN TÍCH VÀ XẾP HẠNG GIAO DỊCH NGẮN HẠN 5–10 PHIÊN
 * Áp dụng đúng 6 nhóm tiêu chí với tổng điểm 100 và bộ lọc loại trừ bắt buộc (Exclusion Gates)
 */
export function analyzeShortTermOpportunity(
  symbol: string,
  companyName: string,
  exchange: Exchange,
  candles: Candle[],
  qualityReport?: DataQualityReport,
  newsScoreMultiplier = 1.0
): ShortTermSignal {
  const nowStr = new Date().toISOString();

  // BỘ LỌC LOẠI TRỪ 1: Dữ liệu nến không đủ tối thiểu 30 phiên
  if (!candles || candles.length < 30) {
    return createEmptySignal(
      symbol, companyName, exchange, nowStr,
      'UNSUITABLE', 'Không phù hợp',
      true, 'Không đủ dữ liệu lịch sử tối thiểu (cần >= 30 nến ngày)',
      qualityReport
    );
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const currentCandle = candles[candles.length - 1];
  const currentPrice = currentCandle.close;

  // Tính các chỉ báo kỹ thuật cơ bản
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const currentEma20 = ema20Series[ema20Series.length - 1];
  const currentEma50 = ema50Series[ema50Series.length - 1];
  const prevEma20 = ema20Series[ema20Series.length - 2];

  const rsi = calculateRSI(closes, 14);
  const { macdLine, signalLine, histogram } = calculateMACD(closes);
  const ma20Vol = calculateSMA(volumes, 20);
  const atr = calculateATR(candles, 14);

  // Giá trị giao dịch trung bình 20 phiên
  const avgDailyValue = ma20Vol * currentPrice;

  // BỘ LỌC LOẠI TRỪ 2: Thanh khoản quá thấp (< 3 tỷ VNĐ/phiên)
  if (avgDailyValue < 3000000000) {
    return createEmptySignal(
      symbol, companyName, exchange, nowStr,
      'UNSUITABLE', 'Không phù hợp',
      true, `Thanh khoản quá thấp (${(avgDailyValue / 1000000000).toFixed(1)} tỷ/phiên < 3 tỷ). Rủi ro kẹp vốn khi cắt lỗ.`,
      qualityReport, currentPrice, avgDailyValue
    );
  }

  // BỘ LỌC LOẠI TRỪ 3: Dữ liệu bị lỗi logic OHLC từ bộ kiểm định chất lượng
  if (qualityReport && qualityReport.status === 'CORRUPTED') {
    return createEmptySignal(
      symbol, companyName, exchange, nowStr,
      'UNSUITABLE', 'Không phù hợp',
      true, 'Dữ liệu nến bị lỗi toàn vẹn OHLC. Bị từ chối bởi Quality Checker.',
      qualityReport, currentPrice, avgDailyValue
    );
  }

  // BỘ LỌC LOẠI TRỪ 4: Quá mua cực độ (RSI > 75) - Tránh mua đuổi tại đỉnh
  if (rsi > 75) {
    return createEmptySignal(
      symbol, companyName, exchange, nowStr,
      'UNSUITABLE', 'Không phù hợp',
      true, `Chỉ báo RSI đang ở vùng quá mua cực độ (${rsi} > 75). Rủi ro điều chỉnh T+ rất cao.`,
      qualityReport, currentPrice, avgDailyValue
    );
  }

  // ==========================================
  // CHẤM ĐIỂM THEO 6 TRỌNG SỐ THIẾT KẾ (TỔNG 100 ĐIỂM)
  // ==========================================

  // 1. Xu hướng giá (Tối đa 25 điểm)
  let trendScore = 0;
  if (currentPrice > currentEma20 && currentEma20 > currentEma50) {
    trendScore += 18; // Xu hướng tăng đồng thuận ngắn và trung hạn
  } else if (currentPrice > currentEma20) {
    trendScore += 12; // Tạm thời nằm trên EMA20
  } else if (currentPrice > currentEma50) {
    trendScore += 8;
  }
  // Độ dốc EMA20 dương
  if (currentEma20 > prevEma20) {
    trendScore += 4;
  }
  // Nến hiện tại đóng cửa trên giá mở cửa (nến xanh)
  if (currentCandle.close >= currentCandle.open) {
    trendScore += 3;
  }
  trendScore = Math.min(25, trendScore);

  // 2. Động lượng (Tối đa 20 điểm)
  let momentumScore = 0;
  // RSI vùng tối ưu cho điểm bùng nổ T+ (52 - 68)
  if (rsi >= 55 && rsi <= 68) {
    momentumScore += 10;
  } else if (rsi >= 48 && rsi < 55) {
    momentumScore += 7;
  } else if (rsi > 68 && rsi <= 75) {
    momentumScore += 5;
  } else {
    momentumScore += 2;
  }
  // MACD Histogram dương và dốc lên
  if (histogram > 0 && macdLine > signalLine) {
    momentumScore += 10;
  } else if (histogram > 0) {
    momentumScore += 6;
  } else if (macdLine > signalLine) {
    momentumScore += 4;
  }
  momentumScore = Math.min(20, momentumScore);

  // 3. Thanh khoản (Tối đa 15 điểm)
  let liquidityScore = 0;
  if (avgDailyValue >= 50000000000) {
    liquidityScore = 15; // Rất cao (>50 tỷ/phiên)
  } else if (avgDailyValue >= 20000000000) {
    liquidityScore = 12; // Cao (20-50 tỷ/phiên)
  } else if (avgDailyValue >= 10000000000) {
    liquidityScore = 9;  // Khá (10-20 tỷ/phiên)
  } else if (avgDailyValue >= 5000000000) {
    liquidityScore = 6;  // Trung bình (5-10 tỷ)
  } else {
    liquidityScore = 3;
  }

  // 4. Khối lượng (Tối đa 15 điểm)
  let volumeScore = 0;
  const volSurgeRatio = currentCandle.volume / Math.max(1, ma20Vol);
  if (volSurgeRatio >= 1.5) {
    volumeScore += 12; // Khối lượng bùng nổ trên 150% MA20
  } else if (volSurgeRatio >= 1.2) {
    volumeScore += 8;
  } else if (volSurgeRatio >= 0.9) {
    volumeScore += 5;
  } else {
    volumeScore += 2;
  }
  // Kiểm tra không có nến bán xả lớn gần đây
  const prevCandle = candles[candles.length - 2];
  if (!(prevCandle.close < prevCandle.open && prevCandle.volume > ma20Vol * 2)) {
    volumeScore += 3;
  }
  volumeScore = Math.min(15, volumeScore);

  // 5. Điểm vào và Tỷ lệ Lợi nhuận / Rủi ro (Tối đa 15 điểm)
  // Tính toán vùng mua, cắt lỗ và mục tiêu 5-10 phiên
  const stopLossDistance = Math.max(atr * 1.5, currentPrice * 0.038); // Cắt lỗ 3.8% - 5%
  const stopLossPrice = Math.round(currentPrice - stopLossDistance);
  const stopLossPercent = Number(((stopLossPrice - currentPrice) / currentPrice * 100).toFixed(1));

  const target1Distance = stopLossDistance * 1.8; // R:R 1.8 cho Target 1
  const targetPrice1 = Math.round(currentPrice + target1Distance);
  const targetPrice2 = Math.round(currentPrice + stopLossDistance * 2.6); // R:R 2.6 cho Target 2

  const potentialGain = targetPrice1 - currentPrice;
  const potentialLoss = currentPrice - stopLossPrice;
  const rewardRiskRatio = potentialLoss > 0 ? Number((potentialGain / potentialLoss).toFixed(2)) : 1.5;

  let entryRiskRewardScore = 0;
  if (rewardRiskRatio >= 2.0) {
    entryRiskRewardScore += 10;
  } else if (rewardRiskRatio >= 1.6) {
    entryRiskRewardScore += 7;
  } else if (rewardRiskRatio >= 1.5) {
    entryRiskRewardScore += 5;
  }

  // Khoảng cách tới hỗ trợ EMA20 hợp lý (trong biên độ 2.5% so với EMA20)
  const distToEma20 = Math.abs(currentPrice - currentEma20) / currentEma20;
  if (distToEma20 <= 0.025) {
    entryRiskRewardScore += 5; // Điểm vào sát hỗ trợ, an toàn
  } else if (distToEma20 <= 0.04) {
    entryRiskRewardScore += 3;
  }
  entryRiskRewardScore = Math.min(15, entryRiskRewardScore);

  // BỘ LỌC LOẠI TRỪ 5: R:R < 1.5 -> Loại ngay lập tức
  if (rewardRiskRatio < 1.5) {
    return createEmptySignal(
      symbol, companyName, exchange, nowStr,
      'UNSUITABLE', 'Không phù hợp',
      true, `Tỷ lệ Lợi nhuận/Rủi ro (${rewardRiskRatio} : 1) không đạt chuẩn tối thiểu 1.5 : 1.`,
      qualityReport, currentPrice, avgDailyValue
    );
  }

  // 6. Tin tức, sự kiện và rủi ro (Tối đa 10 điểm)
  let newsRiskScore = Math.round(8 * newsScoreMultiplier);
  // Không có cảnh báo stale dữ liệu
  if (!qualityReport?.isStale) {
    newsRiskScore += 2;
  }
  newsRiskScore = Math.min(10, Math.max(0, newsRiskScore));

  // TỔNG ĐIỂM
  const totalScore = trendScore + momentumScore + liquidityScore + volumeScore + entryRiskRewardScore + newsRiskScore;

  const scoreBreakdown: ScoreBreakdown = {
    trendScore,
    momentumScore,
    liquidityScore,
    volumeScore,
    entryRiskRewardScore,
    newsRiskScore,
    totalScore,
  };

  // PHÂN LOẠI 3 TRẠNG THÁI THEO YÊU CẦU:
  // - >= 75 điểm: Cơ hội mua cần xác nhận
  // - 55 - 74 điểm: Chờ theo dõi
  // - < 55 điểm: Không phù hợp
  let status: ShortTermTradeStatus = 'UNSUITABLE';
  let statusLabel: 'Cơ hội mua cần xác nhận' | 'Chờ theo dõi' | 'Không phù hợp' = 'Không phù hợp';

  if (totalScore >= 75) {
    status = 'BUY_CONFIRMED';
    statusLabel = 'Cơ hội mua cần xác nhận';
  } else if (totalScore >= 55) {
    status = 'WATCHLIST';
    statusLabel = 'Chờ theo dõi';
  } else {
    status = 'UNSUITABLE';
    statusLabel = 'Không phù hợp';
  }

  // Xác định thanh khoản hiển thị
  let liquidityTier: 'Rất cao (>50 tỷ)' | 'Cao (20-50 tỷ)' | 'Trung bình (5-20 tỷ)' | 'Thấp (<5 tỷ)' = 'Trung bình (5-20 tỷ)';
  if (avgDailyValue >= 50000000000) liquidityTier = 'Rất cao (>50 tỷ)';
  else if (avgDailyValue >= 20000000000) liquidityTier = 'Cao (20-50 tỷ)';
  else if (avgDailyValue >= 5000000000) liquidityTier = 'Trung bình (5-20 tỷ)';
  else liquidityTier = 'Thấp (<5 tỷ)';

  const buyLow = Math.round(currentPrice * 0.985);
  const buyHigh = Math.round(currentPrice * 1.005);
  const buyZone = `${(buyLow / 1000).toFixed(1)} - ${(buyHigh / 1000).toFixed(1)}`;

  const invalidationCondition = `Đóng nến phiên ngày dưới ${(stopLossPrice / 1000).toFixed(1)} đ hoặc gãy đường hỗ trợ EMA20 với khối lượng bán tăng đột biến.`;

  const rationale = `Tổng điểm định lượng đạt ${totalScore}/100. Xu hướng giá nằm trên EMA20 (${trendScore}/25đ), động lượng RSI ${rsi} kèm MACD histogram dương (${momentumScore}/20đ). Khối lượng đạt ${volSurgeRatio.toFixed(1)}x TB20 phiên (${volumeScore}/15đ). Tỷ lệ R:R dự kiến ${rewardRiskRatio} : 1.`;

  const riskFactors = [
    `Mức độ biến động trung bình phiên (ATR): ${Math.round(atr)} đ (${((atr / currentPrice) * 100).toFixed(1)}%).`,
    `Ngưỡng cắt lỗ tối đa cho phép: ${stopLossPercent}%.`,
    `Tác động từ nhịp biến động chung của chỉ số VN-Index trong 5–10 phiên tới.`,
  ];

  if (qualityReport?.isDemo) {
    riskFactors.unshift('⚠️ ĐANG DÙNG DỮ LIỆU DEMO MÔ PHỎNG. KHÔNG SỬ DỤNG ĐỂ ĐẶT LỆNH THẬT!');
  }

  return {
    symbol,
    companyName,
    exchange,
    currentPrice,
    status,
    statusLabel,
    score: scoreBreakdown,
    holdingPeriod: '5 - 10 phiên giao dịch',
    buyZone,
    buyZoneLow: buyLow,
    buyZoneHigh: buyHigh,
    targetPrice1,
    targetPrice2,
    stopLoss: stopLossPrice,
    stopLossPercent,
    rewardRiskRatio,
    invalidationCondition,
    rationale,
    riskFactors,
    liquidityTier,
    averageDailyValue: avgDailyValue,
    isExcluded: false,
    updatedAt: nowStr,
    dataQuality: qualityReport,
  };
}

function createEmptySignal(
  symbol: string,
  companyName: string,
  exchange: Exchange,
  nowStr: string,
  status: ShortTermTradeStatus,
  statusLabel: 'Cơ hội mua cần xác nhận' | 'Chờ theo dõi' | 'Không phù hợp',
  isExcluded: boolean,
  exclusionReason: string,
  qualityReport?: DataQualityReport,
  currentPrice: number = 0,
  averageDailyValue: number = 0
): ShortTermSignal {
  return {
    symbol,
    companyName,
    exchange,
    currentPrice,
    status,
    statusLabel,
    score: {
      trendScore: 0,
      momentumScore: 0,
      liquidityScore: 0,
      volumeScore: 0,
      entryRiskRewardScore: 0,
      newsRiskScore: 0,
      totalScore: 0,
    },
    holdingPeriod: '5 - 10 phiên giao dịch',
    buyZone: 'Không xác định',
    buyZoneLow: 0,
    buyZoneHigh: 0,
    targetPrice1: 0,
    targetPrice2: 0,
    stopLoss: 0,
    stopLossPercent: 0,
    rewardRiskRatio: 0,
    invalidationCondition: exclusionReason,
    rationale: `Mã ${symbol} bị loại trừ khỏi danh sách giao dịch: ${exclusionReason}`,
    riskFactors: [exclusionReason],
    liquidityTier: 'Thấp (<5 tỷ)',
    averageDailyValue,
    isExcluded,
    exclusionReason,
    updatedAt: nowStr,
    dataQuality: qualityReport,
  };
}
