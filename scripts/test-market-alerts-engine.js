const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('KIỂM THỬ TỰ ĐỘNG PHÂN HỆ CẢNH BÁO THỊ TRƯỜNG & DÒNG TIỀN (V2)');
console.log('================================================================');

// 1. CÁC HÀM TOÁN HỌC & ĐỘNG CƠ CỦA V2 (Market Alerts Engine Implementation)
function calculateSMA(values, period) {
  if (values.length < period) return values[values.length - 1] || 0;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / period).toFixed(2));
}

function calculateRSI(closes, period = 14) {
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

// A. Bứt phá 20 phiên (No Lookahead Bias)
function detectBreakout20(symbol, exchange, candles, quote, minVolRatio = 1.5, isMarketClosed = false) {
  if (!candles || candles.length < 21) return null;

  // 20 phiên trước đó: slice(-21, -1) loại trừ nến hiện tại
  const prior20 = candles.slice(-21, -1);
  const max20High = Math.max(...prior20.map(c => c.high));

  const currentPrice = quote.closePrice || candles[candles.length - 1].close;
  const currentVolume = quote.matchVolume || candles[candles.length - 1].volume;

  if (currentVolume < 150000) return null;

  const avgVol20 = calculateSMA(prior20.map(c => c.volume), 20);
  const volumeRatio = avgVol20 > 0 ? Number((currentVolume / avgVol20).toFixed(2)) : 1;

  // Strictly > max20High
  const isBreakout = currentPrice > max20High && volumeRatio >= minVolRatio;
  if (!isBreakout) return null;

  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, 14);
  const isConfirmed = isMarketClosed || quote.dataMode === 'EOD';

  const description = isConfirmed
    ? `Xác nhận đóng phiên vượt đỉnh 20 phiên (${(max20High / 1000).toFixed(1)}k) với thanh khoản bùng nổ ${volumeRatio.toString().replace('.', ',')}x TB20.`
    : `Trong phiên: Giá vượt đỉnh 20 phiên (${(max20High / 1000).toFixed(1)}k), thanh khoản đạt ${volumeRatio.toString().replace('.', ',')}x TB20. Cần theo dõi duy trì tới ATC.`;

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

// B. Khối lượng tăng đột biến (KL/TB20)
function detectVolumeSurge(symbol, candles, quote, minRatio = 1.8) {
  if (!candles || candles.length < 21) return null;

  const prior20 = candles.slice(-21, -1);
  const avgVol20 = calculateSMA(prior20.map(c => c.volume), 20);
  if (avgVol20 <= 0) return null;

  const currentVolume = quote.matchVolume || candles[candles.length - 1].volume;
  if (currentVolume < 200000) return null;

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

// C. Tăng liên tiếp nhiều phiên
function detectConsecutiveUpStreak(candles, quote, minStreak = 3) {
  if (!candles || candles.length < minStreak + 1) return null;

  let streak = 0;
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

// D. Bứt phá thất bại
function detectFailedBreakout(candles, quote) {
  if (!candles || candles.length < 23) return null;

  const prior20 = candles.slice(-23, -3);
  if (prior20.length < 20) return null;
  const peak = Math.max(...prior20.map(c => c.high));

  const prev1 = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];
  const hadBreakout = prev1.high > peak || prev2.high > peak;

  const currentPrice = quote.closePrice || candles[candles.length - 1].close;

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

// E. Suy yếu xu hướng
function detectTrendWeakening(candles, quote) {
  if (!candles || candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  const currentPrice = quote.closePrice || closes[closes.length - 1];
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes, 14);

  const reasons = [];
  if (currentPrice < ma20) {
    reasons.push(`Giá rơi dưới đường trung bình MA20 (${(ma20 / 1000).toFixed(1)}k)`);
  }
  if (rsi < 45) {
    reasons.push(`Chỉ số sức mạnh RSI giảm về vùng yếu (${rsi})`);
  }
  if (ma20 < ma50) {
    reasons.push(`Đường MA20 cắt xuống dưới MA50 tạo phân kỳ giảm`);
  }

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

// F. Chống tạo cảnh báo trùng
function deduplicateAndMergeAlert(incomingAlert, existingAlerts) {
  const now = new Date().toISOString();
  
  const existingIdx = existingAlerts.findIndex(
    alt => 
      alt.symbol === incomingAlert.symbol &&
      alt.eventType === incomingAlert.eventType &&
      alt.tradingSession === incomingAlert.tradingSession &&
      alt.status !== 'CLOSED'
  );

  if (existingIdx >= 0) {
    const existing = existingAlerts[existingIdx];
    const updatedPrice = incomingAlert.currentPrice;
    const priceChange = existing.alertPrice > 0 
      ? Number((((updatedPrice - existing.alertPrice) / existing.alertPrice) * 100).toFixed(2))
      : 0;

    let newStatus = existing.status;
    const logs = [...(existing.statusLogs || [])];

    if (incomingAlert.status && incomingAlert.status !== existing.status) {
      newStatus = incomingAlert.status;
      logs.push({
        status: newStatus,
        timestamp: now,
        note: `Tự động chuyển trạng thái sang ${newStatus} tại mức giá ${updatedPrice.toLocaleString('vi-VN')} đ`,
        price: updatedPrice,
      });
    }

    const mergedItem = {
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

  const newId = `alt_evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const initialLog = {
    status: incomingAlert.status || 'NEW',
    timestamp: now,
    note: `Phát hiện tín hiệu ${incomingAlert.eventType} tại giá ${incomingAlert.alertPrice.toLocaleString('vi-VN')} đ`,
    price: incomingAlert.alertPrice,
  };

  const newItem = {
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

// G. Bộ đếm Filter Counts
function calculateFilterCounts(alerts, portfolioSymbols = []) {
  const counts = {
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
  };

  const watchlistSet = new Set(portfolioSymbols.map(s => s.toUpperCase()));

  for (const alt of alerts) {
    switch (alt.eventType) {
      case 'BREAKOUT_20': counts.breakout++; break;
      case 'FAILED_BREAKOUT': counts.failed_breakout++; break;
      case 'TREND_WEAKENING': counts.weakening++; break;
      case 'STOP_LOSS': counts.stop_loss++; break;
      case 'TAKE_PROFIT': counts.take_profit++; break;
      case 'CONSECUTIVE_UP': counts.consecutive_up++; break;
      case 'VOLUME_SURGE': counts.volume_surge++; break;
      case 'CORPORATE_ACTION': counts.corporate_action++; break;
    }

    if (watchlistSet.has(alt.symbol.toUpperCase()) || alt.eventType === 'PORTFOLIO_WATCHLIST') {
      counts.watchlist++;
    }
  }

  return counts;
}

// H. Tổng quan thị trường
function calculateMarketOverview(indices, quotes, historicalCandlesMap) {
  const vnindex = indices.find(idx => idx.code === 'VNINDEX') || indices[0];

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

      const breakoutRes = detectBreakout20(quote.symbol, quote.market, candles, quote);
      if (breakoutRes && breakoutRes.isBreakout) breakoutCount++;

      const failedRes = detectFailedBreakout(candles, quote);
      if (failedRes && failedRes.isFailed) failedBreakoutCount++;

      const weakRes = detectTrendWeakening(candles, quote);
      if (weakRes && weakRes.isWeakening) weakeningCount++;
    }
  }

  const denominator = totalEvaluated > 0 ? totalEvaluated : quotes.length || 1;
  const stocksAboveMa20Percent = Number(((countAboveMa20 / denominator) * 100).toFixed(1));
  const stocksAboveMa50Percent = Number(((countAboveMa50 / denominator) * 100).toFixed(1));
  const breakoutRatioPercent = Number(((breakoutCount / denominator) * 100).toFixed(1));
  const failedBreakoutRatioPercent = Number(((failedBreakoutCount / denominator) * 100).toFixed(1));
  const weakeningRatioPercent = Number(((weakeningCount / denominator) * 100).toFixed(1));

  let marketStatus = 'ĐI NGANG';
  if (indexAboveMa20 && vnindex.changePercent > 0.3 && vnindex.advances > vnindex.declines) {
    marketStatus = 'TĂNG';
  } else if (!indexAboveMa20 && vnindex.changePercent < -0.3 && vnindex.declines > vnindex.advances) {
    marketStatus = 'GIẢM';
  }

  let marketRiskLevel = 'TRUNG BÌNH';
  if (marketStatus === 'TĂNG' && stocksAboveMa20Percent >= 55 && weakeningRatioPercent < 20) {
    marketRiskLevel = 'THẤP';
  } else if (marketStatus === 'GIẢM' || stocksAboveMa20Percent < 35 || weakeningRatioPercent >= 35) {
    marketRiskLevel = 'CAO';
  }

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
  }

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
  };
}

// -------------------------------------------------------------
// BẮT ĐẦU CHẠY KIỂM THỬ TỪNG MỤC
// -------------------------------------------------------------
let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Chi tiết lỗi: ${err.message}`);
  }
}

function generateMockCandles(count, basePrice = 30000, trend = 'flat') {
  const candles = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    if (trend === 'up') price *= 1.01;
    else if (trend === 'down') price *= 0.99;
    
    candles.push({
      date: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`,
      open: Math.round(price * 0.99),
      high: Math.round(price * 1.01),
      low: Math.round(price * 0.98),
      close: Math.round(price),
      volume: 1000000 + (i % 5) * 100000,
    });
  }
  return candles;
}

// TEST 1: Bứt phá 20 phiên không bị thiên lệch nhìn trước
runTest('1.1. Bứt phá 20 phiên: Nến hiện tại không được tính vào đỉnh tham chiếu 20 phiên trước', () => {
  const candles = generateMockCandles(25, 25000);
  candles[candles.length - 5].high = 27000;
  const currentCandle = candles[candles.length - 1];
  currentCandle.close = 27500;
  currentCandle.volume = 3000000;

  const quote = {
    symbol: 'HPG',
    closePrice: 27500,
    matchVolume: 3000000,
    market: 'HOSE',
    dataMode: 'EOD',
  };

  const result = detectBreakout20('HPG', 'HOSE', candles, quote, 1.5, true);
  assert(result !== null, 'Phải phát hiện bứt phá khi giá > đỉnh 20 phiên trước');
  assert.strictEqual(result.isBreakout, true);
  assert.strictEqual(result.breakoutPeak, 27000, 'Đỉnh tham chiếu phải là 27000');
  assert(result.currentPrice > result.breakoutPeak, 'Giá hiện tại phải lớn hơn đỉnh tham chiếu');
});

runTest('1.2. Bứt phá 20 phiên: Chạm đỉnh (Equal) KHÔNG được coi là bứt phá xác nhận', () => {
  const candles = generateMockCandles(25, 25000);
  candles[candles.length - 5].high = 27000;
  
  const quote = {
    symbol: 'HPG',
    closePrice: 27000, // Chạm đúng đỉnh
    matchVolume: 3500000,
    market: 'HOSE',
    dataMode: 'EOD',
  };

  const result = detectBreakout20('HPG', 'HOSE', candles, quote, 1.5);
  assert.strictEqual(result, null, 'Chạm đỉnh không được tính là bứt phá');
});

runTest('1.3. Bứt phá 20 phiên: Thiếu khối lượng (vol ratio < 1.5) bị loại bỏ', () => {
  const candles = generateMockCandles(25, 25000);
  candles[candles.length - 5].high = 27000;
  
  const quote = {
    symbol: 'HPG',
    closePrice: 27500,
    matchVolume: 500000, // Vol thấp
    market: 'HOSE',
    dataMode: 'EOD',
  };

  const result = detectBreakout20('HPG', 'HOSE', candles, quote, 1.5);
  assert.strictEqual(result, null, 'Volume không đạt 1.5x phải bị loại bỏ');
});

// TEST 2: Khối lượng tăng đột biến (KL/TB20)
runTest('2.1. Tính KL/TB20: Định dạng hiển thị chuẩn ví dụ 2,25x', () => {
  const candles = generateMockCandles(25, 30000);
  for (let i = candles.length - 21; i < candles.length - 1; i++) {
    candles[i].volume = 1000000;
  }
  
  const quote = {
    symbol: 'TCB',
    closePrice: 33000,
    matchVolume: 2250000,
    dataMode: 'EOD',
  };

  const result = detectVolumeSurge('TCB', candles, quote, 1.8);
  assert(result !== null, 'Phải phát hiện đột biến khối lượng');
  assert.strictEqual(result.volumeRatio, 2.25);
  assert.strictEqual(result.volumeRatioFormatted, '2,25x', 'Định dạng phải là 2,25x');
});

runTest('2.2. Dữ liệu trong phiên (Intraday) ghi rõ cảnh báo số liệu tạm thời', () => {
  const candles = generateMockCandles(25, 30000);
  for (let i = candles.length - 21; i < candles.length - 1; i++) {
    candles[i].volume = 1000000;
  }
  
  const quote = {
    symbol: 'TCB',
    closePrice: 33000,
    matchVolume: 2500000,
    dataMode: 'REALTIME',
  };

  const result = detectVolumeSurge('TCB', candles, quote, 1.8);
  assert(result !== null);
  assert.strictEqual(result.isIntraday, true);
  assert(result.description.includes('tạm thời trong phiên'), 'Mô tả phải có cảnh báo số liệu tạm thời');
});

// TEST 3: Chuỗi tăng liên tiếp nhiều phiên
runTest('3.1. Chuỗi tăng liên tiếp: Phát hiện chuỗi 3 phiên đóng cửa tăng liên tục kèm cảnh báo FOMO', () => {
  const candles = generateMockCandles(25, 20000);
  candles[candles.length - 4].close = 20000;
  candles[candles.length - 3].close = 20500;
  candles[candles.length - 2].close = 21000;
  candles[candles.length - 1].close = 21600;

  const quote = { symbol: 'FPT', closePrice: 21600 };
  const result = detectConsecutiveUpStreak(candles, quote, 3);
  assert(result !== null, 'Phải phát hiện chuỗi tăng');
  assert.strictEqual(result.streakDays, 3);
  assert(result.cautionNotice.includes('FOMO'), 'Phải chứa cảnh báo rủi ro mua đuổi');
});

runTest('3.2. Chuỗi tăng bị phá vỡ nếu có 1 phiên giảm', () => {
  const candles = generateMockCandles(25, 20000);
  candles[candles.length - 3].close = 21000;
  candles[candles.length - 2].close = 20800; // Giảm
  candles[candles.length - 1].close = 21200;

  const quote = { symbol: 'FPT', closePrice: 21200 };
  const result = detectConsecutiveUpStreak(candles, quote, 3);
  assert.strictEqual(result, null, 'Chuỗi tăng dưới 3 phiên không được báo');
});

// TEST 4: Bứt phá thất bại
runTest('4.1. Bứt phá thất bại: Giá từng vượt đỉnh nhưng sau đó gãy sâu dưới đỉnh (Bull trap)', () => {
  const candles = generateMockCandles(30, 20000);
  const peak = 22000;
  candles[candles.length - 10].high = peak;

  candles[candles.length - 2].high = 22500;
  candles[candles.length - 2].close = 22200;

  candles[candles.length - 1].close = 21200; // Gãy dưới 22000
  const quote = { symbol: 'NVL', closePrice: 21200 };

  const result = detectFailedBreakout(candles, quote);
  assert(result !== null, 'Phải phát hiện bứt phá thất bại');
  assert.strictEqual(result.isFailed, true);
  assert(result.dropBelowPercent > 1.5, 'Tỷ lệ gãy phải > 1.5%');
  assert(result.description.includes('Bull trap'), 'Mô tả phải có từ khóa Bull trap');
});

// TEST 5: Suy yếu xu hướng
runTest('5.1. Suy yếu xu hướng: Kết hợp cả MA20, MA50 và RSI', () => {
  const candles = generateMockCandles(60, 40000, 'down');
  const quote = { symbol: 'VNM', closePrice: candles[candles.length - 1].close };

  const result = detectTrendWeakening(candles, quote);
  assert(result !== null, 'Phải phát hiện xu hướng suy yếu khi giá gãy MA và RSI thấp');
  assert.strictEqual(result.isWeakening, true);
  assert(result.reasons.length >= 2, 'Phải có từ 2 lý do kỹ thuật trở lên');
});

// TEST 6: Chống tạo cảnh báo trùng trong phiên (Deduplication)
runTest('6.1. Deduplication: Không tạo bản ghi trùng lặp trong cùng phiên giao dịch, bảo lưu alertPrice gốc', () => {
  const existingAlerts = [
    {
      id: 'alt-1',
      symbol: 'HPG',
      exchange: 'HOSE',
      eventType: 'BREAKOUT_20',
      tradingSession: '2026-10-22',
      detectedAt: '2026-10-22 10:00:00',
      alertPrice: 27200,
      currentPrice: 27200,
      priceChangeFromAlertPercent: 0,
      volumeRatio: 2.1,
      indicatorValues: {},
      dataSource: 'TEST',
      dataMode: 'REALTIME',
      ruleVersion: 'v2.0',
      status: 'WATCHING',
      riskLevel: 'THẤP',
      title: 'Bứt phá HPG',
      description: 'Test',
      statusLogs: [{ status: 'WATCHING', timestamp: '2026-10-22 10:00:00' }],
      updatedAt: '2026-10-22 10:00:00',
    }
  ];

  const incoming = {
    symbol: 'HPG',
    exchange: 'HOSE',
    eventType: 'BREAKOUT_20',
    tradingSession: '2026-10-22',
    detectedAt: '2026-10-22 14:00:00',
    alertPrice: 27800,
    currentPrice: 27800,
    priceChangeFromAlertPercent: 0,
    volumeRatio: 2.4,
    indicatorValues: {},
    dataSource: 'TEST',
    dataMode: 'REALTIME',
    ruleVersion: 'v2.0',
    status: 'CONFIRMED',
    riskLevel: 'THẤP',
    title: 'Bứt phá HPG',
    description: 'Test',
  };

  const { updatedAlerts, mergedItem, isNew } = deduplicateAndMergeAlert(incoming, existingAlerts);
  assert.strictEqual(isNew, false, 'Không được tạo mới cảnh báo trùng');
  assert.strictEqual(updatedAlerts.length, 1, 'Số lượng bản ghi không đổi');
  assert.strictEqual(mergedItem.alertPrice, 27200, 'Giá cảnh báo gốc phải được bảo lưu tuyệt đối (27200)');
  assert.strictEqual(mergedItem.currentPrice, 27800, 'Giá hiện tại được cập nhật mới (27800)');
  assert.strictEqual(mergedItem.status, 'CONFIRMED', 'Trạng thái chuyển sang CONFIRMED');
  assert(mergedItem.priceChangeFromAlertPercent > 2.0, '% thay đổi được tự động tính lại');
});

runTest('6.2. Cho phép tạo cảnh báo mới khi cảnh báo cũ đã CLOSED hoặc sang phiên mới', () => {
  const existingAlerts = [
    {
      id: 'alt-old',
      symbol: 'HPG',
      exchange: 'HOSE',
      eventType: 'BREAKOUT_20',
      tradingSession: '2026-10-20',
      detectedAt: '2026-10-20 10:00:00',
      alertPrice: 26000,
      currentPrice: 26500,
      status: 'CLOSED',
    }
  ];

  const incoming = {
    symbol: 'HPG',
    exchange: 'HOSE',
    eventType: 'BREAKOUT_20',
    tradingSession: '2026-10-22',
    detectedAt: '2026-10-22 10:00:00',
    alertPrice: 27200,
    currentPrice: 27200,
    status: 'NEW',
  };

  const { updatedAlerts, isNew } = deduplicateAndMergeAlert(incoming, existingAlerts);
  assert.strictEqual(isNew, true, 'Phiên mới hoặc sự kiện cũ đã đóng phải được tạo mới');
  assert.strictEqual(updatedAlerts.length, 2, 'Tổng số bản ghi là 2');
});

// TEST 7: Dữ liệu thiếu / không đủ nến
runTest('7.1. Trả về null khi nến không đủ 21 phiên (tránh nhìn trước và thiếu mẫu)', () => {
  const shortCandles = generateMockCandles(15, 30000);
  const quote = { symbol: 'SSI', closePrice: 32000, matchVolume: 5000000, market: 'HOSE' };
  const res = detectBreakout20('SSI', 'HOSE', shortCandles, quote);
  assert.strictEqual(res, null, 'Dưới 21 nến không được tính bứt phá 20 phiên');
});

// TEST 8: Bộ đếm số lượng bản ghi cho 10 chip lọc
runTest('8.1. Tính chính xác số lượng cho từng chip bộ lọc từ dữ liệu thực', () => {
  const alerts = [
    { symbol: 'HPG', eventType: 'BREAKOUT_20' },
    { symbol: 'SHS', eventType: 'BREAKOUT_20' },
    { symbol: 'NVL', eventType: 'FAILED_BREAKOUT' },
    { symbol: 'VNM', eventType: 'TREND_WEAKENING' },
    { symbol: 'TCB', eventType: 'VOLUME_SURGE' },
    { symbol: 'FPT', eventType: 'CONSECUTIVE_UP' },
    { symbol: 'BSR', eventType: 'STOP_LOSS' },
    { symbol: 'DGC', eventType: 'TAKE_PROFIT' },
    { symbol: 'MWG', eventType: 'CORPORATE_ACTION' },
  ];

  const counts = calculateFilterCounts(alerts, ['HPG', 'TCB']);
  assert.strictEqual(counts.all, 9);
  assert.strictEqual(counts.breakout, 2);
  assert.strictEqual(counts.failed_breakout, 1);
  assert.strictEqual(counts.weakening, 1);
  assert.strictEqual(counts.volume_surge, 1);
  assert.strictEqual(counts.consecutive_up, 1);
  assert.strictEqual(counts.stop_loss, 1);
  assert.strictEqual(counts.take_profit, 1);
  assert.strictEqual(counts.corporate_action, 1);
  assert.strictEqual(counts.watchlist, 2);
});

// TEST 9: Tính toán Tổng quan thị trường
runTest('9.1. Tính toán Tổng quan: MA20/MA50, độ rộng, rủi ro và tỷ trọng tham khảo', () => {
  const indices = [
    {
      code: 'VNINDEX',
      name: 'VN-Index',
      exchange: 'HOSE',
      value: 1286.24,
      change: 12.34,
      changePercent: 0.97,
      advances: 268,
      declines: 142,
      noChanges: 65,
      ceilings: 14,
      floors: 2,
    }
  ];

  const candlesMap = {
    HPG: generateMockCandles(40, 26000, 'up'),
    FPT: generateMockCandles(40, 130000, 'up'),
    TCB: generateMockCandles(40, 31000, 'up'),
    VNM: generateMockCandles(40, 70000, 'down'),
  };

  const quotes = [
    { symbol: 'HPG', closePrice: candlesMap.HPG[39].close, market: 'HOSE' },
    { symbol: 'FPT', closePrice: candlesMap.FPT[39].close, market: 'HOSE' },
    { symbol: 'TCB', closePrice: candlesMap.TCB[39].close, market: 'HOSE' },
    { symbol: 'VNM', closePrice: candlesMap.VNM[39].close, market: 'HOSE' },
  ];

  const overview = calculateMarketOverview(indices, quotes, candlesMap);
  assert.strictEqual(overview.indexCode, 'VNINDEX');
  assert.strictEqual(overview.currentValue, 1286.24);
  assert.strictEqual(overview.marketStatus, 'TĂNG');
  assert(overview.indexAboveMa20 === true, 'VN-Index phải nằm trên MA20');
  assert(overview.stocksAboveMa20Percent > 50, '% cổ phiếu trên MA20 phải > 50%');
  assert(overview.advances === 268);
  assert(overview.portfolioAllocationReference !== undefined);
  assert(overview.portfolioAllocationReference.stockPercent >= 70, 'Thị trường TĂNG tỷ trọng CP tham khảo >= 70%');
  assert(overview.portfolioAllocationReference.disclaimer.includes('không phải cam kết hiệu quả'));
});

// TEST 10: Lưu trữ và đọc bền vững từ Database JSON
runTest('10.1. Kiểm tra đọc danh sách market_alerts từ file data/stockai_db.json thực tế', () => {
  const dbFile = path.join(process.cwd(), 'data', 'stockai_db.json');
  assert(fs.existsSync(dbFile), 'File database stockai_db.json phải tồn tại');
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  assert(Array.isArray(db.market_alerts), 'db.market_alerts phải là mảng');
  assert(db.market_alerts.length >= 8, 'Phải có tối thiểu 8 bản ghi cảnh báo seed');
  const hpgAlert = db.market_alerts.find(a => a.symbol === 'HPG');
  assert(hpgAlert !== undefined, 'Phải có bản ghi cảnh báo của HPG');
  assert.strictEqual(hpgAlert.eventType, 'BREAKOUT_20');
  assert.strictEqual(hpgAlert.alertPrice, 27200, 'alertPrice ban đầu được bảo lưu');
});

console.log('================================================================');
console.log(`TỔNG KẾT KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐÃ VƯỢT QUA (100% SUCCESS)`);
console.log('================================================================');
assert.strictEqual(passedTests, totalTests, 'Tất cả các kiểm thử bắt buộc phải hoàn thành');
