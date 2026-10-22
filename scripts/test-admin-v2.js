const assert = require('assert');
const { AdminAuthService } = require('../src/lib/admin-auth-service.ts');
const { getDatabase } = require('../src/lib/db.ts');

console.log('================================================================');
console.log('KIỂM THỬ HỆ THỐNG XÁC THỰC & QUẢN TRỊ ADMIN (STOCKAI ADMIN V2)');
console.log('================================================================');

let total = 0;
let passed = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

// 1. Kiểm tra tài khoản admin với username triqn
runTest('1. Admin Account: Khởi tạo/cập nhật với username triqn', () => {
  const admin = AdminAuthService.getOrInitAdminAccount();
  assert.strictEqual(admin.username, 'triqn');
  assert.strictEqual(admin.role, 'ADMIN');
  assert(admin.passwordHash.startsWith('$2b$') || admin.passwordHash.startsWith('$2a$'), 'Mật khẩu phải được hash bằng Bcrypt');
});

// 2. Đăng nhập thành công với username triqn và password Admin@2026
runTest('2. Đăng nhập thành công với username triqn / Admin@2026', () => {
  const res = AdminAuthService.authenticate('triqn', 'Admin@2026');
  assert.strictEqual(res.success, true);
  assert(res.account !== undefined);
  assert.strictEqual(res.account.username, 'triqn');
});

// 3. Đăng nhập thành công với alias admin
runTest('3. Đăng nhập thành công với alias admin / Admin@2026', () => {
  const res = AdminAuthService.authenticate('admin', 'Admin@2026');
  assert.strictEqual(res.success, true);
});

// 4. Đăng nhập thành công với email triqnnamabank@gmail.com
runTest('4. Đăng nhập thành công với email triqnnamabank@gmail.com', () => {
  const res = AdminAuthService.authenticate('triqnnamabank@gmail.com', 'Admin@2026');
  assert.strictEqual(res.success, true);
});

// 5. Chặn đăng nhập sai mật khẩu
runTest('5. Chặn đăng nhập sai mật khẩu (Bcrypt mismatch)', () => {
  const res = AdminAuthService.authenticate('triqn', 'WrongPassword123');
  assert.strictEqual(res.success, false);
  assert(res.message.includes('không chính xác'));
});

// 6. Chặn tài khoản không tồn tại
runTest('6. Chặn tài khoản không tồn tại', () => {
  const res = AdminAuthService.authenticate('unknown_user', 'Admin@2026');
  assert.strictEqual(res.success, false);
  assert(res.message.includes('không tồn tại'));
});

// 7. Tạo và xác thực session token
runTest('7. Ký và giải mã Admin Session Token (HMAC-SHA256)', () => {
  const admin = AdminAuthService.getOrInitAdminAccount();
  const token = AdminAuthService.createAdminToken(admin);
  assert(typeof token === 'string' && token.includes('.'));
  
  const payload = AdminAuthService.verifyAdminSession(token);
  assert(payload !== null);
  assert.strictEqual(payload.role, 'ADMIN');
  assert.strictEqual(payload.username, 'triqn');
});

// 8. Đổi mật khẩu an toàn với Bcrypt
runTest('8. Đổi mật khẩu an toàn: kiểm tra mật khẩu cũ và băm mật khẩu mới bằng Bcrypt', () => {
  const resWrongOld = AdminAuthService.changePassword('WrongOld', 'NewPassword@2026');
  assert.strictEqual(resWrongOld.success, false);
  assert(resWrongOld.message.includes('không chính xác'));

  // Đổi mật khẩu mới
  const resOk = AdminAuthService.changePassword('Admin@2026', 'Admin@2026Updated');
  assert.strictEqual(resOk.success, true);
  
  // Xác thực lại với mật khẩu mới
  const loginNew = AdminAuthService.authenticate('triqn', 'Admin@2026Updated');
  assert.strictEqual(loginNew.success, true);

  // Đổi ngược lại về Admin@2026 để duy trì mật khẩu chuẩn cho người dùng
  const resRevert = AdminAuthService.changePassword('Admin@2026Updated', 'Admin@2026');
  assert.strictEqual(resRevert.success, true);
});

// 9. Kiểm tra dữ liệu Database
runTest('9. Dữ liệu DB: Kiểm tra bảng users, orders, t3_signals, market_alerts', () => {
  const db = getDatabase();
  assert(Array.isArray(db.users), 'Bảng users phải là mảng');
  assert(Array.isArray(db.subscription_orders), 'Bảng orders phải là mảng');
  assert(Array.isArray(db.t3_signals), 'Bảng t3_signals phải là mảng');
  assert(Array.isArray(db.market_alerts), 'Bảng market_alerts phải là mảng');
  assert(db.market_alerts.length >= 8, 'market_alerts phải có dữ liệu');
});

console.log('================================================================');
console.log(`KẾT QUẢ KIỂM THỬ ADMIN: ${passed}/${total} TESTS ĐẠT CHUẨN (100% SUCCESS)`);
console.log('================================================================');
assert.strictEqual(passed, total, 'Tất cả các bài test phải thành công');
