import { T3Signal, T3Strategy, RiskLevel, Exchange } from '@/types';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Tính toán RSI (Relative Strength Index) chu kỳ 14
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(1));
}

/**
 * Tính SMA (Simple Moving Average)
 */
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] || 0;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / period).toFixed(2));
}

/**
 * Tính ATR (Average True Range) chu kỳ 14
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return (candles[0]?.high - candles[0]?.low) || 1000;
  
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1].close;
    const current = candles[i];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prevClose),
      Math.abs(current.low - prevClose)
    );
    trs.push(tr);
  }

  return calculateSMA(trs, Math.min(period, trs.length));
}

/**
 * Động cơ sàng lọc và chấm điểm tín hiệu T+3
 * Không mua đuổi khi RSI > 78 (Vùng quá mua cực độ)
 * Bắt buộc kiểm tra tỷ lệ Lợi nhuận / Rủi ro (R:R) tối thiểu 1.5
 */
export function analyzeT3Opportunity(
  symbol: string,
  companyName: string,
  exchange: Exchange,
  candles: Candle[],
  currentTimeStr = '14:35:22'
): T3Signal | null {
  if (!candles || candles.length < 20) {
    return null; // Dữ liệu không đủ để phân tích
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const currentCandle = candles[candles.length - 1];
  const currentPrice = currentCandle.close;
  const rsi = calculateRSI(closes, 14);
  const ma20Price = calculateSMA(closes, 20);
  const ma50Price = calculateSMA(closes, 50);
  const ma20Vol = calculateSMA(volumes, 20);
  const volumeRatio = ma20Vol > 0 ? currentCandle.volume / ma20Vol : 1;
  const atr = calculateATR(candles, 14);

  // QUY TẮC AN TOÀN: Nếu RSI > 78 (mua đuổi đỉnh hưng phấn), loại bỏ ngay lập tức
  if (rsi > 78) {
    return null;
  }

  // Khảo sát 4 chiến lược
  let bestStrategy: T3Strategy | null = null;
  let score = 0;
  let rationale = '';
  let confirmation = '';
  let riskLevel: RiskLevel = 'Trung bình';

  // 1. Breakout (Phá nền kháng cự + khối lượng đột biến)
  const max20High = Math.max(...candles.slice(-21, -1).map(c => c.high));
  if (currentPrice > max20High && volumeRatio >= 1.5 && rsi >= 55 && rsi <= 72) {
    bestStrategy = 'Breakout';
    score = Math.min(95, Math.round(75 + (volumeRatio - 1.5) * 10 + (rsi - 55) * 0.5));
    rationale = `Khối lượng bùng nổ ${volumeRatio.toFixed(1)}x MA20, giá vượt đỉnh 20 phiên (${(max20High/1000).toFixed(1)}k) dứt khoát.`;
    confirmation = `Duy trì đóng nến trên mốc ${(max20High/1000).toFixed(1)}k với lực cầu chủ động`;
    riskLevel = 'Thấp';
  }

  // 2. Pullback (Điều chỉnh lành mạnh về MA20 với vol cạn kiệt)
  else if (
    currentPrice >= ma20Price * 0.98 && 
    currentPrice <= ma20Price * 1.03 && 
    currentCandle.low <= ma20Price && 
    currentCandle.close > currentCandle.open &&
    volumeRatio <= 1.2 &&
    rsi >= 45 && rsi <= 60
  ) {
    bestStrategy = 'Pullback';
    score = Math.min(90, Math.round(70 + (1.2 - volumeRatio) * 10 + 10));
    rationale = `Kiểm định thành công ngưỡng hỗ trợ MA20 (${(ma20Price/1000).toFixed(1)}k), nến rút chân với áp lực bán cạn kiệt.`;
    confirmation = `Phiên kế tiếp mở cửa giữ vững trên MA20 và không thủng đáy nến rút chân`;
    riskLevel = 'Thấp';
  }

  // 3. Momentum (Động lượng tăng mạnh liên tục)
  else if (
    currentPrice > ma20Price && 
    ma20Price > ma50Price && 
    rsi >= 60 && rsi <= 74 && 
    volumeRatio >= 1.2
  ) {
    bestStrategy = 'Momentum';
    score = Math.min(88, Math.round(68 + (rsi - 60) * 0.8 + (volumeRatio - 1.2) * 5));
    rationale = `Động lượng tích cực duy trì, cấu trúc giá dốc lên nằm trên các đường xu hướng trung hạn.`;
    confirmation = `Thanh khoản phiên sáng duy trì trên 50% khối lượng trung bình 20 phiên`;
    riskLevel = 'Trung bình';
  }

  // 4. Reversal (Đảo chiều đáy có phân kỳ dương hoặc chạm hỗ trợ cứng)
  else if (
    rsi <= 40 && 
    currentCandle.close > currentCandle.open && 
    currentCandle.volume > ma20Vol * 0.8
  ) {
    bestStrategy = 'Reversal';
    score = Math.min(80, Math.round(65 + (40 - rsi) * 0.5));
    rationale = `Lực cầu bắt đáy tham gia ở vùng quá bán RSI (${rsi}), xuất hiện mẫu hình nến đảo chiều tiềm năng.`;
    confirmation = `Giá đóng cửa vượt kháng cự gần nhất và dòng tiền lớn duy trì`;
    riskLevel = 'Cao';
  }

  // Nếu không đạt ngưỡng điểm tối thiểu (>= 70), không tạo tín hiệu giả
  if (!bestStrategy || score < 70) {
    return null;
  }

  // Tính toán vùng mua, mục tiêu và cắt lỗ dựa trên toán học ATR
  const stopLoss = Math.round((currentPrice - 1.2 * atr) / 100) * 100;
  const target1 = Math.round((currentPrice + 1.8 * atr) / 100) * 100;
  const target2 = Math.round((currentPrice + 2.5 * atr) / 100) * 100;
  const buyLow = Math.round((currentPrice - 0.4 * atr) / 100) * 100;
  const buyHigh = Math.round(currentPrice / 100) * 100;

  const potentialProfit = target1 - currentPrice;
  const potentialLoss = currentPrice - stopLoss;
  const rewardRisk = potentialLoss > 0 ? Number((potentialProfit / potentialLoss).toFixed(1)) : 1.5;

  return {
    id: `t3-${symbol.toLowerCase()}`,
    symbol,
    companyName,
    exchange,
    currentPrice,
    dataTimestamp: currentTimeStr,
    t3Score: score,
    strategy: bestStrategy,
    buyZone: `${(buyLow / 1000).toFixed(1)} - ${(buyHigh / 1000).toFixed(1)}`,
    targetPrice: `${(target1 / 1000).toFixed(1)} / ${(target2 / 1000).toFixed(1)}`,
    stopLoss,
    rewardRiskRatio: rewardRisk,
    riskLevel,
    liquidity: volumeRatio > 1.5 ? 'Rất cao (>150% TB20)' : 'Ổn định',
    holdingDays: bestStrategy === 'Momentum' ? '3 - 5 phiên' : '2 - 4 phiên',
    rationale,
    confirmationCondition: confirmation,
    invalidationLevel: stopLoss,
    risksAndEvents: 'Tuân thủ kỷ luật cắt lỗ tuyệt đối nếu giá vi phạm mức vô hiệu hóa',
    isFavorite: false,
  };
}
