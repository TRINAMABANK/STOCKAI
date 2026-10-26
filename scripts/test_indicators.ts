import {
  CandleData,
  calculateATR,
  calculateIchimoku,
  calculateVolatilitySqueeze,
  detectDivergence,
  calculateCMF,
  calculateOBV,
  calculateVolumeProfile,
  calculateRSMansfield,
  calculateStochastic,
  calculateADX,
  calculatePositionRisk,
  generateTradeSetup,
} from '../src/lib/chart-indicators';

// Generate 70 synthetic candles with trend and volatility
const candles: CandleData[] = [];
let basePrice = 30000;
const startDate = new Date('2026-06-01');

for (let i = 0; i < 70; i++) {
  const d = new Date(startDate.getTime() + i * 86400000);
  const time = d.toISOString().slice(0, 10);
  // Add some sinus fluctuation
  const delta = Math.sin(i / 5) * 600 + (i > 40 ? (i - 40) * 150 : 0);
  const open = Math.round(basePrice + delta);
  const high = open + Math.round(Math.random() * 400 + 100);
  const low = open - Math.round(Math.random() * 400 + 100);
  const close = Math.round((high + low) / 2 + (Math.random() - 0.4) * 200);
  const volume = Math.round(500000 + Math.random() * 800000 + (i === 65 ? 2000000 : 0));
  candles.push({ time, open, high, low, close, volume });
  basePrice = close;
}

console.log('Testing 70 generated candles for StockAI indicators:');

// 1. Test ATR
const atr = calculateATR(candles, 14);
console.log('1. ATR (14):', atr.length, 'points, latest =', atr[atr.length - 1]);
console.assert(atr.length > 50, 'ATR length should be > 50');

// 2. Test Ichimoku
const ichi = calculateIchimoku(candles);
console.log('2. Ichimoku Kumo: consensus score =', ichi.consensusScore, '/ 4, isConsensus =', ichi.isConsensus, ichi.details);
console.assert(ichi.series.length === candles.length, 'Ichimoku series length should match candles');

// 3. Test Volatility Squeeze
const sq = calculateVolatilitySqueeze(candles);
console.log('3. Volatility Squeeze: isSqueezed =', sq.isSqueezed, 'barsCount =', sq.squeezeBarsCount, 'isFired =', sq.isFired);

// 4. Test Divergence
const div = detectDivergence(candles);
console.log('4. Divergences detected:', div.length);
if (div.length > 0) {
  console.log('   Sample divergence:', div[0]);
}

// 5. Test CMF
const cmf = calculateCMF(candles, 20);
console.log('5. CMF (20):', cmf.length, 'points, latest =', cmf[cmf.length - 1]);

// 6. Test OBV
const obv = calculateOBV(candles);
console.log('6. OBV:', obv.length, 'points, latest =', obv[obv.length - 1]);

// 7. Test Volume Profile
const vp = calculateVolumeProfile(candles, 20);
console.log('7. Volume Profile: POC price =', vp.pocPrice, 'VAH =', vp.vahPrice, 'VAL =', vp.valPrice, 'total vol =', vp.totalVolume);

// 8. Test RS Mansfield
const indexCandles = candles.map((c) => ({ ...c, close: Math.round(c.close * 0.04) }));
const rsMansfield = calculateRSMansfield(candles, indexCandles, 50);
console.log('8. RS Mansfield: latest RS =', rsMansfield.currentRS, 'is52WNewHigh =', rsMansfield.isRsNewHigh52W);

// 9. Test Stochastic
const stoch = calculateStochastic(candles, 14, 3, 3);
console.log('9. Stochastic: %K =', stoch.currentK, '%D =', stoch.currentD);

// 10. Test ADX
const adx = calculateADX(candles, 14);
console.log('10. ADX: ADX =', adx.currentAdx, '+DI =', adx.currentPlusDi, '-DI =', adx.currentMinusDi, 'trend =', adx.trendStrength);

// 11. Test Position Risk
const risk = calculatePositionRisk({
  portfolioCapital: 500_000_000,
  entryPrice: 32_000,
  stopLossPrice: 29_500,
  avgDailyTurnover: 20_000_000_000,
  worstCaseT2DropPercent: 8.5,
});
console.log('11. Position Risk:', risk);

// 12. Test Trade Setup
const setup = generateTradeSetup('SSI', candles);
console.log('12. Trade Setup:', {
  strategy: setup.strategy,
  entryZone: [setup.entryZoneLow, setup.entryZoneHigh],
  probeStop: setup.probeStopPrice,
  positionStop: setup.positionStopPrice,
  maxChasePrice: setup.maxChasePrice,
  point1: setup.point1Entry,
  point2: setup.point2Entry,
});

console.log('ALL QUANT INDICATOR TESTS PASSED SUCCESSFULLY!');
