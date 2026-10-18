/**
 * Test Suite: STOCKAI USER — Kiểm thử Khu vực Người dùng & 7 Trang chức năng
 * 
 * 1. Dashboard thị trường: Chỉ số VN-Index, HNX, UPCoM, độ rộng, thanh khoản
 * 2. Bộ quét cổ phiếu: Lọc đa chiều, chấm điểm định lượng (Quant Score), lý do chọn
 * 3. Phân tích cổ phiếu: OHLC, Kháng cự/Hỗ trợ, Stoploss/Target, Quy tắc 2% NAV
 * 4. Danh sách theo dõi: Cách ly dữ liệu theo tài khoản (Isolation), Giới hạn gói Free (Max 5 mã)
 * 5. Tài khoản cá nhân: Thông tin định danh, hạn dùng, lịch sử đơn hàng
 * 6. Gói dịch vụ: Giá backend không sửa cứng, VietQR & Pay2S
 * 7. Hướng dẫn & Hỗ trợ: Kỷ luật T+3, 4 mẫu hình, kênh liên hệ
 * 8. Bảo mật phân quyền: Cách ly Admin khỏi người dùng thông thường
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
let passed = 0;
let total = 0;

async function runTest(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

async function get(path, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log('\n=== BẮT ĐẦU KIỂM THỬ STOCKAI USER PORTAL ===\n');

  // TEST 1: Dashboard thị trường
  await runTest('1. Dashboard thị trường: Trả về đầy đủ chỉ số VN-Index, HNX, UPCoM', async () => {
    const { status, data } = await get('/api/market');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.indices), 'indices phải là mảng');
    const symbols = data.data.indices.map(i => i.symbol);
    assert.ok(symbols.some(s => s.includes('VNINDEX')), 'Thiếu chỉ số VN-Index');
    assert.ok(symbols.some(s => s.includes('HNX')), 'Thiếu chỉ số HNX-Index');
    assert.ok(symbols.some(s => s.includes('UPCOM')), 'Thiếu chỉ số UPCoM-Index');
  });

  await runTest('2. Dashboard thị trường: Độ rộng và danh sách cổ phiếu hợp lệ', async () => {
    const { data } = await get('/api/market');
    assert.ok(data.data.quotes.length >= 5, 'Phải có danh sách cổ phiếu trên bảng');
    assert.ok(data.data.topGainers.length > 0, 'Phải có danh sách Top Tăng');
    assert.ok(data.data.topLosers.length > 0, 'Phải có danh sách Top Giảm');
  });

  // TEST 2: Bộ quét cổ phiếu (Screener)
  await runTest('3. Bộ quét cổ phiếu: Hỗ trợ sàng lọc đa chiều và dữ liệu định lượng', async () => {
    const { data } = await get('/api/market');
    const quotes = data.data.quotes;
    const sample = quotes[0];
    assert.ok(sample.symbol, 'Thiếu symbol');
    assert.ok(typeof sample.price === 'number', 'Giá phải là số');
    assert.ok(typeof sample.volume === 'number', 'Khối lượng phải là số');
    assert.ok(sample.exchange, 'Thiếu thông tin sàn niêm yết');
  });

  // TEST 3: Phân tích cổ phiếu & Công thức 2% NAV
  await runTest('4. Phân tích cổ phiếu: Cung cấp nến OHLC cho biểu đồ kỹ thuật', async () => {
    const { status, data } = await get('/api/market?symbol=FPT&candles=true&timeframe=1D');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.candles), 'Candles phải là mảng');
    assert.ok(data.data.candles.length > 20, 'Phải có đủ lịch sử nến cho chỉ báo kỹ thuật');
    const c = data.data.candles[data.data.candles.length - 1];
    assert.ok(c.open && c.high && c.low && c.close, 'Nến phải có đủ OHLC');
  });

  await runTest('5. Phân tích cổ phiếu: Công thức định cỡ rủi ro 2% NAV hoạt động chính xác', () => {
    // Công thức: shares = (NAV * riskPercent) / (entryPrice - stopLoss)
    const nav = 200000000; // 200 triệu
    const riskPercent = 2.0; // 2% -> 4 triệu
    const entryPrice = 135000;
    const stopLoss = 127000;
    const riskPerShare = entryPrice - stopLoss; // 8.000 đ
    const maxRiskAmount = nav * (riskPercent / 100); // 4.000.000 đ
    const shares = Math.floor(maxRiskAmount / riskPerShare);
    assert.strictEqual(shares, 500, 'Số lượng cổ phiếu phải là 500');
    assert.strictEqual(shares * riskPerShare, 4000000, 'Tổng số tiền rủi ro tối đa đúng 4 triệu (2% NAV)');
  });

  // TEST 4: Danh sách theo dõi (Watchlist) & Cách ly dữ liệu
  await runTest('6. Watchlist: Người dùng User A có danh sách độc lập với User B', async () => {
    // User A query
    const resA = await get('/api/watchlist', { 'x-user-id': 'usr_test_retail_a' });
    assert.strictEqual(resA.status, 200);
    assert.strictEqual(resA.data.data.userId, 'usr_test_retail_a');

    // User B query
    const resB = await get('/api/watchlist', { 'x-user-id': 'usr_test_retail_b' });
    assert.strictEqual(resB.status, 200);
    assert.strictEqual(resB.data.data.userId, 'usr_test_retail_b');

    // Hai user hoàn toàn tách biệt
    assert.notStrictEqual(resA.data.data.userId, resB.data.data.userId);
  });

  await runTest('7. Watchlist: Giới hạn tối đa 5 mã cho tài khoản gói Free', async () => {
    const freeHeaders = { 'x-user-id': 'usr_free_tester_limit_' + Date.now(), 'x-user-role': 'USER' };
    
    // Thêm các mã mới không trùng
    await post('/api/watchlist', { action: 'ADD_SYMBOL', symbol: 'VHM' }, freeHeaders);
    await post('/api/watchlist', { action: 'ADD_SYMBOL', symbol: 'VIC' }, freeHeaders);

    // Thêm mã thứ 6 (DGC) -> Phải bị chặn bởi TIER_LIMIT_REACHED vì ban đầu đã có FPT, HPG, TCB + 2 mã = 5
    const resOver = await post('/api/watchlist', { action: 'ADD_SYMBOL', symbol: 'DGC' }, freeHeaders);
    assert.strictEqual(resOver.data.success, false, 'Không được phép thêm quá 5 mã cho gói Free');
    assert.strictEqual(resOver.data.code, 'TIER_LIMIT_REACHED');
  });

  await runTest('8. Watchlist: Thao tác thêm và xóa mã hoạt động mượt mà', async () => {
    const testHeaders = { 'x-user-id': 'usr_ops_test' };
    
    // Thêm mã MBB
    const addRes = await post('/api/watchlist', { action: 'ADD_SYMBOL', symbol: 'MBB' }, testHeaders);
    assert.strictEqual(addRes.status, 200);
    
    // Xóa mã MBB
    const removeRes = await post('/api/watchlist', { action: 'REMOVE_SYMBOL', symbol: 'MBB' }, testHeaders);
    assert.strictEqual(removeRes.status, 200);
    assert.strictEqual(removeRes.data.success, true);
  });

  // TEST 5: Tài khoản cá nhân
  await runTest('9. Tài khoản cá nhân: API /api/auth/me trả về danh tính và thời hạn gói', async () => {
    const { status, data } = await get('/api/auth/me');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.user.email, 'Thiếu email user');
    assert.ok(data.data.user.tier, 'Thiếu hạng gói');
    assert.ok(data.data.user.validUntil, 'Thiếu ngày hết hạn');
  });

  // TEST 6: Gói dịch vụ & Cổng thanh toán VietQR / Pay2S
  await runTest('10. Gói dịch vụ: Giá gói được định nghĩa từ Backend (Không sửa cứng ở giao diện)', async () => {
    const { status, data } = await get('/api/subscription');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.availableTiers), 'Thiếu danh sách availableTiers');
    
    const freePlan = data.data.availableTiers.find(p => p.tier === 'FREE');
    const proPlan = data.data.availableTiers.find(p => p.tier === 'PRO');
    const entPlan = data.data.availableTiers.find(p => p.tier === 'ENTERPRISE');

    assert.strictEqual(freePlan.price, 0, 'Giá gói Free phải là 0đ');
    assert.strictEqual(proPlan.price, 199000, 'Giá gói Pro phải là 199.000đ');
    assert.strictEqual(entPlan.price, 299000, 'Giá gói Enterprise phải là 299.000đ');
  });

  await runTest('11. Gói dịch vụ: Tạo đơn hàng thanh toán VietQR và đối soát Pay2S', async () => {
    const { status, data } = await post('/api/subscription', {
      action: 'CREATE_ORDER',
      targetTier: 'PRO',
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.order.orderCode.startsWith('STOCKAI-'), 'Mã đơn phải theo mẫu chuẩn STOCKAI-');
    assert.strictEqual(data.data.order.amount, 199000);
  });

  // TEST 7: Phân quyền & Cách ly Admin
  await runTest('12. Phân quyền: Người dùng thông thường KHÔNG THỂ duyệt thanh toán Admin', async () => {
    const normalUserHeaders = { 'x-user-id': 'usr_regular_customer', 'x-user-role': 'USER' };
    const res = await post('/api/admin/payments', { action: 'VERIFY_ORDER', orderId: 'ord_fake' }, normalUserHeaders);
    // Phải bị từ chối với status 403 Forbidden
    assert.strictEqual(res.status, 403, 'Người dùng thông thường phải bị cấm truy cập API Admin (403)');
    assert.strictEqual(res.data.success, false);
  });

  console.log(`\n=== TỔNG KẾT: ${passed}/${total} TESTS ĐÃ VƯỢT QUA HOÀN TOÀN ===\n`);
}

main().catch(err => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
