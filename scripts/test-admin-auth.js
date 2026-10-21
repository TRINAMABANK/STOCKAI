const http = require('http');
const crypto = require('crypto');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'stockai-secure-oauth-secret-token-key-2026';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, cookies, rawHeaders: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, cookies, rawHeaders: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function createNormalUserCookie() {
  const sessionData = {
    userId: 'usr_normal_123',
    email: 'normal_user@gmail.com',
    role: 'USER',
    tier: 'FREE',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  };
  const rawPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(rawPayload).digest('base64url');
  return `stockai_session=${rawPayload}.${signature}`;
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG XÁC THỰC ADMIN STOCKAI');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. KIỂM THỬ: Chưa đăng nhập truy cập API Admin
    console.log('--- 1. Kiểm thử: Chưa đăng nhập truy cập API Admin ---');
    const unauthCheck = await makeRequest('GET', '/api/admin/auth-check');
    assert(unauthCheck.status === 200, 'GET /api/admin/auth-check trả về 200');
    assert(unauthCheck.data.authenticated === false, 'auth-check báo authenticated === false khi chưa có cookie');

    const unauthOverview = await makeRequest('GET', '/api/admin/overview');
    assert(unauthOverview.status === 403, 'GET /api/admin/overview chặn 403 Forbidden khi chưa đăng nhập');
    console.log(`   Phản hồi chặn 403: ${unauthOverview.data?.message}`);

    // 2. KIỂM THỬ: Tài khoản người dùng thường (USER) truy cập API Admin
    console.log('\n--- 2. Kiểm thử: Người dùng thường (role: USER) truy cập API Admin ---');
    const normalCookie = createNormalUserCookie();
    const normalOverview = await makeRequest('GET', '/api/admin/overview', null, {
      Cookie: normalCookie,
    });
    assert(normalOverview.status === 403, 'Người dùng thường (role: USER) bị chặn 403 Forbidden tuyệt đối');
    console.log(`   Phản hồi chặn 403 với USER thường: ${normalOverview.data?.message}`);

    // 3. KIỂM THỬ: Đăng nhập sai mật khẩu
    console.log('\n--- 3. Kiểm thử: Đăng nhập sai mật khẩu ---');
    const wrongPwdRes = await makeRequest('POST', '/api/admin/login', {
      username: 'admin',
      password: 'WrongPassword@999',
    });
    assert(wrongPwdRes.status === 401, 'POST /api/admin/login trả về 401 Unauthorized khi sai mật khẩu');
    assert(wrongPwdRes.data.success === false, 'success === false khi sai mật khẩu');
    console.log(`   Thông điệp lỗi: ${wrongPwdRes.data.message}`);

    // 4. KIỂM THỬ: Đăng nhập đúng với admin / Admin@2026
    console.log('\n--- 4. Kiểm thử: Đăng nhập thành công với admin / Admin@2026 ---');
    const loginRes = await makeRequest('POST', '/api/admin/login', {
      username: 'admin',
      password: 'Admin@2026',
    });
    assert(loginRes.status === 200, 'POST /api/admin/login trả về 200 OK');
    assert(loginRes.data.success === true, 'Đăng nhập admin thành công');
    assert(loginRes.cookies.length > 0, 'Server trả về Set-Cookie cho phiên Admin');
    assert(loginRes.data.mustChangePassword === true, 'mustChangePassword === true trong lần đầu đăng nhập');
    console.log(`   Admin đã đăng nhập: username=${loginRes.data.user.username}, role=${loginRes.data.user.role}`);

    // Lấy cookie phiên trả về
    const adminCookie = loginRes.cookies.map((c) => c.split(';')[0]).join('; ');

    // 5. KIỂM THỬ: Truy cập API Admin với phiên đăng nhập hợp lệ
    console.log('\n--- 5. Kiểm thử: Truy cập API Admin với Cookie Admin đã cấp ---');
    const authCheckRes = await makeRequest('GET', '/api/admin/auth-check', null, {
      Cookie: adminCookie,
    });
    assert(authCheckRes.data.authenticated === true, 'auth-check báo authenticated === true');

    const authOverview = await makeRequest('GET', '/api/admin/overview', null, {
      Cookie: adminCookie,
    });
    assert(authOverview.status === 200, 'GET /api/admin/overview trả về 200 OK cho Admin hợp lệ');
    assert(authOverview.data.success === true, 'Overview trả về số liệu thực tế');
    console.log(`   Số liệu tổng quan: Total users = ${authOverview.data.data.kpis.totalUsers}, Revenue = ${authOverview.data.data.kpis.formattedRevenue}`);

    // 6. KIỂM THỬ: Đổi mật khẩu
    console.log('\n--- 6. Kiểm thử: Đổi mật khẩu Quản trị viên ---');
    const changePwdRes = await makeRequest('POST', '/api/admin/change-password', {
      currentPassword: 'Admin@2026',
      newPassword: 'NewSecurePassword@2026',
    }, {
      Cookie: adminCookie,
    });
    assert(changePwdRes.status === 200, 'POST /api/admin/change-password trả về 200 OK');
    assert(changePwdRes.data.success === true, 'Đổi mật khẩu thành công');

    // Kiểm tra mật khẩu cũ không còn đăng nhập được
    const oldLoginTry = await makeRequest('POST', '/api/admin/login', {
      username: 'admin',
      password: 'Admin@2026',
    });
    assert(oldLoginTry.status === 401, 'Mật khẩu cũ không còn hiệu lực sau khi đổi');

    // Kiểm tra mật khẩu mới đăng nhập thành công
    const newLoginTry = await makeRequest('POST', '/api/admin/login', {
      username: 'admin',
      password: 'NewSecurePassword@2026',
    });
    assert(newLoginTry.status === 200, 'Mật khẩu mới đăng nhập thành công');

    // Đổi lại mật khẩu khởi tạo chuẩn Admin@2026 để bàn giao sạch sẽ cho chủ dự án
    const newAdminCookie = newLoginTry.cookies.map((c) => c.split(';')[0]).join('; ');
    await makeRequest('POST', '/api/admin/change-password', {
      currentPassword: 'NewSecurePassword@2026',
      newPassword: 'Admin@2026',
    }, {
      Cookie: newAdminCookie,
    });
    console.log('   🧹 Đã đưa mật khẩu về lại chuẩn khởi tạo Admin@2026.');

    // 7. KIỂM THỬ: Đăng xuất
    console.log('\n--- 7. Kiểm thử: Đăng xuất Admin (POST /api/admin/logout) ---');
    const logoutRes = await makeRequest('POST', '/api/admin/logout', null, {
      Cookie: newAdminCookie,
    });
    assert(logoutRes.status === 200, 'POST /api/admin/logout trả về 200 OK');
    assert(logoutRes.cookies.some((c) => c.includes('stockai_admin_session=;')), 'Cookie phiên bị xóa khi đăng xuất');

    console.log('\n====================================================');
    console.log(`🎉 TỔNG KẾT KIỂM THỬ: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Lỗi khi chạy test:', err);
    process.exit(1);
  }
}

// Chờ 2 giây cho server sẵn sàng rồi chạy test
setTimeout(runTests, 2000);
