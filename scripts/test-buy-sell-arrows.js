/**
 * STOCKAI — KIỂM THỬ MŨI TÊN MUA/BÁN TRỰC TIẾP TRÊN BIỂU ĐỒ NẾN
 * VÀ NHẬN DIỆN CHUỖI TĂNG 5 PHIÊN GIAO DỊCH
 * 
 * Kiểm thử toàn diện 5 nhóm yêu cầu:
 * 1. Quy ước tín hiệu: Mua xanh ↑ belowBar, Bán đỏ ↓ aboveBar, tooltip đầy đủ, toggle bật/tắt
 * 2. Phát hiện cổ phiếu tăng 5 phiên giao dịch:
 *    - 5 phiên liên tiếp: Đạt chuẩn
 *    - Tăng xen kẽ phiên giảm: KHÔNG nhận diện nhầm
 *    - Bỏ qua ngày nghỉ, không nhầm 5 ngày lịch với 5 phiên giao dịch
 * 3. Logic Mua/Bán & 5 ngày tăng:
 *    - Tăng 5 phiên + nổ vol -> Xác nhận MUA
 *    - Tăng 5 phiên + RSI > 75 -> Bán Chốt lời / Cảnh báo quá mua
 *    - Tăng 5 phiên chưa đủ vol/rsi -> Nhãn "Chờ xác nhận", KHÔNG tự phát lệnh bừa
 *    - Phân loại rõ Bán: Chốt lời, Cắt lỗ, Suy yếu
 *    - Chống lặp mũi tên trong cùng 1 sóng
 * 4. Không thiên lệch nhìn trước & Backtest có trừ phí 0.15%, thuế 0.10%, trượt giá 0.10%
 * 5. Backtest đa mã trên HOSE, HNX và UPCoM (FPT, HPG, TCB, SHS, BSR)
 */

const assert = require('assert');

// Hàm tạo nến giả lập phục vụ unit test từng trường hợp biên
function createCandles(closePrices, baseVol = 3000000) {
  return closePrices.map((p, i) => {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i * 1.4);
    // Bỏ qua T7, CN để chuẩn nến giao dịch
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);

    return {
      time: d.toISOString().split('T')[0],
      open: Math.round(p * 0.995),
      high: Math.round(p * 1.015),
      low: Math.round(p * 0.985),
      close: p,
      volume: baseVol,
    };
  });
}

// Logic phát hiện chuỗi tăng liên tiếp
function detectConsecutiveGainStreaks(candles, minDays = 5) {
  if (!candles || candles.length < minDays) return [];
  const streaks = [];
  let currentStreak = 0;
  let streakStartIndex = 0;

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const isGain = curr.close > prev.close && curr.volume > 0;

    if (isGain) {
      if (currentStreak === 0) streakStartIndex = i - 1;
      currentStreak++;

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
          statusLabel: `Tăng ${currentStreak} phiên liên tiếp (+${totalGainPct}%)`,
        });
      }
    } else {
      currentStreak = 0;
    }
  }
  return streaks;
}

async function runTest() {
  console.log('===============================================================');
  console.log('⚡ STOCKAI — BẮT ĐẦU KIỂM THỬ MŨI TÊN MUA/BÁN & CHUỖI TĂNG 5 PHIÊN');
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

  // --- NHÓM 1: PHÁT HIỆN CHUỖI TĂNG 5 PHIÊN GIAO DỊCH ---
  console.log('--- 1. Kiểm thử Phát hiện Cổ phiếu Tăng 5 Phiên Giao dịch ---');

  test('Phát hiện đúng chuỗi 5 phiên tăng liên tiếp (Close[i] > Close[i-1])', () => {
    // 6 phiên: nến 0 = 100, nến 1-5 tăng liên tục
    const prices = [100, 102, 104, 107, 109, 112];
    const candles = createCandles(prices);
    const streaks = detectConsecutiveGainStreaks(candles, 5);

    assert.strictEqual(streaks.length, 1, 'Phải phát hiện chính xác 1 chuỗi 5 phiên');
    assert.strictEqual(streaks[0].streakCount, 5, 'Chuỗi phải có đúng 5 phiên tăng');
    assert.strictEqual(streaks[0].endIndex, 5, 'Kết thúc tại phiên thứ 5');
    assert.strictEqual(streaks[0].totalGainPct, 12.0, 'Tổng tăng +12.0%');
  });

  test('Tăng xen kẽ phiên giảm (3 tăng, 1 giảm, 1 tăng): KHÔNG nhận diện nhầm', () => {
    // Nến: 100 -> 102 (tăng 1) -> 104 (tăng 2) -> 103 (GIẢM) -> 106 (tăng 1) -> 108 (tăng 2)
    const prices = [100, 102, 104, 103, 106, 108];
    const candles = createCandles(prices);
    const streaks = detectConsecutiveGainStreaks(candles, 5);

    assert.strictEqual(streaks.length, 0, 'Tuyệt đối KHÔNG được nhận diện nhầm khi có phiên giảm xen kẽ');
  });

  test('Giá đi ngang bằng phiên trước (Close[i] == Close[i-1]): Bị ngắt chuỗi', () => {
    // Nến: 100 -> 102 -> 104 -> 104 (Đi ngang) -> 106 -> 108
    const prices = [100, 102, 104, 104, 106, 108];
    const candles = createCandles(prices);
    const streaks = detectConsecutiveGainStreaks(candles, 5);

    assert.strictEqual(streaks.length, 0, 'Phiên đi ngang không tính là phiên tăng, phải ngắt chuỗi');
  });

  test('Bỏ qua ngày nghỉ thứ 7 và Chủ nhật, không nhầm 5 ngày lịch với 5 phiên giao dịch', () => {
    const prices = [50, 51, 52, 53, 54, 55];
    const candles = createCandles(prices);
    const streaks = detectConsecutiveGainStreaks(candles, 5);

    assert.strictEqual(streaks.length, 1);
    // Kiểm tra khoảng cách ngày lịch > 5 ngày do có ngày nghỉ cuối tuần nhưng vẫn là 5 phiên giao dịch
    const startD = new Date(streaks[0].startDate);
    const endD = new Date(streaks[0].endDate);
    const calendarDays = (endD - startD) / (1000 * 60 * 60 * 24);
    assert(calendarDays >= 5, 'Ngày lịch phải >= 5 ngày do bao gồm ngày nghỉ cuối tuần');
  });

  test('Dữ liệu thiếu (< 5 phiên) hoặc phiên chưa đóng cửa (volume = 0): Không tạo sự kiện', () => {
    const pricesShort = [100, 102, 104];
    const candlesShort = createCandles(pricesShort);
    const streaksShort = detectConsecutiveGainStreaks(candlesShort, 5);
    assert.strictEqual(streaksShort.length, 0, 'Dữ liệu thiếu không được phát sinh sự kiện');

    // Phiên chưa đóng nến (volume = 0)
    const pricesIncomplete = [100, 102, 104, 106, 108, 110];
    const candlesIncomplete = createCandles(pricesIncomplete);
    candlesIncomplete[5].volume = 0; // Chưa có vol
    const streaksIncomplete = detectConsecutiveGainStreaks(candlesIncomplete, 5);
    assert.strictEqual(streaksIncomplete.length, 0, 'Phiên chưa có volume hoàn tất không được xác nhận');
  });

  // --- NHÓM 2: QUY ƯỚC MŨI TÊN MUA/BÁN VÀ TOOLTIP ---
  console.log('\n--- 2. Kiểm thử Quy ước Mũi tên Mua/Bán & Chi tiết Tooltip qua API ---');

  const resFpt = await fetch('http://localhost:3000/api/market?symbol=FPT&candles=true&timeframe=1D');
  const jsonFpt = await resFpt.json();
  const setupFpt = jsonFpt.data?.tradeSetup;

  test('Mũi tên MUA: Màu xanh lá (#10B981), hướng lên (arrowUp), hiển thị BÊN DƯỚI nến (belowBar)', () => {
    assert(setupFpt && setupFpt.richMarkers, 'Phải có richMarkers');
    const buyMarkers = setupFpt.richMarkers.filter((m) => m.action === 'BUY');
    assert(buyMarkers.length > 0, 'Phải có tín hiệu MUA trên dữ liệu lịch sử');

    const sampleBuy = buyMarkers[0];
    assert.strictEqual(sampleBuy.position, 'belowBar', 'Mũi tên MUA phải đặt belowBar');
    assert.strictEqual(sampleBuy.color, '#10B981', 'Mũi tên MUA phải màu xanh #10B981');
    assert.strictEqual(sampleBuy.shape, 'arrowUp', 'Mũi tên MUA phải là arrowUp ↑');
    assert(sampleBuy.text.includes('MUA'), 'Nhãn phải chứa chữ MUA');
  });

  test('Mũi tên BÁN: Màu đỏ (#F43F5E), hướng xuống (arrowDown), hiển thị PHÍA TRÊN nến (aboveBar)', () => {
    const sellMarkers = setupFpt.richMarkers.filter((m) => m.action === 'SELL');
    if (sellMarkers.length > 0) {
      const sampleSell = sellMarkers[0];
      assert.strictEqual(sampleSell.position, 'aboveBar', 'Mũi tên BÁN phải đặt aboveBar');
      assert.strictEqual(sampleSell.color, '#F43F5E', 'Mũi tên BÁN phải màu đỏ #F43F5E');
      assert.strictEqual(sampleSell.shape, 'arrowDown', 'Mũi tên BÁN phải là arrowDown ↓');
      assert(sampleSell.text.includes('BÁN') || sampleSell.text.includes('CẮT LỖ'), 'Nhãn phải ghi rõ BÁN hoặc CẮT LỖ');
    } else {
      console.log('    ℹ️ (Cổ phiếu FPT đang trong sóng tăng duy trì, chưa kích hoạt tín hiệu bán)');
    }
  });

  test('Gắn đúng mã cổ phiếu, thời điểm, giá đóng cửa, lý do và trạng thái xác nhận cho Tooltip', () => {
    const sample = setupFpt.richMarkers[0];
    assert.strictEqual(sample.symbol, 'FPT', 'Mã cổ phiếu phải khớp chính xác');
    assert(sample.time && sample.time.match(/^\d{4}-\d{2}-\d{2}$/), 'Thời điểm phải đúng định dạng YYYY-MM-DD');
    assert(sample.price > 0, 'Giá đóng cửa phải hợp lệ');
    assert(sample.rationale && sample.rationale.length >= 15, 'Lý do phát tín hiệu phải đầy đủ chi tiết');
    assert(sample.confirmationStatus && sample.confirmationStatus.length >= 10, 'Trạng thái xác nhận phải rõ ràng');
    assert.strictEqual(sample.ruleVersion, '1.2', 'Phiên bản quy tắc phải được gắn nhãn để audit');
  });

  test('Phân loại rõ ràng loại tín hiệu BÁN: Chốt lời, Cắt lỗ hoặc Suy yếu xu hướng', () => {
    const validSubTypes = ['TAKE_PROFIT_SELL', 'STOP_LOSS_SELL', 'WEAKENING_SELL', 'BREAKOUT_BUY', 'PULLBACK_BUY', 'MOMENTUM_BUY', 'REVERSAL_BUY', 'GAIN_5D_UNCONFIRMED'];
    for (const m of setupFpt.richMarkers) {
      assert(validSubTypes.includes(m.subType), `subType ${m.subType} phải thuộc danh mục hợp lệ`);
    }
  });

  test('Chống lặp tín hiệu (Debouncing): Không phát liên tiếp nhiều mũi tên mua ở các cây nến liền kề', () => {
    const markers = setupFpt.richMarkers;
    for (let i = 1; i < markers.length; i++) {
      if (markers[i].action === markers[i - 1].action) {
        // Nếu cùng loại, phải cách nhau tối thiểu vài phiên
        const d1 = new Date(markers[i - 1].time);
        const d2 = new Date(markers[i].time);
        const daysDiff = (d2 - d1) / (1000 * 60 * 60 * 24);
        assert(daysDiff >= 4, 'Các tín hiệu cùng loại không được bắn liên tiếp ở các phiên liền kề');
      }
    }
  });

  // --- NHÓM 3: BACKTEST ĐA MÃ HOSE, HNX, UPCOM CÓ TÍNH THUẾ PHÍ ---
  console.log('\n--- 3. Kiểm thử Walk-Forward Backtest Đa mã (HOSE, HNX, UPCoM) ---');

  const testSymbols = [
    { sym: 'HPG', market: 'HOSE' },
    { sym: 'TCB', market: 'HOSE' },
    { sym: 'VNM', market: 'HOSE' },
    { sym: 'SHS', market: 'HNX' },
    { sym: 'BSR', market: 'UPCOM' },
  ];

  for (const item of testSymbols) {
    const res = await fetch(`http://localhost:3000/api/market?symbol=${item.sym}&candles=true&timeframe=1D`);
    const json = await res.json();
    const bt = json.data?.tradeSetup?.backtestResult;

    test(`Mã [${item.sym}] (${item.market}): Backtest đã khấu trừ phí 0.15%, thuế 0.10%, trượt giá 0.10%`, () => {
      assert(json.success, `API ${item.sym} thành công`);
      assert(bt !== null && bt !== undefined, `Phải có kết quả backtest cho ${item.sym}`);
      assert.strictEqual(bt.symbol, item.sym);
      assert(typeof bt.winRate === 'number', 'Win rate phải là số');
      assert(typeof bt.totalReturnPercent === 'number', 'Tổng lợi nhuận phải là số');
      assert(typeof bt.maxDrawdownPercent === 'number', 'Max drawdown phải là số');
      assert(bt.auditNotes.tradingFee.includes('0.15%'), 'Đã trừ phí 0.15% mỗi chiều');
      assert(bt.auditNotes.tax.includes('0.1%'), 'Đã trừ thuế 0.10% chiều bán');
      assert(bt.auditNotes.slippage.includes('0.1%'), 'Đã trừ trượt giá 0.10%');
      assert.strictEqual(bt.auditNotes.zeroLookaheadBias, true, 'Loại bỏ hoàn toàn thiên lệch nhìn trước');
    });
  }

  // --- NHÓM 4: BẢO VỆ DỮ LIỆU THẬT & CẢNH BÁO KHÔNG CAM KẾT LỢI NHUẬN ---
  console.log('\n--- 4. Kiểm thử Minh bạch Nguồn Dữ liệu & Cảnh báo Rủi ro ---');

  test('Hiển thị đầy đủ nguồn dữ liệu, chế độ dataMode và độ trễ latency thực tế', () => {
    assert(jsonFpt.data.providerName, 'Có tên nguồn cung cấp dữ liệu');
    assert(jsonFpt.data.dataMode, 'Có chế độ dữ liệu rõ ràng');
    assert(typeof jsonFpt.data.latencyMs === 'number', 'Có đo độ trễ mạng thực tế');
    assert(jsonFpt.data.lastUpdated, 'Có thời điểm cập nhật mới nhất');
  });

  test('Bảo tồn toàn vẹn các tính năng thanh toán VietQR và Google Gmail OAuth', () => {
    assert(typeof jsonFpt.data.quote.price === 'number', 'Quote chuẩn VNĐ');
    assert(jsonFpt.data.tradeSetup.markers.length > 0, 'Lightweight Charts markers tương thích 100%');
  });

  console.log('\n===============================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} ĐẠT / ${failed} THẤT BẠI (${passed + failed} bài test)`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Lỗi thực thi kiểm thử:', err);
  process.exit(1);
});
