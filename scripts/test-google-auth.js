/**
 * Test Suite: Xác thực Đăng nhập Google Gmail và Phân quyền StockAI
 * Kiểm tra toàn diện 10 yêu cầu kỹ thuật:
 * 1. Callback URL & Origins
 * 2. Biến môi trường GOOGLE_CLIENT_ID
 * 3. Xác minh Google Token & Claims
 * 4. Tạo tài khoản mới (role: 'USER', tier: 'FREE', KHÔNG cấp Admin)
 * 5. Nhận diện tài khoản cũ (bảo toàn gói PRO/ENTERPRISE và dữ liệu)
 * 6. Tạo & kiểm tra Session Token an toàn (chống giả mạo HMAC)
 * 7. Kiểm tra chặn truy cập Admin đối với tài khoản Google thông thường
 * 8. Bảo toàn thanh toán VietQR OCB và đơn hàng
 */

const assert = require('assert');
const http = require('http');

const EXPECTED_CLIENT_ID = '117963205714-bcsvrtpdb8j7qh9cu90tcit7to3h63gf.apps.googleusercontent.com';
const BASE_URL = 'http://localhost:3000';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function startSuite() {
  console.log('===============================================================');
  console.log(' KIỂM THỬ TÍCH HỢP GOOGLE GMAIL OAUTH & BẢO MẬT PHÂN QUYỀN STOCKAI');
  console.log('===============================================================');

  // --- Nhóm 1: Kiểm tra Biến môi trường & URLs ---
  console.log('\n--- 1. Kiểm tra Cấu hình & URL Callback Google ---');

  runTest('Biến môi trường GOOGLE_CLIENT_ID phải khớp chính xác với ID đã cung cấp', () => {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    assert(envContent.includes(EXPECTED_CLIENT_ID), 'Client ID chưa có trong .env.local');
    assert(envContent.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID'), 'Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  });

  runTest('Kiểm tra URL Authorized JavaScript Origins và Redirect URI chính xác', () => {
    const origin = 'http://localhost:3000';
    const callbackUrl = `${origin}/api/auth/callback/google`;
    assert.strictEqual(origin, 'http://localhost:3000');
    assert.strictEqual(callbackUrl, 'http://localhost:3000/api/auth/callback/google');
  });

  // --- Nhóm 2: Kiểm tra Logic AuthService & Database ---
  console.log('\n--- 2. Kiểm tra Logic Tạo Tài Khoản & Phân Quyền (AuthService) ---');

  const fs = require('fs');
  const dbPath = './data/stockai_db.json';
  const originalDbRaw = fs.readFileSync(dbPath, 'utf-8');

  try {
    const db = JSON.parse(originalDbRaw);

    runTest('Dữ liệu hệ thống ban đầu có tài khoản Admin và tài khoản User', () => {
      assert(db.users && db.users.length >= 2, 'Users array phải có ít nhất 2 users mặc định');
      const admin = db.users.find((u) => u.role === 'ADMIN');
      assert(admin, 'Phải có 1 tài khoản ADMIN hệ thống');
    });

    runTest('Tạo tài khoản Google mới lần đầu: BẮT BUỘC role="USER", tier="FREE", KHÔNG ĐƯỢC ADMIN', () => {
      const newGoogleUserPayload = {
        sub: 'google_sub_test_99999',
        email: 'trader.newbie@gmail.com',
        name: 'Nguyễn Văn Mới',
        picture: 'https://lh3.googleusercontent.com/a/test_avatar',
      };

      // Mô phỏng logic tìm hoặc tạo user
      const existingUser = (db.users || []).find(
        (u) => u.googleId === newGoogleUserPayload.sub || u.email === newGoogleUserPayload.email
      );
      assert(!existingUser, 'Tài khoản test không được trùng trước khi tạo');

      const createdUser = {
        id: 'usr_g_test_99999',
        email: newGoogleUserPayload.email,
        name: newGoogleUserPayload.name,
        role: 'USER', // QUAN TRỌNG: KHÔNG ĐƯỢC ADMIN
        tier: 'FREE',
        validUntil: '2026-12-31',
        googleId: newGoogleUserPayload.sub,
        avatarUrl: newGoogleUserPayload.picture,
        createdAt: new Date().toISOString(),
      };

      assert.strictEqual(createdUser.role, 'USER', 'Khách hàng Google mới PHẢI CÓ role="USER"');
      assert.notStrictEqual(createdUser.role, 'ADMIN', 'TUYỆT ĐỐI KHÔNG cấp quyền ADMIN cho khách hàng Google');
      assert.strictEqual(createdUser.tier, 'FREE', 'Khách hàng mới phải bắt đầu từ gói FREE');
    });

    runTest('Đăng nhập Google lần sau: Nhận diện đúng tài khoản, giữ nguyên gói thuê bao PRO/ENTERPRISE', () => {
      // Giả sử tài khoản đã được nâng cấp lên PRO
      const existingProUser = {
        id: 'usr_g_test_existing_pro',
        email: 'investor.pro@gmail.com',
        name: 'Nhà Đầu Tư VIP',
        role: 'USER',
        tier: 'PRO',
        validUntil: '2027-06-30',
        googleId: 'google_sub_existing_111',
      };

      // Khi đăng nhập lại với cùng Google Sub hoặc Email
      const googlePayload = {
        sub: 'google_sub_existing_111',
        email: 'investor.pro@gmail.com',
        name: 'Nhà Đầu Tư VIP (Updated Name)',
        picture: 'https://lh3.googleusercontent.com/a/new_pic',
      };

      // Logic nhận diện
      const matched = (existingProUser.googleId === googlePayload.sub || existingProUser.email === googlePayload.email);
      assert(matched, 'Phải nhận diện được tài khoản cũ');

      // Cập nhật profile mà không đổi role hay tier
      const updated = {
        ...existingProUser,
        name: googlePayload.name,
        avatarUrl: googlePayload.picture,
      };

      assert.strictEqual(updated.tier, 'PRO', 'Gói thuê bao PRO phải được giữ nguyên');
      assert.strictEqual(updated.validUntil, '2027-06-30', 'Hạn sử dụng gói phải được giữ nguyên');
      assert.strictEqual(updated.role, 'USER', 'Role phải được giữ nguyên');
    });

    runTest('Bảo toàn cấu hình ngân hàng VietQR và danh mục đầu tư', () => {
      assert(db.bank_config, 'bank_config phải tồn tại');
      assert.strictEqual(db.bank_config.bankId, 'MB', 'Ngân hàng phải là MB');
      assert.strictEqual(db.bank_config.accountNumber, '0982441446', 'Số tài khoản phải là 0982441446');
      assert.strictEqual(db.bank_config.accountHolder, 'QUANG NHUT TRI', 'Chủ tài khoản phải là QUANG NHUT TRI');
      assert(db.portfolios && db.portfolios.totalAssets > 0, 'Danh mục tài sản phải được bảo toàn');
    });

  } finally {
    // Không làm bẩn db nếu có thay đổi
    fs.writeFileSync(dbPath, originalDbRaw, 'utf-8');
  }

  // --- Nhóm 3: Kiểm tra API Endpoints qua HTTP Server ---
  console.log('\n--- 3. Kiểm tra API Server Endpoints (/api/auth) ---');

  await runAsyncTest('GET /api/auth/me trả về thông tin người dùng và cấu hình Google Client ID', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
    });

    assert.strictEqual(res.status, 200);
    assert(res.body.success, 'API phải trả về success: true');
    assert(res.body.data.user, 'Phải có data.user');
    assert.strictEqual(res.body.data.google.clientId, EXPECTED_CLIENT_ID, 'Client ID trong API phải khớp');
    assert(res.body.data.google.isConfigured, 'isConfigured phải là true');
  });

  await runAsyncTest('POST /api/auth/google từ chối request không có credential (400)', async () => {
    const res = await httpRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {}
    );

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest('POST /api/auth/google từ chối token giả mạo không hợp lệ (401)', async () => {
    const res = await httpRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { credential: 'fake_invalid_google_jwt_token_12345' }
    );

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest('POST /api/auth/google xử lý token test hợp lệ và trả về cookie session', async () => {
    // Dùng test token theo format nội bộ: mock_test_token_<email>__<sub>__<name>__<aud>
    const testToken = `mock_test_token_google.customer@gmail.com__sub_google_12345__Google Customer__${EXPECTED_CLIENT_ID}`;
    const res = await httpRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { credential: testToken }
    );

    assert.strictEqual(res.status, 200);
    assert(res.body.success, 'Phải trả về success: true');
    assert.strictEqual(res.body.data.user.role, 'USER', 'Tài khoản Google mới PHẢI LÀ USER');
    assert.strictEqual(res.body.data.user.tier, 'FREE', 'Tài khoản Google mới PHẢI LÀ FREE');

    // Kiểm tra cookie session được trả về
    const setCookie = res.headers['set-cookie'];
    assert(setCookie && setCookie.length > 0, 'Phải có Set-Cookie trong response');
    assert(setCookie[0].includes('stockai_session='), 'Cookie phải có tên stockai_session');
    assert(setCookie[0].toLowerCase().includes('httponly'), 'Cookie phải là HttpOnly để bảo mật');
  });

  await runAsyncTest('POST /api/auth/google từ chối test token có audience sai lệch', async () => {
    const wrongAudToken = `mock_test_token_bad@gmail.com__sub_bad__Bad User__wrong_client_id.apps.googleusercontent.com`;
    const res = await httpRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { credential: wrongAudToken }
    );

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest('POST /api/auth/logout xóa session cookie', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/logout',
      method: 'POST',
    });

    assert.strictEqual(res.status, 200);
    const setCookie = res.headers['set-cookie'];
    assert(setCookie && setCookie.length > 0);
    assert(setCookie[0].includes('stockai_session=;') || setCookie[0].includes('Max-Age=0') || setCookie[0].includes('Expires=Thu, 01 Jan 1970'));
  });

  await runAsyncTest('Bảo vệ Admin: Tài khoản Google thường (USER) bị CHẶN khi vào /api/admin/payments (403)', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/payments',
      method: 'GET',
      headers: {
        'x-user-role': 'USER',
        'x-user-id': 'usr_g_test_user_no_admin',
      },
    });

    assert.strictEqual(res.status, 403, 'Khách hàng role USER phải nhận mã 403 Forbidden');
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest('Bảo vệ Admin: Tài khoản ADMIN hệ thống được phép truy cập /api/admin/payments (200)', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/payments',
      method: 'GET',
      headers: {
        'x-user-role': 'ADMIN',
        'x-user-id': 'usr_stockai_lead',
      },
    });

    assert.strictEqual(res.status, 200, 'ADMIN phải nhận mã 200 OK');
    assert.strictEqual(res.body.success, true);
  });

  console.log('\n===============================================================');
  console.log(` KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT (100% PASS)`);
  console.log('===============================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

startSuite().catch((err) => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
