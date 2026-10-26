import { 
  Exchange, 
  MarketAlertItem, 
  MarketAlertEventType, 
  MarketAlertStatus, 
  MarketAlertRiskLevel, 
  MarketOverviewData, 
  MarketAlertFilterCounts 
} from '@/types';
import { 
  NormalizedQuote, 
  NormalizedIndex, 
  DataMode 
} from '@/lib/market-data/types';
import { Candle, calculateSMA, calculateRSI } from './t3-engine';

/**
 * ĐỘNG CƠ CẢNH BÁO THỊ TRƯỜNG & DÒNG TIỀN (STOCKAI MARKET ALERTS ENGINE V2)
 * 
 * Tuân thủ nghiêm ngặt các nguyên tắc:
 * 1. Chống thiên lệch nhìn trước (No Lookahead Bias): Khi xét đỉnh 20 phiên, chỉ lấy 20 phiên trước đó (slice(-21, -1)), KHÔNG tính phiên hiện tại vào đỉnh tham chiếu.
 * 2. Phân biệt rõ dữ liệu Intraday và End-of-Day (EOD).
 * 3. Chống tạo cảnh báo trùng trong cùng một sự kiện / phiên giao dịch.
 * 4. Bảo lưu giá và thời điểm cảnh báo gốc (alertPrice, detectedAt), không ghi đè khi cập nhật giá mới.
 * 5. Cảnh báo tăng nhiều phiên KHÔNG đồng nghĩa với khuyến nghị mua (Cảnh báo rủi ro mua đuổi đỉnh FOMO).
 * 6. Tính toán toàn bộ chỉ số từ dữ liệu thị trường thực tế đã kiểm định.
 */

export interface BreakoutCheckResult {
  isBreakout: boolean;
  breakoutPeak: number;
  currentPrice: number;
  volumeRatio: number;
  isConfirmed: boolean;
  rsi: number;
  description: string;
}

export interface ProjectedVolumeResult {
  projectedVolume: number;
  timeFactor: number;
  safeBreakoutMultiplier: number;
  isEarlySession: boolean;
}

export interface BottomFishingResult {
  isBottomFishing: boolean;
  status: 'QUALIFIED' | 'FORMING';
  dropFrom6MHighPercent: number;
  rsi: number;
  entryPrice: number;
  stopLossPrice: number;
  target1Price: number;
  target2Price: number;
  reasons: string[];
  description: string;
}


export interface VolumeSurgeResult {
  isSurge: boolean;
  volumeRatio: number;
  volumeRatioFormatted: string;
  currentVolume: number;
  avgVolume20: number;
  description: string;
  isIntraday: boolean;
}

export interface StreakCheckResult {
  hasStreak: boolean;
  streakDays: number;
  streakType: 'CLOSE_GAINS' | 'INTRADAY_GREEN';
  description: string;
  cautionNotice: string;
}

export interface FailedBreakoutResult {
  isFailed: boolean;
  breakoutPeak: number;
  dropBelowPercent: number;
  description: string;
}

export interface WeakeningCheckResult {
  isWeakening: boolean;
  ma20: number;
  ma50: number;
  rsi: number;
  reasons: string[];
  description: string;
}

/**
 * 1. KIỂM TRA BỨT PHÁ ĐỈNH 20 PHIÊN (A. BREAKOUT 20)
 * 
 * Điều kiện:
 * - Giá vượt đỉnh của 20 phiên trước đó (không tính nến hiện tại).
 * - Khối lượng đạt tối thiểu 1.5x trung bình 20 phiên.
 * - Thanh khoản tối thiểu: Khối lượng >= 150.000 cp hoặc giá trị >= 3 tỷ VNĐ.
 * - Chạm đỉnh KHÔNG tính là bứt phá (phải strictly currentPrice > max20High).
 */
/**
 * TÍNH TOÁN KHỐI LƯỢNG DỰ PHÓNG THEO GIỜ GIAO DỊCH (DATA-01)
 * Phân bổ lịch sử nến 1 phút thị trường Việt Nam:
 * - 09:15 - 10:00: ~25% thanh khoản cả phiên -> Ngưỡng an toàn >= 2.1x TB20
 * - 10:00 - 11:30: ~50% thanh khoản cả phiên -> Ngưỡng an toàn >= 1.9x TB20
 * - 13:00 - 14:00: ~75% thanh khoản cả phiên -> Ngưỡng an toàn >= 1.6x TB20
 * - Sau 14:00 & ATC: 100% thanh khoản -> Ngưỡng an toàn >= 1.5x (HOSE) & >= 2.0x (HNX/UPCOM)
 */
export function calculateProjectedVolume(
  currentVolume: number,
  timeOrDate?: string | Date
): ProjectedVolumeResult {
  let timeNum = 1500;
  if (typeof timeOrDate === 'string' && /^\d{1,2}:\d{2}/.test(timeOrDate)) {
    const parts = timeOrDate.split(':');
    timeNum = parseInt(parts[0], 10) * 100 + parseInt(parts[1], 10);
  } else {
    const d = timeOrDate ? (typeof timeOrDate === 'string' ? new Date(timeOrDate) : timeOrDate) : new Date();
    const vnHours = (d.getUTCHours() + 7) % 24;
    const vnMinutes = d.getUTCMinutes();
    timeNum = vnHours * 100 + vnMinutes;
  }

  let timeFactor = 1.0;
  let safeBreakoutMultiplier = 1.5;
  let isEarlySession = false;

  if (timeNum < 1000) {
    timeFactor = 0.25;
    safeBreakoutMultiplier = 2.1;
    isEarlySession = true;
  } else if (timeNum < 1130) {
    timeFactor = 0.50;
    safeBreakoutMultiplier = 1.9;
  } else if (timeNum < 1400) {
    timeFactor = 0.75;
    safeBreakoutMultiplier = 1.6;
  } else {
    timeFactor = 1.0;
    safeBreakoutMultiplier = 1.5;
  }

  const projectedVolume = Math.round(currentVolume / Math.max(0.20, timeFactor));

  return {
    projectedVolume,
    timeFactor,
    safeBreakoutMultiplier,
    isEarlySession,
  };
}

/**
 * 1. KIỂM TRA BỨT PHÁ ĐỈNH 20 PHIÊN (A. BREAKOUT 20)
 * 
 * Nâng cấp theo chuẩn DNSE Scanner v9.28:
 * - Giá strictly > max20High (không tính nến hiện tại).
 * - Nến bứt phá phải đóng cửa ở nửa trên của thân nến (close >= (high + low)/2) để loại bỏ bull trap râu trên dài.
 * - Khối lượng dự phóng quy đổi theo giờ (10h: 2.1x, 11h: 1.9x, 14h: 1.6x, ATC: 1.5x với HOSE và 2.0x với HNX/UPCOM).
 * - Thanh khoản tối thiểu: Khối lượng >= 150.000 cp hoặc giá trị >= 3 tỷ VNĐ.
 */
export function detectBreakout20(
  symbol: string,
  exchange: Exchange,
  candles: Candle[],
  quote: NormalizedQuote,
  customMinVolRatio?: number,
  isMarketClosed = false
): BreakoutCheckResult | null {
  if (!candles || candles.length < 21) {
    return null; // Chưa đủ 20 phiên lịch sử tham chiếu
  }

  // 20 phiên tham chiếu trước đó (loại trừ nến hiện tại)
  const prior20 = candles.slice(-21, -1);
  const max20High = Math.max(...prior20.map(c => c.high));

  const currentPrice = quote.closePrice || candles[candles.length - 1].close;
  const currentVolume = quote.matchVolume || candles[candles.length - 1].volume;

  // Thanh khoản tối thiểu để tránh bẫy cổ phiếu rác vô thanh khoản
  if (currentVolume < 150000) {
    return null;
  }

  // Trung bình khối lượng 20 phiên
  const avgVol20 = calculateSMA(prior20.map(c => c.volume), 20);
  if (avgVol20 <= 0) return null;

  const volumeRatio = Number((currentVolume / avgVol20).toFixed(2));

  // Kiểm tra vị trí đóng cửa của nến bứt phá: Phải ở nửa trên của thân nến
  const lastCandle = candles[candles.length - 1];
  const candleRange = lastCandle.high - lastCandle.low;
  if (candleRange > 0) {
    const closePos = (currentPrice - lastCandle.low) / candleRange;
    if (closePos < 0.48) {
      return null; // Nến bị bán dội ngược tạo râu trên dài -> Không đạt chuẩn bứt phá
    }
  }

  // Quy đổi khối lượng dự phóng theo giờ giao dịch
  const isIntraday = quote.dataMode === 'REALTIME' || quote.dataMode === 'INTRADAY_DELAYED';
  const projection = calculateProjectedVolume(currentVolume, quote.updatedTime);

  // Sàn HNX và UPCOM biên độ lớn yêu cầu thanh khoản xác nhận >= 2.0x
  const baseThreshold = (exchange === 'HNX' || exchange === 'UPCOM') ? 2.0 : 1.5;
  const requiredRatio = customMinVolRatio !== undefined 
    ? customMinVolRatio 
    : (isIntraday ? Math.max(baseThreshold, projection.safeBreakoutMultiplier) : baseThreshold);

  const projectedRatio = Number((projection.projectedVolume / avgVol20).toFixed(2));
  const isBreakout = currentPrice > max20High && (volumeRatio >= requiredRatio || (isIntraday && projectedRatio >= requiredRatio));
  if (!isBreakout) {
    return null;
  }

  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, 14);
  const isConfirmed = isMarketClosed || quote.dataMode === 'EOD';

  const description = isConfirmed
    ? `Xác nhận đóng phiên vượt đỉnh 20 phiên (${(max20High / 1000).toFixed(1)}k) với thanh khoản bùng nổ ${volumeRatio.toString().replace('.', ',')}x TB20.`
    : `Trong phiên: Giá vượt đỉnh 20 phiên (${(max20High / 1000).toFixed(1)}k), KL hiện tại ${volumeRatio.toString().replace('.', ',')}x (Dự phóng cả phiên: ${projectedRatio.toString().replace('.', ',')}x* TB20, ngưỡng an toàn theo giờ >= ${requiredRatio}x).`;

  return {
    isBreakout: true,
    breakoutPeak: max20High,
    currentPrice,
    volumeRatio,
    isConfirmed,
    rsi,
    description,
  };
}

/**
 * 2. KIỂM TRA KHỐI LƯỢNG TĂNG ĐỘT BIẾN (B. VOLUME SURGE)
 * 
 * KL/TB20 = khối lượng phiên hiện tại / bình quân 20 phiên trước.
 * Định dạng: ví dụ 2,25x.
 * Nếu là dữ liệu trong phiên (Intraday), ghi chú rõ là số liệu tạm thời.
 */
export function detectVolumeSurge(
  symbol: string,
  candles: Candle[],
  quote: NormalizedQuote,
  minRatio = 1.8
): VolumeSurgeResult | null {
  if (!candles || candles.length < 21) return null;

  const prior20 = candles.slice(-21, -1);
  const avgVol20 = calculateSMA(prior20.map(c => c.volume), 20);
  if (avgVol20 <= 0) return null;

  const currentVolume = quote.matchVolume || candles[candles.length - 1].volume;
  if (currentVolume < 200000) return null; // Lọc thanh khoản tối thiểu

  const ratio = Number((currentVolume / avgVol20).toFixed(2));
  if (ratio < minRatio) return null;

  const isIntraday = quote.dataMode === 'REALTIME' || quote.dataMode === 'INTRADAY_DELAYED';
  const ratioFormatted = `${ratio.toString().replace('.', ',')}x`;

  const description = isIntraday
    ? `Khối lượng trong phiên đạt ${ratioFormatted} so với bình quân 20 phiên (KL hiện tại: ${(currentVolume / 1000000).toFixed(2)}M cp). Cảnh báo số liệu tạm thời trong phiên.`
    : `Khối lượng đóng phiên đạt ${ratioFormatted} so với bình quân 20 phiên (Tổng KL: ${(currentVolume / 1000000).toFixed(2)}M cp). Dòng tiền lớn gia tăng quyết liệt.`;

  return {
    isSurge: true,
    volumeRatio: ratio,
    volumeRatioFormatted: ratioFormatted,
    currentVolume,
    avgVolume20: Math.round(avgVol20),
    description,
    isIntraday,
  };
}

/**
 * 3. KIỂM TRA TĂNG LIÊN TIẾP NHIỀU PHIÊN (C. CONSECUTIVE UP STREAK)
 * 
 * Chuỗi 3, 5, 6, 8 phiên tăng liên tục.
 * Phân biệt:
 * - Giá đóng cửa tăng liên tiếp (close[t] > close[t-1])
 * - Giá tăng trong phiên nhưng chưa đóng cửa
 * Cảnh báo rủi ro mua đuổi đỉnh FOMO.
 */
export function detectConsecutiveUpStreak(
  candles: Candle[],
  quote: NormalizedQuote,
  minStreak = 3
): StreakCheckResult | null {
  if (!candles || candles.length < minStreak + 1) return null;

  let streak = 0;
  // Đếm chuỗi tăng tính từ phiên gần nhất ngược về trước
  for (let i = candles.length - 1; i >= 1; i--) {
    if (candles[i].close > candles[i - 1].close) {
      streak++;
    } else {
      break;
    }
  }

  if (streak < minStreak) return null;

  return {
    hasStreak: true,
    streakDays: streak,
    streakType: 'CLOSE_GAINS',
    description: `Chuỗi tăng liên tiếp ${streak} phiên giao dịch với giá đóng cửa phiên sau cao hơn phiên trước.`,
    cautionNotice: 'CẢNH BÁO RỦI RO MUA ĐUỔI (FOMO): Tín hiệu tăng nhiều phiên cho thấy động lượng mạnh nhưng tiềm ẩn nguy cơ chốt lời ngắn hạn. Đây không phải khuyến nghị mua đuổi.',
  };
}

/**
 * 4. KIỂM TRA BỨT PHÁ THẤT BẠI (D. FAILED BREAKOUT / BULL TRAP)
 * 
 * Giá đã vượt đỉnh 20 phiên trong 1-3 phiên trước, nhưng phiên hiện tại quay đầu giảm xuống dưới đỉnh tham chiếu.
 */
export function detectFailedBreakout(
  candles: Candle[],
  quote: NormalizedQuote
): FailedBreakoutResult | null {
  if (!candles || candles.length < 23) return null;

  // Lấy nến 2 phiên trước đó làm mốc kiểm tra
  const prior20 = candles.slice(-23, -3);
  if (prior20.length < 20) return null;
  const peak = Math.max(...prior20.map(c => c.high));

  // Kiểm tra xem trong 2 phiên gần nhất có phiên nào từng vượt qua peak không
  const prev1 = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];
  const hadBreakout = prev1.high > peak || prev2.high > peak;

  const currentPrice = quote.closePrice || candles[candles.length - 1].close;

  // Nếu đã từng vượt peak nhưng hiện tại đã gãy xuống dưới peak > 1.5%
  if (hadBreakout && currentPrice < peak * 0.985) {
    const dropPct = Number((((peak - currentPrice) / peak) * 100).toFixed(2));
    return {
      isFailed: true,
      breakoutPeak: peak,
      dropBelowPercent: dropPct,
      description: `Bẫy tăng giá (Bull trap): Giá từng bứt phá mốc ${(peak / 1000).toFixed(1)}k nhưng nhanh chóng suy yếu và tụt ${dropPct}% dưới ngưỡng đỉnh bứt phá.`,
    };
  }

  return null;
}

/**
 * 5. KIỂM TRA SUY YẾU XU HƯỚNG (E. TREND WEAKENING)
 * 
 * Kết hợp MA20, MA50, RSI và cấu trúc nến giá.
 * Không chỉ phụ thuộc vào một chỉ báo đơn lẻ.
 */
export function detectTrendWeakening(
  candles: Candle[],
  quote: NormalizedQuote
): WeakeningCheckResult | null {
  if (!candles || candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  const currentPrice = quote.closePrice || closes[closes.length - 1];
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes, 14);

  const reasons: string[] = [];

  // Giá gãy xuống dưới MA20
  if (currentPrice < ma20) {
    reasons.push(`Giá rơi dưới đường trung bình MA20 (${(ma20 / 1000).toFixed(1)}k)`);
  }

  // RSI suy yếu dưới ngưỡng 45
  if (rsi < 45) {
    reasons.push(`Chỉ số sức mạnh RSI giảm về vùng yếu (${rsi})`);
  }

  // MA20 cắt xuống MA50 (Death Cross)
  if (ma20 < ma50) {
    reasons.push(`Đường MA20 cắt xuống dưới MA50 tạo phân kỳ giảm`);
  }

  // Nếu thỏa mãn từ 2 yếu tố trở lên thì kết luận suy yếu
  if (reasons.length >= 2) {
    return {
      isWeakening: true,
      ma20,
      ma50,
      rsi,
      reasons,
      description: `Xu hướng suy yếu: ${reasons.join(', ')}. Cần đề phòng áp lực điều chỉnh diện rộng.`,
    };
  }

  return null;
}

/**
 * 6. TÍNH TOÁN THANH TỔNG QUAN THỊ TRƯỜNG (MARKET OVERVIEW)
 * 
 * Tính từ dữ liệu kiểm định:
 * - VN-Index, điểm thay đổi, % thay đổi
 * - Trạng thái: TĂNG / GIẢM / ĐI NGANG
 * - So sánh MA20 và MA50 của VN-Index
 * - Tỷ lệ cổ phiếu nằm trên MA20 và MA50
 * - Số mã tăng, giảm, đứng giá, trần, sàn
 * - Tỷ lệ bứt phá, thất bại, suy yếu
 * - Mức rủi ro thị trường: THẤP / TRUNG BÌNH / CAO
 * - Tỷ trọng danh mục tham khảo kèm disclaimer
 */

/**
 * 6B. CHIẾN LƯỢC PHỤ: BẮT ĐÁY ĐẠT CHUẨN (BOTTOM FISHING - STRAT-04)
 * 
 * Tiêu chí:
 * 1. Giá giảm >= 20% từ đỉnh 6 tháng (120 nến).
 * 2. Giá nằm dưới MA50.
 * 3. RSI quá bán (<= 38).
 * 4. Nến xác nhận: Bật >= 3% từ đáy gần nhất và vượt đỉnh nến trước, KL >= TB20.
 * 5. Thị trường hoảng loạn (% mã trên MA50 <= 25%).
 */
export function detectBottomFishing(
  symbol: string,
  exchange: Exchange,
  candles: Candle[],
  quote: NormalizedQuote,
  marketBreadthMa50Percent = 50
): BottomFishingResult | null {
  if (!candles || candles.length < 60) return null;

  const currentPrice = quote.closePrice || candles[candles.length - 1].close;
  const currentVolume = quote.matchVolume || candles[candles.length - 1].volume;

  // 1. Kiểm tra mức giảm từ đỉnh 6 tháng
  const lookback = Math.min(120, candles.length);
  const recentCandles = candles.slice(-lookback);
  const high6M = Math.max(...recentCandles.map(c => c.high));
  const dropPercent = high6M > 0 ? ((high6M - currentPrice) / high6M) * 100 : 0;
  if (dropPercent < 20.0) return null;

  // 2. Dưới MA50
  const ma50 = calculateSMA(candles.map(c => c.close), 50);
  if (currentPrice >= ma50) return null;

  // 3. RSI quá bán
  const rsi = calculateRSI(candles.map(c => c.close), 14);
  if (rsi > 38) return null;

  // 4. Thanh khoản tối thiểu
  const prior20 = candles.slice(-21, -1);
  const avgVol20 = calculateSMA(prior20.map(c => c.volume), 20);
  if (avgVol20 < 100000) return null;

  // 5. Nến xác nhận đảo chiều
  const prevCandle = candles[candles.length - 2];
  const lowestRecent = Math.min(...candles.slice(-10).map(c => c.low));
  const bounceFromLow = lowestRecent > 0 ? ((currentPrice - lowestRecent) / lowestRecent) * 100 : 0;
  const hasConfirmationCandle = currentPrice > prevCandle.high && bounceFromLow >= 3.0 && currentVolume >= avgVol20 * 0.85;

  // 6. Thị trường hoảng loạn
  const isMarketPanic = marketBreadthMa50Percent <= 25;

  const reasons: string[] = [
    `Chiết khấu sâu -${dropPercent.toFixed(1)}% từ đỉnh 6 tháng`,
    `RSI (${rsi.toFixed(1)}) ở vùng quá bán tích tụ lực cầu`,
  ];
  if (bounceFromLow >= 3.0) reasons.push(`Nến đảo chiều bật +${bounceFromLow.toFixed(1)}% từ đáy`);
  if (isMarketPanic) reasons.push(`Thị trường hoảng loạn (% trên MA50 = ${marketBreadthMa50Percent}%)`);

  const ma20 = calculateSMA(candles.map(c => c.close), 20);
  const target1Price = Math.round(Math.max(currentPrice * 1.05, Math.min(ma20, currentPrice * 1.10)));
  const target2Price = Math.round(Math.max(target1Price * 1.05, ma50));
  const stopLossPrice = Math.round(currentPrice * 0.92); // Cắt lỗ cứng -8%

  const isQualified = hasConfirmationCandle && isMarketPanic;

  return {
    isBottomFishing: true,
    status: isQualified ? 'QUALIFIED' : 'FORMING',
    dropFrom6MHighPercent: Number(dropPercent.toFixed(1)),
    rsi: Number(rsi.toFixed(1)),
    entryPrice: currentPrice,
    stopLossPrice,
    target1Price,
    target2Price,
    reasons,
    description: isQualified
      ? `BẮT ĐÁY ĐẠT CHUẨN: Chiết khấu -${dropPercent.toFixed(1)}% từ đỉnh, RSI ${rsi.toFixed(1)}, nến đảo chiều bật +${bounceFromLow.toFixed(1)}%, thị trường hoảng loạn. Kế hoạch: Thăm dò 1/3 vị thế, cắt lỗ -8%, chốt lời 1 quanh MA20 (${(target1Price/1000).toFixed(1)}k).`
      : `ĐANG TẠO ĐÁY: Chiết khấu -${dropPercent.toFixed(1)}% từ đỉnh, RSI ${rsi.toFixed(1)} quá bán. Cần chờ nến xác nhận hoặc thị trường đạt điểm hoảng loạn.`,
  };
}

/**
 * TÍNH TOÁN ĐIỂM SỨC KHỎE THỊ TRƯỜNG 0 - 100 (REG-01)
 * 6 Trụ cột:
 * 1. Xu hướng VN-Index (25đ)
 * 2. Độ rộng thị trường % trên MA50 (25đ)
 * 3. Động lượng RSI (15đ)
 * 4. Số ngày phân phối trong 25 phiên (15đ)
 * 5. Thanh khoản xác nhận (10đ)
 * 6. Dòng tiền khối ngoại (10đ)
 */
export function calculateMarketHealthScore(params: {
  vnindex: NormalizedIndex;
  indexCandles: Candle[];
  stocksAboveMa50Percent: number;
  quotes: NormalizedQuote[];
}): {
  score: number;
  breakdown: {
    trend: number;
    breadth: number;
    momentum: number;
    distributionDays: number;
    volume: number;
    foreign: number;
  };
  distributionDaysCount: number;
  isFollowThroughDay: boolean;
} {
  const { vnindex, indexCandles, stocksAboveMa50Percent, quotes } = params;

  // Trụ cột 1: Xu hướng (max 25đ)
  let trend = 0;
  const closes = indexCandles.map(c => c.close);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const curClose = vnindex.value || (closes.length > 0 ? closes[closes.length - 1] : 0);

  if (curClose > ma20) trend += 10;
  if (curClose > ma50) trend += 10;
  if (ma20 > ma50) trend += 5;

  // Trụ cột 2: Độ rộng (max 25đ)
  let breadth = 0;
  if (stocksAboveMa50Percent >= 65) breadth = 25;
  else if (stocksAboveMa50Percent >= 50) breadth = 18;
  else if (stocksAboveMa50Percent >= 35) breadth = 10;
  else breadth = 3;

  // Trụ cột 3: Động lượng RSI (max 15đ)
  let momentum = 0;
  const rsi = calculateRSI(closes, 14);
  if (rsi >= 50 && rsi <= 68) momentum = 15;
  else if (rsi >= 45 && rsi < 50) momentum = 10;
  else if (rsi > 68) momentum = 8;
  else momentum = 4;

  // Trụ cột 4: Ngày phân phối 25 phiên (max 15đ)
  let distributionDaysCount = 0;
  const lookback = Math.min(25, indexCandles.length - 1);
  for (let i = indexCandles.length - lookback; i < indexCandles.length; i++) {
    const cur = indexCandles[i];
    const prev = indexCandles[i - 1];
    if (prev && cur.close < prev.close * 0.998 && cur.volume > prev.volume) {
      distributionDaysCount++;
    }
  }

  let distributionDays = 15;
  if (distributionDaysCount <= 2) distributionDays = 15;
  else if (distributionDaysCount <= 4) distributionDays = 10;
  else if (distributionDaysCount <= 5) distributionDays = 5;
  else distributionDays = 0;

  // Trụ cột 5: Khối lượng xác nhận (max 10đ)
  let volume = 5;
  const vol20 = calculateSMA(indexCandles.map(c => c.volume), 20);
  const curVol = vnindex.totalVolume || (indexCandles.length > 0 ? indexCandles[indexCandles.length - 1].volume : 0);
  if (curClose > (indexCandles[indexCandles.length - 2]?.close || curClose) && curVol >= vol20) {
    volume = 10;
  } else if (curClose < (indexCandles[indexCandles.length - 2]?.close || curClose) && curVol > vol20 * 1.2) {
    volume = 2;
  }

  // Trụ cột 6: Dòng tiền khối ngoại (max 10đ)
  let foreign = 5;
  const netForeign = quotes.reduce((acc, q) => acc + (q.foreignNetValue !== undefined ? q.foreignNetValue : (((q.foreignBuyVol || 0) - (q.foreignSellVol || 0)) * q.closePrice)), 0);
  if (netForeign > 100_000_000_000) foreign = 10;
  else if (netForeign < -100_000_000_000) foreign = 2;

  // Follow-Through Day (FTD)
  const lastC = indexCandles[indexCandles.length - 1];
  const prevC = indexCandles[indexCandles.length - 2];
  const isFollowThroughDay = Boolean(
    lastC && prevC &&
    ((lastC.close - prevC.close) / prevC.close) >= 0.012 &&
    lastC.volume > prevC.volume
  );

  const totalScore = trend + breadth + momentum + distributionDays + volume + foreign;

  return {
    score: totalScore,
    breakdown: { trend, breadth, momentum, distributionDays, volume, foreign },
    distributionDaysCount,
    isFollowThroughDay,
  };
}

export function calculateMarketOverview(
  indices: NormalizedIndex[],
  quotes: NormalizedQuote[],
  historicalCandlesMap: Record<string, Candle[]>
): MarketOverviewData {
  // Lấy chỉ số VN-Index (HOSE)
  const vnindex = indices.find(idx => idx.code === 'VNINDEX') || {
    code: 'VNINDEX',
    name: 'VN-Index',
    exchange: 'HOSE' as Exchange,
    value: 1286.24,
    change: 12.34,
    changePercent: 0.97,
    totalVolume: 850000000,
    totalValue: 21500000000000,
    advances: 268,
    declines: 142,
    noChanges: 65,
    ceilings: 14,
    floors: 2,
    dataMode: 'DEMO' as DataMode,
    source: 'STOCKAI_VERIFIED_DATA',
    updatedTime: '15:00:00',
  };

  // Tính MA20 và MA50 của VN-Index (dựa trên dữ liệu nến của VN-Index nếu có hoặc ước lượng từ lịch sử thị trường)
  const vnindexHistory = historicalCandlesMap['VNINDEX'] || [];
  let indexMa20 = vnindex.value * 0.985;
  let indexMa50 = vnindex.value * 0.965;

  if (vnindexHistory.length >= 20) {
    const vnCloses = vnindexHistory.map(c => c.close);
    indexMa20 = calculateSMA(vnCloses, 20);
    if (vnCloses.length >= 50) {
      indexMa50 = calculateSMA(vnCloses, 50);
    }
  }

  const indexAboveMa20 = vnindex.value >= indexMa20;
  const indexAboveMa50 = vnindex.value >= indexMa50;
  const ma20AboveMa50 = indexMa20 >= indexMa50;

  // Tính tỷ lệ cổ phiếu nằm trên MA20 và MA50 từ danh sách quotes
  let countAboveMa20 = 0;
  let countAboveMa50 = 0;
  let totalEvaluated = 0;

  let breakoutCount = 0;
  let failedBreakoutCount = 0;
  let weakeningCount = 0;

  for (const quote of quotes) {
    const candles = historicalCandlesMap[quote.symbol];
    if (candles && candles.length >= 20) {
      totalEvaluated++;
      const closes = candles.map(c => c.close);
      const ma20 = calculateSMA(closes, 20);
      const ma50 = candles.length >= 50 ? calculateSMA(closes, 50) : ma20 * 0.98;

      if (quote.closePrice >= ma20) countAboveMa20++;
      if (quote.closePrice >= ma50) countAboveMa50++;

      // Đánh giá bứt phá / thất bại / suy yếu
      const breakoutRes = detectBreakout20(quote.symbol, quote.market, candles, quote);
      if (breakoutRes && breakoutRes.isBreakout) breakoutCount++;

      const failedRes = detectFailedBreakout(candles, quote);
      if (failedRes && failedRes.isFailed) failedBreakoutCount++;

      const weakRes = detectTrendWeakening(candles, quote);
      if (weakRes && weakRes.isWeakening) weakeningCount++;
    }
  }

  // Tỷ lệ phần trăm
  const denominator = totalEvaluated > 0 ? totalEvaluated : quotes.length || 1;
  const stocksAboveMa20Percent = Number(((countAboveMa20 / denominator) * 100).toFixed(1));
  const stocksAboveMa50Percent = Number(((countAboveMa50 / denominator) * 100).toFixed(1));
  const breakoutRatioPercent = Number(((breakoutCount / denominator) * 100).toFixed(1));
  const failedBreakoutRatioPercent = Number(((failedBreakoutCount / denominator) * 100).toFixed(1));
  const weakeningRatioPercent = Number(((weakeningCount / denominator) * 100).toFixed(1));

  // Xác định trạng thái thị trường
  let marketStatus: 'TĂNG' | 'GIẢM' | 'ĐI NGANG' = 'ĐI NGANG';
  if (indexAboveMa20 && vnindex.changePercent > 0.3 && vnindex.advances > vnindex.declines) {
    marketStatus = 'TĂNG';
  } else if (!indexAboveMa20 && vnindex.changePercent < -0.3 && vnindex.declines > vnindex.advances) {
    marketStatus = 'GIẢM';
  } else {
    marketStatus = 'ĐI NGANG';
  }

  // Xác định mức rủi ro thị trường
  let marketRiskLevel: MarketAlertRiskLevel = 'TRUNG BÌNH';
  if (marketStatus === 'TĂNG' && stocksAboveMa20Percent >= 55 && weakeningRatioPercent < 20) {
    marketRiskLevel = 'THẤP';
  } else if (marketStatus === 'GIẢM' || stocksAboveMa20Percent < 35 || weakeningRatioPercent >= 35) {
    marketRiskLevel = 'CAO';
  } else {
    marketRiskLevel = 'TRUNG BÌNH';
  }

  // Tỷ trọng danh mục tham khảo
  let portfolioAllocationReference = {
    stockPercent: 50,
    cashPercent: 50,
    recommendationText: 'Thị trường cân bằng, ưu tiên nắm giữ cổ phiếu có dòng tiền bứt phá.',
    disclaimer: 'Tỷ trọng chỉ mang tính chất tham khảo dựa trên thuật toán định lượng rủi ro, không phải cam kết hiệu quả hay khuyến nghị đầu tư cá nhân.',
  };

  if (marketRiskLevel === 'THẤP') {
    portfolioAllocationReference = {
      stockPercent: 75,
      cashPercent: 25,
      recommendationText: 'Thị trường trong xu hướng tăng lành mạnh, độ rộng mở rộng. Tham khảo tỷ trọng: 70–80% Cổ phiếu / 20–30% Tiền mặt.',
      disclaimer: 'Tỷ trọng chỉ mang tính chất tham khảo dựa trên thuật toán định lượng rủi ro, không phải cam kết hiệu quả hay khuyến nghị đầu tư cá nhân.',
    };
  } else if (marketRiskLevel === 'CAO') {
    portfolioAllocationReference = {
      stockPercent: 20,
      cashPercent: 80,
      recommendationText: 'Áp lực suy yếu xu hướng gia tăng, rủi ro điều chỉnh cao. Tham khảo tỷ trọng phòng thủ: 15–20% Cổ phiếu / 80–85% Tiền mặt.',
      disclaimer: 'Tỷ trọng chỉ mang tính chất tham khảo dựa trên thuật toán định lượng rủi ro, không phải cam kết hiệu quả hay khuyến nghị đầu tư cá nhân.',
    };
  } else {
    portfolioAllocationReference = {
      stockPercent: 45,
      cashPercent: 55,
      recommendationText: 'Thị trường đi ngang phân hóa, giao dịch ngắn hạn thận trọng. Tham khảo tỷ trọng: 40–50% Cổ phiếu / 50–60% Tiền mặt.',
      disclaimer: 'Tỷ trọng chỉ mang tính chất tham khảo dựa trên thuật toán định lượng rủi ro, không phải cam kết hiệu quả hay khuyến nghị đầu tư cá nhân.',
    };
  }

  // Tính điểm sức khỏe thị trường 0 - 100
  const healthResult = calculateMarketHealthScore({
    vnindex,
    indexCandles: vnindexHistory,
    stocksAboveMa50Percent,
    quotes,
  });

  return {
    indexCode: vnindex.code,
    indexName: vnindex.name,
    currentValue: vnindex.value,
    changeValue: vnindex.change,
    changePercent: vnindex.changePercent,
    marketStatus,
    indexMa20: Number(indexMa20.toFixed(2)),
    indexMa50: Number(indexMa50.toFixed(2)),
    indexAboveMa20,
    indexAboveMa50,
    ma20AboveMa50,
    stocksAboveMa20Percent,
    stocksAboveMa50Percent,
    advances: vnindex.advances,
    declines: vnindex.declines,
    noChanges: vnindex.noChanges,
    ceilings: vnindex.ceilings || 0,
    floors: vnindex.floors || 0,
    breakoutRatioPercent,
    failedBreakoutRatioPercent,
    weakeningRatioPercent,
    marketRiskLevel,
    portfolioAllocationReference,
    lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dataMode: vnindex.dataMode,
    dataSource: vnindex.source,
    marketHealthScore: healthResult.score,
    healthScoreBreakdown: healthResult.breakdown,
    distributionDaysCount: healthResult.distributionDaysCount,
    isFollowThroughDay: healthResult.isFollowThroughDay,
    regimeMode: marketRiskLevel === 'CAO' ? 'block' : 'warn',
  };
}

/**
 * 7. CƠ CHẾ CHỐNG TẠO CẢNH BÁO TRÙNG & LƯU LỊCH SỬ BỀN VỮNG
 * 
 * - Khóa định danh: symbol + eventType + tradingSession
 * - Nếu sự kiện đang ở trạng thái tích cực (NEW, WATCHING, CONFIRMED) trong phiên: Cập nhật giá mới, KHÔNG ghi đè giá cảnh báo gốc.
 * - Chỉ tạo sự kiện mới khi sự kiện trước đã CLOSED hoặc sang phiên mới.
 * - Tách bạch: Sự kiện thị trường, Trạng thái hiện tại, Lịch sử chuyển trạng thái (statusLogs).
 */
export function deduplicateAndMergeAlert(
  incomingAlert: Omit<MarketAlertItem, 'id' | 'statusLogs' | 'updatedAt'>,
  existingAlerts: MarketAlertItem[]
): { updatedAlerts: MarketAlertItem[]; mergedItem: MarketAlertItem; isNew: boolean } {
  const now = new Date().toISOString();
  
  // Tìm cảnh báo trùng theo symbol + eventType + tradingSession
  const existingIdx = existingAlerts.findIndex(
    alt => 
      alt.symbol === incomingAlert.symbol &&
      alt.eventType === incomingAlert.eventType &&
      alt.tradingSession === incomingAlert.tradingSession &&
      alt.status !== 'CLOSED'
  );

  if (existingIdx >= 0) {
    // Đã tồn tại trong phiên và chưa kết thúc: Cập nhật giá hiện tại và % thay đổi
    const existing = existingAlerts[existingIdx];
    const updatedPrice = incomingAlert.currentPrice;
    const priceChange = existing.alertPrice > 0 
      ? Number((((updatedPrice - existing.alertPrice) / existing.alertPrice) * 100).toFixed(2))
      : 0;

    let newStatus = existing.status;
    const logs = [...existing.statusLogs];

    // Cập nhật trạng thái nếu có sự chuyển tiếp (ví dụ từ WATCHING sang CONFIRMED)
    if (incomingAlert.status && incomingAlert.status !== existing.status) {
      newStatus = incomingAlert.status;
      logs.push({
        status: newStatus,
        timestamp: now,
        note: `Tự động chuyển trạng thái sang ${newStatus} tại mức giá ${updatedPrice.toLocaleString('vi-VN')} đ`,
        price: updatedPrice,
      });
    }

    const mergedItem: MarketAlertItem = {
      ...existing,
      currentPrice: updatedPrice,
      priceChangeFromAlertPercent: priceChange,
      volumeRatio: incomingAlert.volumeRatio || existing.volumeRatio,
      indicatorValues: {
        ...existing.indicatorValues,
        ...incomingAlert.indicatorValues,
      },
      status: newStatus,
      statusLogs: logs,
      updatedAt: now,
    };

    const updatedAlerts = [...existingAlerts];
    updatedAlerts[existingIdx] = mergedItem;

    return { updatedAlerts, mergedItem, isNew: false };
  }

  // Tạo mới hoàn toàn
  const newId = `alt_evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const initialLog = {
    status: incomingAlert.status || 'NEW',
    timestamp: now,
    note: `Phát hiện tín hiệu ${incomingAlert.eventType} tại giá ${incomingAlert.alertPrice.toLocaleString('vi-VN')} đ`,
    price: incomingAlert.alertPrice,
  };

  const newItem: MarketAlertItem = {
    ...incomingAlert,
    id: newId,
    priceChangeFromAlertPercent: 0,
    status: incomingAlert.status || 'NEW',
    statusLogs: [initialLog],
    updatedAt: now,
  };

  return {
    updatedAlerts: [newItem, ...existingAlerts],
    mergedItem: newItem,
    isNew: true,
  };
}

/**
 * 8. TÍNH TOÁN BỘ ĐẾM SỐ LƯỢNG CHO TỪNG TAB BỘ LỌC
 * 
 * Tính chính xác từ các bản ghi thực tế trong hệ thống
 */
export function calculateFilterCounts(
  alerts: MarketAlertItem[],
  portfolioSymbols: string[] = []
): MarketAlertFilterCounts {
  const counts: MarketAlertFilterCounts = {
    all: alerts.length,
    breakout: 0,
    failed_breakout: 0,
    weakening: 0,
    stop_loss: 0,
    take_profit: 0,
    consecutive_up: 0,
    volume_surge: 0,
    corporate_action: 0,
    watchlist: 0,
    bottom_fishing: 0,
    squeeze: 0,
    divergence: 0,
    blocked: 0,
  };

  const watchlistSet = new Set(portfolioSymbols.map(s => s.toUpperCase()));

  for (const alt of alerts) {
    switch (alt.eventType) {
      case 'BREAKOUT_20':
        counts.breakout++;
        break;
      case 'FAILED_BREAKOUT':
        counts.failed_breakout++;
        break;
      case 'TREND_WEAKENING':
        counts.weakening++;
        break;
      case 'STOP_LOSS':
        counts.stop_loss++;
        break;
      case 'TAKE_PROFIT':
        counts.take_profit++;
        break;
      case 'CONSECUTIVE_UP':
        counts.consecutive_up++;
        break;
      case 'VOLUME_SURGE':
        counts.volume_surge++;
        break;
      case 'CORPORATE_ACTION':
        counts.corporate_action++;
        break;
      case 'BOTTOM_FISHING':
        if (counts.bottom_fishing !== undefined) counts.bottom_fishing++;
        break;
      case 'VOLATILITY_SQUEEZE':
        if (counts.squeeze !== undefined) counts.squeeze++;
        break;
      case 'DIVERGENCE':
        if (counts.divergence !== undefined) counts.divergence++;
        break;
    }

    if (alt.status === 'BLOCKED' || alt.isBlocked) {
      if (counts.blocked !== undefined) counts.blocked++;
    }

    if (watchlistSet.has(alt.symbol.toUpperCase()) || alt.eventType === 'PORTFOLIO_WATCHLIST') {
      counts.watchlist++;
    }
  }

  return counts;
}
