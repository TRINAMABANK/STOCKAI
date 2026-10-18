/**
 * Unit Test Kiểm thử Toàn diện: Lớp Dữ liệu Thị trường & Động cơ Định lượng StockAI
 * Chạy độc lập với Node.js
 */

// ==========================================
// 1. LOGIC CHUẨN HÓA (NORMALIZER)
// ==========================================
function normalizeSymbol(rawSymbol) {
  if (!rawSymbol) return '';
  return rawSymbol.trim().toUpperCase();
}

function normalizeExchange(rawExchange) {
  if (!rawExchange) return 'HOSE';
  const clean = rawExchange.trim().toUpperCase();
  if (clean.includes('HNX')) return 'HNX';
  if (clean.includes('UPCOM') || clean.includes('UPC')) return 'UPCOM';
  return 'HOSE';
}

function normalizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  return new Date(str).toISOString().split('T')[0];
}

function formatDateToSsi(isoDateStr) {
  const norm = normalizeDate(isoDateStr);
  const parts = norm.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function normalizePrice(rawPrice) {
  const val = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/,/g, ''));
  if (isNaN(val) || val <= 0) return 0;
  if (val < 500) return Math.round(val * 1000); // 28.5 -> 28,500
  return Math.round(val);
}

function calculateCeilingFloor(refPriceVnd, exchange) {
  const band = exchange === 'HOSE' ? 0.07 : exchange === 'HNX' ? 0.10 : 0.15;
  return {
    ceiling: Math.round(refPriceVnd * (1 + band)),
    floor: Math.round(refPriceVnd * (1 - band)),
  };
}

// ==========================================
// 2. QUALITY CHECKER & ANOMALY DETECTION
// ==========================================
function validateAndSanitizeCandles(symbol, exchange, rawBars, isDemo = false, dataMode = 'EOD') {
  if (!rawBars || rawBars.length === 0) {
    return { cleanCandles: [], report: { status: 'INSUFFICIENT', isDemo, dataMode, totalBars: 0 } };
  }

  const mapByDate = new Map();
  let duplicateCount = 0;

  for (const bar of rawBars) {
    const d = normalizeDate(bar.date);
    if (mapByDate.has(d)) duplicateCount++;
    mapByDate.set(d, {
      date: d,
      open: Math.round(bar.open),
      high: Math.round(bar.high),
      low: Math.round(bar.low),
      close: Math.round(bar.close),
      volume: Math.round(bar.volume),
    });
  }

  const sorted = Array.from(mapByDate.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const clean = [];
  let corruptedCount = 0;

  for (const c of sorted) {
    let valid = true;
    if (c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0 || c.volume < 0) valid = false;
    if (c.high < c.low || c.high < c.open || c.high < c.close || c.low > c.open || c.low > c.close) valid = false;

    if (valid) clean.push(c);
    else corruptedCount++;
  }

  let status = 'VALID';
  if (clean.length < 20) status = 'INSUFFICIENT';
  else if (corruptedCount > 0) status = 'CORRUPTED';

  return {
    cleanCandles: clean,
    report: {
      symbol,
      status,
      isDemo,
      dataMode,
      totalBars: rawBars.length,
      validBars: clean.length,
      corruptedCount,
      duplicateCount,
    },
  };
}

function canGenerateLiveTradingSignal(report) {
  if (report.isDemo || report.dataMode === 'DEMO') {
    return { allowed: false, reason: 'DỮ LIỆU DEMO: Không dùng phát tín hiệu thật!' };
  }
  if (report.status === 'CORRUPTED') {
    return { allowed: false, reason: 'DỮ LIỆU BỊ LỖI OHLC' };
  }
  if (report.status === 'INSUFFICIENT') {
    return { allowed: false, reason: 'DỮ LIỆU KHÔNG ĐỦ' };
  }
  return { allowed: true };
}

// ==========================================
// 3. TOÁN ĐỊNH LƯỢNG & ĐỘNG CƠ STOCKAI (100 ĐIỂM)
// ==========================================
function calculateSMA(values, period) {
  if (values.length < period) return values[values.length - 1] || 0;
  const slice = values.slice(-period);
  return Number((slice.reduce((a, b) => a + b, 0) / period).toFixed(2));
}

function calculateEMA(values, period) {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period, avgLoss = losses / period;
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

function analyzeShortTermOpportunity(symbol, companyName, exchange, candles) {
  if (!candles || candles.length < 30) {
    return { symbol, status: 'UNSUITABLE', statusLabel: 'Không phù hợp', isExcluded: true, score: { totalScore: 0 } };
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const currentCandle = candles[candles.length - 1];
  const currentPrice = currentCandle.close;

  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const curEma20 = ema20[ema20.length - 1];
  const curEma50 = ema50[ema50.length - 1];
  const ma20Vol = calculateSMA(volumes, 20);
  const rsi = calculateRSI(closes, 14);
  const avgDailyValue = ma20Vol * currentPrice;

  // Loại trừ thanh khoản < 3 tỷ
  if (avgDailyValue < 3000000000) {
    return { symbol, status: 'UNSUITABLE', statusLabel: 'Không phù hợp', isExcluded: true, score: { totalScore: 0 }, reason: 'Thanh khoản thấp' };
  }

  // 1. Xu hướng (25đ)
  let trendScore = 0;
  if (currentPrice > curEma20 && curEma20 > curEma50) trendScore += 20;
  else if (currentPrice > curEma20) trendScore += 12;
  if (currentCandle.close >= currentCandle.open) trendScore += 5;
  trendScore = Math.min(25, trendScore);

  // 2. Động lượng (20đ)
  let momentumScore = 0;
  if (rsi >= 55 && rsi <= 68) momentumScore += 15;
  else if (rsi >= 48 && rsi < 55) momentumScore += 10;
  else momentumScore += 5;
  momentumScore = Math.min(20, momentumScore);

  // 3. Thanh khoản (15đ)
  let liquidityScore = 0;
  if (avgDailyValue >= 50000000000) liquidityScore = 15;
  else if (avgDailyValue >= 20000000000) liquidityScore = 12;
  else if (avgDailyValue >= 10000000000) liquidityScore = 9;
  else liquidityScore = 6;

  // 4. Khối lượng (15đ)
  let volumeScore = 0;
  const volSurge = currentCandle.volume / Math.max(1, ma20Vol);
  if (volSurge >= 1.5) volumeScore += 15;
  else if (volSurge >= 1.2) volumeScore += 10;
  else volumeScore += 5;

  // 5. Điểm vào & R:R (15đ)
  const stopLoss = Math.round(currentPrice * 0.96); // Cắt lỗ 4%
  const target1 = Math.round(currentPrice * 1.07);  // Lãi 7%
  const target2 = Math.round(currentPrice * 1.11);  // Lãi 11%
  const rewardRiskRatio = Number(((target1 - currentPrice) / (currentPrice - stopLoss)).toFixed(2)); // ~1.75
  let entryScore = rewardRiskRatio >= 1.5 ? 13 : 5;

  // 6. Tin tức & Rủi ro (10đ)
  let newsScore = 8;

  const totalScore = trendScore + momentumScore + liquidityScore + volumeScore + entryScore + newsScore;

  let status = 'UNSUITABLE';
  let statusLabel = 'Không phù hợp';
  if (totalScore >= 75) {
    status = 'BUY_CONFIRMED';
    statusLabel = 'Cơ hội mua cần xác nhận';
  } else if (totalScore >= 55) {
    status = 'WATCHLIST';
    statusLabel = 'Chờ theo dõi';
  }

  return {
    symbol,
    companyName,
    exchange,
    currentPrice,
    status,
    statusLabel,
    holdingPeriod: '5 - 10 phiên giao dịch',
    score: {
      trendScore,
      momentumScore,
      liquidityScore,
      volumeScore,
      entryRiskRewardScore: entryScore,
      newsRiskScore: newsScore,
      totalScore,
    },
    targetPrice1: target1,
    targetPrice2: target2,
    stopLoss,
    rewardRiskRatio,
    isExcluded: false,
    averageDailyValue: avgDailyValue,
  };
}

// ==========================================
// TEST EXECUTION
// ==========================================
console.log('================================================================');
console.log('  CHẠY BỘ KIỂM THỬ: MARKET DATA LAYER & STOCKAI ENGINE');
console.log('================================================================\n');

let pass = 0, fail = 0;
function test(cond, name) {
  if (cond) {
    console.log(`  [PASS] ${name}`);
    pass++;
  } else {
    console.error(`  [FAIL] ${name}`);
    fail++;
  }
}

// 1. Normalizer tests
console.log('--- 1. Kiểm thử Normalizer ---');
test(normalizeSymbol(' fpt ') === 'FPT', 'normalizeSymbol viết hoa và xóa khoảng trắng');
test(normalizeExchange('hose') === 'HOSE', 'normalizeExchange nhận diện HOSE');
test(normalizeExchange('hnx') === 'HNX', 'normalizeExchange nhận diện HNX');
test(normalizeExchange('upcom') === 'UPCOM', 'normalizeExchange nhận diện UPCOM');
test(normalizePrice(28.5) === 28500, 'normalizePrice tự động chuyển 28.5 thành 28,500 VNĐ');
test(normalizePrice(135600) === 135600, 'normalizePrice giữ nguyên 135,600 VNĐ');
test(normalizeDate('19/07/2023') === '2023-07-19', 'normalizeDate chuyển đổi DD/MM/YYYY của SSI sang YYYY-MM-DD');
test(formatDateToSsi('2023-07-19') === '19/07/2023', 'formatDateToSsi định dạng YYYY-MM-DD sang DD/MM/YYYY');

const bandsHose = calculateCeilingFloor(20000, 'HOSE');
test(bandsHose.ceiling === 21400 && bandsHose.floor === 18600, 'Biên độ trần/sàn HOSE ±7% chuẩn xác');

// 2. Quality Checker tests
console.log('\n--- 2. Kiểm thử Quality Checker & Anomaly Detection ---');
const rawBars = Array.from({ length: 30 }).map((_, i) => ({
  date: `2025-01-${String(i + 1).padStart(2, '0')}`,
  open: 20000 + i * 100,
  high: 20500 + i * 100,
  low: 19800 + i * 100,
  close: 20200 + i * 100,
  volume: 1000000,
}));

const q1 = validateAndSanitizeCandles('FPT', 'HOSE', rawBars);
test(q1.cleanCandles.length === 30, 'Kiểm định 30 nến hợp lệ thành công');

const rawBarsWithDuplicate = [...rawBars, { ...rawBars[0] }];
const q2 = validateAndSanitizeCandles('FPT', 'HOSE', rawBarsWithDuplicate);
test(q2.cleanCandles.length === 30 && q2.report.duplicateCount === 1, 'Tự động phát hiện và loại bỏ nến trùng ngày');

const corrupted = [...rawBars.slice(0, 20), { date: '2025-02-01', open: 20000, high: 18000, low: 22000, close: 19000, volume: 1000 }];
const q3 = validateAndSanitizeCandles('FPT', 'HOSE', corrupted);
test(q3.report.status === 'CORRUPTED', 'Phát hiện chính xác nến bị lỗi logic High < Low');

const demoCheck = canGenerateLiveTradingSignal({ isDemo: true, dataMode: 'DEMO', status: 'VALID' });
test(demoCheck.allowed === false, 'Chặn phát tín hiệu thật từ dữ liệu DEMO');

// 3. StockAI Quantitative Engine
console.log('\n--- 3. Kiểm thử Động cơ Định lượng StockAI (100 Điểm & 5-10 Phiên) ---');
const candles35 = Array.from({ length: 35 }).map((_, i) => {
  const p = 25000 * (0.90 + (i / 35) * 0.15);
  return {
    date: `2025-02-${String((i % 25) + 1).padStart(2, '0')}`,
    open: Math.round(p * 0.99),
    high: Math.round(p * 1.015),
    low: Math.round(p * 0.985),
    close: Math.round(p),
    volume: 1500000 + i * 20000,
  };
});

const sig = analyzeShortTermOpportunity('HPG', 'Tập đoàn Hòa Phát', 'HOSE', candles35);
test(sig.symbol === 'HPG', 'Trả về đúng mã HPG');
test(sig.holdingPeriod === '5 - 10 phiên giao dịch', 'Khung thời gian chuẩn 5 - 10 phiên giao dịch');
test(sig.score.totalScore >= 55 && sig.status === 'WATCHLIST', `Tổng điểm ${sig.score.totalScore}/100 đạt chuẩn Chờ theo dõi (55-74 điểm)`);

// Tạo nến bùng nổ khối lượng và giá để kiểm thử trạng thái BUY_CONFIRMED (>=75 điểm)
const breakoutCandles = [...candles35];
breakoutCandles[breakoutCandles.length - 1] = {
  ...breakoutCandles[breakoutCandles.length - 1],
  close: Math.round(breakoutCandles[breakoutCandles.length - 1].close * 1.035),
  volume: breakoutCandles[breakoutCandles.length - 1].volume * 2.2, // bùng nổ khối lượng 2.2x
};
const sigBreakout = analyzeShortTermOpportunity('HPG', 'Tập đoàn Hòa Phát', 'HOSE', breakoutCandles);
test(sigBreakout.score.totalScore >= 75 && sigBreakout.status === 'BUY_CONFIRMED', `Nến bùng nổ đạt ${sigBreakout.score.totalScore}/100đ -> Phân loại đúng 'Cơ hội mua cần xác nhận'`);
test(sig.score.trendScore <= 25, 'Điểm xu hướng <= 25');
test(sig.score.momentumScore <= 20, 'Điểm động lượng <= 20');
test(sig.score.liquidityScore <= 15, 'Điểm thanh khoản <= 15');
test(sig.score.volumeScore <= 15, 'Điểm khối lượng <= 15');
test(sig.score.entryRiskRewardScore <= 15, 'Điểm điểm vào/RR <= 15');
test(sig.score.newsRiskScore <= 10, 'Điểm tin tức <= 10');
test(sig.rewardRiskRatio >= 1.5, `Tỷ lệ R:R ${sig.rewardRiskRatio} >= 1.5:1`);
test(sig.targetPrice1 > sig.currentPrice && sig.stopLoss < sig.currentPrice, 'Mục tiêu chốt lời và cắt lỗ hợp lý');

// Loại trừ thanh khoản thấp
const lowVolCandles = candles35.map(c => ({ ...c, volume: 10 }));
const sigLow = analyzeShortTermOpportunity('PENNY', 'Cổ phiếu yếu', 'UPCOM', lowVolCandles);
test(sigLow.isExcluded === true && sigLow.status === 'UNSUITABLE', 'Bộ lọc loại trừ thanh khoản dưới 3 tỷ hoạt động chuẩn xác');

console.log('\n================================================================');
console.log(`  TỔNG KẾT: ${pass} PASSED | ${fail} FAILED`);
console.log('================================================================\n');

if (fail > 0) process.exit(1);
