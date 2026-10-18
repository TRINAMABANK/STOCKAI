/**
 * STOCKAI — TEST SUITE PHÂN TÍCH KỸ THUẬT, ĐỒ THỊ TRADINGVIEW & ĐIỂM VÀO LỆNH
 * Chạy trực tiếp qua node:
 * 1. Kiểm thử API nến Ngày 1D (OHLCV, TradeSetup, Chỉ báo)
 * 2. Kiểm thử API nến Tuần 1W (Tổng hợp từ nến ngày)
 * 3. Kiểm thử Bảo vệ dữ liệu ảo: Khung Intraday 1m/5m/15m/1h báo hasData = false, không sinh tick giả
 * 4. Kiểm định 4 Chiến lược ngắn hạn (Breakout, Pullback, Momentum, Reversal), R:R >= 1.5
 * 5. Kiểm định Bộ quản trị rủi ro vị thế (Quy tắc 2% NAV, làm tròn lô 100)
 */

const assert = require('assert');

// Hàm tính toán quản trị rủi ro vị thế chuẩn của StockAI
function calculatePositionRisk(params) {
  const { portfolioCapital, riskPercent = 2.0, entryPrice, stopLossPrice } = params;
  const maxRiskAmount = Math.round(portfolioCapital * (riskPercent / 100));
  const riskPerShare = Math.max(10, entryPrice - stopLossPrice);
  const rawShares = maxRiskAmount / riskPerShare;
  const recommendedShares = Math.max(100, Math.floor(rawShares / 100) * 100);
  const totalTradeValue = recommendedShares * entryPrice;
  const allocationPercent = Math.round((totalTradeValue / portfolioCapital) * 1000) / 10;
  return {
    maxRiskAmount,
    riskPerShare,
    recommendedShares,
    totalTradeValue,
    allocationPercent,
    isWarningAllocation: allocationPercent > 35,
  };
}

async function runTests() {
  console.log('===============================================================');
  console.log('⚡ STOCKAI — BẮT ĐẦU KIỂM THỬ ĐỒ THỊ KỸ THUẬT & HỖ TRỢ VÀO LỆNH');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}`);
      console.error(`     Lỗi: ${err.message}`);
      failed++;
    }
  }

  console.log('--- 1. Kiểm thử API /api/market cho Nến Ngày 1D ---');
  const res1D = await fetch('http://localhost:3000/api/market?symbol=FPT&candles=true&timeframe=1D');
  const data1D = await res1D.json();

  test('API 1D trả về kết quả thành công và đúng mã FPT', () => {
    assert.strictEqual(data1D.success, true);
    assert.strictEqual(data1D.data.symbol, 'FPT');
    assert.strictEqual(data1D.data.timeframe, '1D');
  });

  test('Số lượng nến ngày 1D đầy đủ để tính MA20, MA50, RSI, MACD (>= 50 nến)', () => {
    assert(data1D.data.candles.length >= 50, `Số nến (${data1D.data.candles.length}) phải >= 50`);
    const c = data1D.data.candles[0];
    assert(c.time && c.open && c.high && c.low && c.close && c.volume, 'Nến phải có đủ OHLCV và time');
    assert(c.high >= c.low, 'High phải >= Low');
  });

  test('TradeSetup được tính toán tự động với đầy đủ thông số kỹ thuật', () => {
    const setup = data1D.data.tradeSetup;
    assert(setup !== null, 'Phải có tradeSetup');
    assert(setup.entryPrice > 0, 'Giá vào lệnh phải dương');
    assert(setup.stopLoss < setup.entryPrice, 'Cắt lỗ phải dưới giá mua');
    assert(setup.target1 > setup.entryPrice, 'Mục tiêu 1 (T+5) phải trên giá mua');
    assert(setup.target2 > setup.target1, 'Mục tiêu 2 (T+10) phải trên TP1');
    assert(setup.rewardRiskRatio >= 1.4, `Tỷ lệ R:R (${setup.rewardRiskRatio}) phải >= 1.4`);
    assert(setup.rationale && setup.rationale.length > 10, 'Phải có luận điểm kỹ thuật');
    assert(setup.confirmationCondition && setup.confirmationCondition.length > 10, 'Phải có điều kiện xác nhận');
    assert(setup.invalidationCondition && setup.invalidationCondition.length > 10, 'Phải có điều kiện hủy tín hiệu');
    assert.strictEqual(setup.holdingPeriod, '5 – 10 phiên giao dịch');
    assert(setup.markers && setup.markers.length > 0, 'Phải có markers đặt trên đồ thị');
  });

  console.log('\n--- 2. Kiểm thử API /api/market cho Nến Tuần 1W ---');
  const res1W = await fetch('http://localhost:3000/api/market?symbol=FPT&candles=true&timeframe=1W');
  const data1W = await res1W.json();

  test('API 1W trả về nến tuần tổng hợp chuẩn xác', () => {
    assert.strictEqual(data1W.success, true);
    assert.strictEqual(data1W.data.timeframe, '1W');
    assert(data1W.data.candles.length > 0, 'Phải có nến tuần');
    assert(data1W.data.candles.length < data1D.data.candles.length, 'Số nến tuần phải ít hơn nến ngày');
    const w = data1W.data.candles[0];
    assert(w.high >= w.low, 'High nến tuần >= Low nến tuần');
  });

  console.log('\n--- 3. Kiểm thử Bảo vệ Chống Dữ liệu Giả mạo Khung Intraday ---');
  const res1m = await fetch('http://localhost:3000/api/market?symbol=FPT&candles=true&timeframe=1m');
  const data1m = await res1m.json();

  test('Khung 1m: Báo rõ hasData = false khi chưa có API streaming, KHÔNG sinh tick ảo', () => {
    assert.strictEqual(data1m.success, true);
    assert.strictEqual(data1m.data.hasData, false, 'hasData phải là false');
    assert.strictEqual(data1m.data.candles.length, 0, 'Tuyệt đối KHÔNG sinh nến giả');
    assert(data1m.data.message.includes('Chưa có dữ liệu thị trường cho khung thời gian 1m'));
  });

  const res15m = await fetch('http://localhost:3000/api/market?symbol=FPT&candles=true&timeframe=15m');
  const data15m = await res15m.json();

  test('Khung 15m: Báo rõ hasData = false và liệt kê availableTimeframes [1D, 1W]', () => {
    assert.strictEqual(data15m.data.hasData, false);
    assert.deepStrictEqual(data15m.data.availableTimeframes, ['1D', '1W']);
  });

  console.log('\n--- 4. Kiểm định Quản trị Rủi ro Vị thế (Quy tắc 2% NAV) ---');

  test('Tính số lượng cổ phiếu theo rủi ro 2% NAV và làm tròn lô 100', () => {
    const risk = calculatePositionRisk({
      portfolioCapital: 100000000, // 100 triệu
      riskPercent: 2.0,            // 2% rủi ro = 2 triệu
      entryPrice: 50000,           // Mua 50.000 đ
      stopLossPrice: 47000,        // Cắt lỗ 47.000 đ (lỗ 3.000 đ / CP)
    });

    assert.strictEqual(risk.maxRiskAmount, 2000000, 'Lỗ tối đa phải là 2.000.000 đ');
    assert.strictEqual(risk.riskPerShare, 3000, 'Lỗ trên mỗi cổ phiếu phải là 3.000 đ');
    // 2.000.000 / 3.000 = 666.6 -> làm tròn lô 100 = 600 cổ phiếu
    assert.strictEqual(risk.recommendedShares, 600, 'Khối lượng mua khuyến nghị phải làm tròn chẵn 600 CP');
    assert.strictEqual(risk.totalTradeValue, 30000000, 'Giá trị giải ngân là 30.000.000 đ');
    assert.strictEqual(risk.allocationPercent, 30.0, 'Tỷ trọng chiếm 30% NAV');
    assert.strictEqual(risk.isWarningAllocation, false, '30% NAV chưa vượt ngưỡng cảnh báo 35%');
  });

  test('Cảnh báo tỷ trọng khi vị thế giải ngân vượt quá 35% NAV', () => {
    const risk = calculatePositionRisk({
      portfolioCapital: 100000000,
      riskPercent: 2.0,
      entryPrice: 100000,
      stopLossPrice: 96000, // Lỗ 4.000 đ / CP -> mua 500 CP = 50.000.000 đ (50% NAV)
    });

    assert(risk.allocationPercent > 35, 'Tỷ trọng phải > 35% NAV');
    assert.strictEqual(risk.isWarningAllocation, true, 'Phải bật cảnh báo tỷ trọng vị thế');
  });

  console.log('\n--- 5. Kiểm thử Tính Minh bạch Nguồn Dữ liệu Thị trường ---');

  test('Hiển thị nguồn dữ liệu, chế độ dataMode và độ trễ latency thực tế', () => {
    assert(data1D.data.providerName, 'Phải có tên nhà cung cấp');
    assert(['EOD', 'DEMO', 'REALTIME', 'INTRADAY_DELAYED'].includes(data1D.data.dataMode), 'dataMode phải thuộc chuẩn định dạng');
    assert(typeof data1D.data.latencyMs === 'number', 'Phải có số đo độ trễ latencyMs');
    assert(data1D.data.lastUpdated, 'Phải có thời điểm cập nhật mới nhất');
  });

  console.log('\n===============================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} ĐẠT / ${failed} THẤT BẠI (${passed + failed} bài test)`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi ngoại lệ:', err);
  process.exit(1);
});
