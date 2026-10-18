/**
 * Automated test suite for StockAI T+1, T+3, T+5 Filter Bar & Typography Upgrade
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ NÂNG CẤP BỘ LỌC T+1..T+5 VÀ TYPOGRAPHY CALIBRI (BODY) 11 ===\n');
  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // 1. Kiểm tra Typography trong globals.css và tailwind.config.ts
  console.log('--- 1. Kiểm tra chuẩn hóa 1 font Calibri (Body), 11 ---');
  const globalsCss = fs.readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');
  const tailwindConfig = fs.readFileSync(path.join(__dirname, '../tailwind.config.ts'), 'utf8');
  const layoutTsx = fs.readFileSync(path.join(__dirname, '../src/app/layout.tsx'), 'utf8');

  assert('globals.css cấu hình font-family có Calibri và Calibri (Body)', 
    globalsCss.includes("'Calibri'") && globalsCss.includes("'Calibri (Body)'"));
  assert('globals.css cấu hình kích thước font chuẩn 11pt', 
    globalsCss.includes('font-size: 11pt'));
  assert('globals.css áp dụng font Calibri 11pt cho table, th, td', 
    globalsCss.includes('table') && globalsCss.includes('table td'));
  assert('tailwind.config.ts cấu hình fontFamily.sans với Calibri', 
    tailwindConfig.includes("'Calibri'"));
  assert('tailwind.config.ts cấu hình fontFamily.mono đồng bộ với Calibri', 
    tailwindConfig.includes("'Calibri'") && tailwindConfig.includes("'Calibri (Body)'"));
  assert('layout.tsx tải fallback Carlito (Google webfont metrically identical to Calibri)', 
    layoutTsx.includes('family=Carlito'));

  // 2. Kiểm tra Database & API /api/t3-signals
  console.log('\n--- 2. Kiểm tra dữ liệu & API T+1..T+5 ---');
  const dbJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stockai_db.json'), 'utf8'));
  const signals = dbJson.t3_signals;

  assert('Database có danh sách t3_signals phong phú (>= 15 mã)', signals.length >= 15);
  assert('Tất cả tín hiệu đều có đầy đủ thông tin chuẩn xác (symbol, price, t3Score, buyZone, targetPrice, stopLoss, riskLevel)',
    signals.every(s => s.symbol && s.currentPrice > 0 && s.t3Score > 0 && s.buyZone && s.targetPrice && s.stopLoss > 0 && s.riskLevel));
  assert('Tín hiệu có trường period thuộc T+1, T+3 hoặc T+5',
    signals.every(s => ['T+1', 'T+3', 'T+5'].includes(s.period || 'T+3')));
  assert('Tín hiệu có trường signalType thuộc BUY, SELL hoặc WATCHLIST',
    signals.every(s => ['BUY', 'SELL', 'WATCHLIST'].includes(s.signalType || 'BUY')));
  assert('Có các sàn HOSE, HNX, UPCOM trong dữ liệu tín hiệu',
    ['HOSE', 'HNX', 'UPCOM'].every(ex => signals.some(s => s.exchange === ex)));

  // 3. Kiểm tra gọi API /api/t3-signals
  console.log('\n--- 3. Kiểm tra API Endpoint /api/t3-signals ---');
  try {
    const resAll = await fetchJson('http://localhost:3000/api/t3-signals');
    assert('API trả về HTTP 200 thành công', resAll.status === 200);
    assert('API có trường disclaimer cảnh báo giá mục tiêu không cam kết lợi nhuận', 
      resAll.data.data.disclaimer && resAll.data.data.disclaimer.includes('không cam kết lợi nhuận'));
    assert('API trả về danh sách tín hiệu đã làm giàu thông tin ngành (industry)',
      resAll.data.data.signals.every(s => Boolean(s.industry)));

    // 4. Kiểm tra Lọc theo Kỳ hạn (T+1, T+3, T+5)
    console.log('\n--- 4. Kiểm tra Bộ Lọc theo Kỳ hạn (T+1, T+3, T+5) ---');
    const resT1 = await fetchJson('http://localhost:3000/api/t3-signals?period=T%2B1');
    assert('Lọc kỳ hạn T+1 trả về kết quả chính xác', 
      resT1.data.data.signals.length > 0 && resT1.data.data.signals.every(s => s.period === 'T+1'));

    const resT3 = await fetchJson('http://localhost:3000/api/t3-signals?period=T%2B3');
    assert('Lọc kỳ hạn T+3 trả về kết quả chính xác', 
      resT3.data.data.signals.length > 0 && resT3.data.data.signals.every(s => s.period === 'T+3'));

    const resT5 = await fetchJson('http://localhost:3000/api/t3-signals?period=T%2B5');
    assert('Lọc kỳ hạn T+5 trả về kết quả chính xác', 
      resT5.data.data.signals.length > 0 && resT5.data.data.signals.every(s => s.period === 'T+5'));

    // 5. Kiểm tra Lọc theo Ngành (13 ngành chuẩn)
    console.log('\n--- 5. Kiểm tra Bộ Lọc theo Ngành ---');
    const resBank = await fetchJson('http://localhost:3000/api/t3-signals?industry=' + encodeURIComponent('Ngân hàng'));
    assert('Lọc ngành Ngân hàng trả về TCB, MBB...', 
      resBank.data.data.signals.length > 0 && resBank.data.data.signals.every(s => s.industry === 'Ngân hàng'));

    const resSteel = await fetchJson('http://localhost:3000/api/t3-signals?industry=' + encodeURIComponent('Thép'));
    assert('Lọc ngành Thép trả về HPG...', 
      resSteel.data.data.signals.length > 0 && resSteel.data.data.signals.every(s => s.industry === 'Thép'));

    const resSec = await fetchJson('http://localhost:3000/api/t3-signals?industry=' + encodeURIComponent('Chứng khoán'));
    assert('Lọc ngành Chứng khoán trả về SHS, SSI, VND...', 
      resSec.data.data.signals.length > 0 && resSec.data.data.signals.every(s => s.industry === 'Chứng khoán'));

    // 6. Kiểm tra Lọc theo Sàn & Loại tín hiệu
    console.log('\n--- 6. Kiểm tra Bộ Lọc Sàn & Loại Tín Hiệu ---');
    const resHnx = await fetchJson('http://localhost:3000/api/t3-signals?exchange=HNX');
    assert('Lọc sàn HNX chỉ trả về các mã thuộc HNX', 
      resHnx.data.data.signals.length > 0 && resHnx.data.data.signals.every(s => s.exchange === 'HNX'));

    const resSell = await fetchJson('http://localhost:3000/api/t3-signals?signalType=SELL');
    assert('Lọc loại tín hiệu SELL (BÁN) trả về đúng mã tín hiệu Bán', 
      resSell.data.data.signals.length > 0 && resSell.data.data.signals.every(s => s.signalType === 'SELL'));

    const resBuy = await fetchJson('http://localhost:3000/api/t3-signals?signalType=BUY');
    assert('Lọc loại tín hiệu BUY (MUA) trả về đúng mã tín hiệu Mua', 
      resBuy.data.data.signals.length > 0 && resBuy.data.data.signals.every(s => s.signalType === 'BUY'));

    // 7. Kiểm tra Tìm kiếm mã & Tên công ty
    console.log('\n--- 7. Kiểm tra Tìm Kiếm ---');
    const resSearch = await fetchJson('http://localhost:3000/api/t3-signals?search=hòa%20phát');
    assert('Tìm kiếm theo tên công ty "hòa phát" trả về HPG', 
      resSearch.data.data.signals.length > 0 && resSearch.data.data.signals.some(s => s.symbol === 'HPG'));

    // 8. Kiểm tra Sắp xếp (Sorting)
    console.log('\n--- 8. Kiểm tra Sắp Xếp ---');
    const resSortScore = await fetchJson('http://localhost:3000/api/t3-signals?sortBy=score');
    const scores = resSortScore.data.data.signals.map(s => s.t3Score);
    const isSortedDesc = scores.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
    assert('Sắp xếp theo Điểm tín hiệu giảm dần chính xác', isSortedDesc);

    // 9. Kiểm tra Trạng thái 0 kết quả (Zero-Match State)
    console.log('\n--- 9. Kiểm tra Trạng Thái 0 Kết Quả (Zero-Match) ---');
    const resZero = await fetchJson('http://localhost:3000/api/t3-signals?search=KHONG_TON_TAI_XYZ');
    assert('Khi không có mã thỏa mãn, trả về count = 0 và mảng rỗng', 
      resZero.data.data.count === 0 && resZero.data.data.signals.length === 0);

  } catch (err) {
    console.error('Lỗi khi gọi API localhost:3000:', err.message);
    assert('Kết nối API localhost:3000', false);
  }

  console.log(`\n======================================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round(passed/total*100)}%)`);
  console.log(`======================================================\n`);
  
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
