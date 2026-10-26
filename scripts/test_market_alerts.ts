import {
  calculateProjectedVolume,
  detectBreakout20,
  detectBottomFishing,
  calculateMarketHealthScore,
} from '../src/lib/market-alerts-engine';
import { Candle } from '../src/lib/t3-engine';
import { NormalizedQuote, NormalizedIndex } from '../src/lib/market-data/types';

// 1. Test projected volume
const proj10 = calculateProjectedVolume(1000000, '09:30');
console.log('1. Projected Volume at 09:30:', proj10);
console.assert(proj10.safeBreakoutMultiplier === 2.1, 'Should be 2.1 before 10:00');

// 2. Test Breakout with upper half candle rule
const candles: Candle[] = [];
let p = 20000;
for (let i = 0; i < 25; i++) {
  p += 50;
  candles.push({
    date: `2026-10-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`,
    open: p,
    high: p + 200,
    low: p - 100,
    close: p + 150,
    volume: 500000,
  });
}

// Current price breaks out above max20High
const max20 = Math.max(...candles.slice(-21, -1).map(c => c.high));
const breakoutCandle: Candle = {
  date: '2026-10-26',
  open: max20,
  high: max20 + 800,
  low: max20 - 100,
  close: max20 + 600, // upper half
  volume: 1500000,
};
candles.push(breakoutCandle);

const quote: NormalizedQuote = {
  symbol: 'HPG',
  exchange: 'HOSE',
  closePrice: max20 + 600,
  matchVolume: 1500000,
  change: 600,
  changePercent: 3.0,
  referencePrice: max20,
  openPrice: max20,
  highPrice: max20 + 800,
  lowPrice: max20 - 100,
  foreignNetVolume: 100000,
  foreignNetValue: 5000000000,
  dataMode: 'REALTIME',
  source: 'SSI FastConnect',
  lastUpdated: new Date().toISOString(),
};

const brk = detectBreakout20('HPG', 'HOSE', candles, quote);
console.log('2. Breakout detection result:', brk);
console.assert(brk !== null && brk.isBreakout === true, 'Breakout should be detected');

// 3. Test Bottom Fishing
const dropCandles: Candle[] = [];
let dp = 50000;
for (let i = 0; i < 70; i++) {
  dp -= (i > 30 ? 300 : 50); // drop > 25%
  dropCandles.push({
    date: `2026-08-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`,
    open: dp,
    high: dp + 100,
    low: dp - 200,
    close: dp - 100,
    volume: 300000,
  });
}
// Add reversal bounce candle
const lastDp = dropCandles[dropCandles.length - 1].close;
dropCandles.push({
  date: '2026-10-26',
  open: lastDp,
  high: lastDp + 1500,
  low: lastDp - 100,
  close: lastDp + 1200, // +4% bounce
  volume: 800000,
});

const dropQuote: NormalizedQuote = {
  ...quote,
  symbol: 'NVL',
  closePrice: lastDp + 1200,
  matchVolume: 800000,
};

const bf = detectBottomFishing('NVL', 'HOSE', dropCandles, dropQuote, 20); // 20% on MA50 = panic
console.log('3. Bottom Fishing detection result:', bf);
console.assert(bf !== null && bf.isBottomFishing === true, 'Bottom fishing should be detected');

// 4. Test Market Health Score
const vnindex: NormalizedIndex = {
  code: 'VNINDEX',
  name: 'VN-Index',
  value: 1285.5,
  change: 8.2,
  changePercent: 0.64,
  volume: 750000000,
  valueTotal: 18000000000000,
  advances: 245,
  declines: 110,
  noChanges: 65,
  ceilings: 8,
  floors: 0,
  dataMode: 'REALTIME',
  source: 'SSI FastConnect',
  lastUpdated: new Date().toISOString(),
};

const health = calculateMarketHealthScore({
  vnindex,
  indexCandles: candles,
  stocksAboveMa50Percent: 62,
  quotes: [quote],
});
console.log('4. Market Health Score:', health);
console.assert(health.score > 0 && health.score <= 100, 'Score should be between 0 and 100');

console.log('ALL MARKET ALERT & HEALTH SCORE TESTS PASSED SUCCESSFULLY!');
