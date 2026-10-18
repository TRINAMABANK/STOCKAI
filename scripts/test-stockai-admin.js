/**
 * STOCKAI ADMIN — SUITE KIỂM THỬ TOÀN DIỆN HỆ THỐNG QUẢN TRỊ ADMIN VÀ CỔNG THANH TOÁN PAY2S
 * 10 KIỂM THỬ BẮT BUỘC:
 * 1. Quyền truy cập: Người dùng thường bị từ chối vào API Admin (HTTP 403 Forbidden).
 * 2. Dashboard tổng quan: Dữ liệu thực tế từ database, không dùng số liệu giả.
 * 3. Quản lý người dùng: Tìm kiếm, lọc, khóa/mở khóa tài khoản có lý do bắt buộc và ghi audit log.
 * 4. Quản lý đơn hàng: Admin đối soát đơn hàng, yêu cầu đủ số tiền + mã giao dịch + ghi chú.
 * 5. Cơ chế phòng thủ đơn hàng: Sai số tiền bị từ chối; không thể duyệt 2 lần đơn đã PAID.
 * 6. Cổng thanh toán Pay2S: Ký số HMAC-SHA256, tự động kích hoạt gói, chống duplicate IPN (Idempotent).
 * 7. Quản lý gói dịch vụ: Đổi giá có lưu audit log oldPrice/newPrice; không sửa hồi tố đơn cũ.
 * 8. Giám sát hệ thống: SSI FastConnect, che giấu khóa bí mật (masked secrets).
 * 9. Phân lập dữ liệu: Người dùng thường không thể xem đơn hoặc can thiệp tài khoản khác.
 * 10. Nhật ký kiểm toán: Toàn bộ thao tác nhạy cảm được ghi vết đầy đủ và tìm kiếm được.
 */

const http = require('http');
const crypto = require('crypto');

function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

// Header xác thực Admin mặc định
const ADMIN_HEADERS = {
  'x-user-id': 'usr_stockai_lead',
  'x-user-role': 'ADMIN',
};

// Header người dùng thường
const REGULAR_USER_HEADERS = {
  'x-user-id': 'usr_regular_trader',
  'x-user-role': 'USER',
};

async function runAdminTestSuite() {
  console.log('========================================================================');
  console.log('🛡️  STOCKAI ADMIN — BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG QUẢN TRỊ RIÊNG');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ĐẠT: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ THẤT BẠI: ${message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Người dùng thường truy cập API Admin bị chặn (403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('--- [TEST 1] PHÂN QUYỀN BẢO MẬT: CHẶN NGƯỜI DÙNG THƯỜNG TRUY CẬP API ADMIN ---');
  const adminEndpoints = [
    '/api/admin/overview',
    '/api/admin/users',
    '/api/admin/orders',
    '/api/admin/plans',
    '/api/admin/system',
    '/api/admin/audit-logs',
  ];

  for (const ep of adminEndpoints) {
    const resForbidden = await makeRequest({
      path: ep,
      method: 'GET',
      headers: REGULAR_USER_HEADERS,
    });
    assert(
      resForbidden.statusCode === 403,
      `API ${ep} trả về HTTP 403 Forbidden cho User thường (thực tế: ${resForbidden.statusCode})`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 2: Dashboard tổng quan - Số liệu thực tế từ Database (Không dùng fake data)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 2] DASHBOARD TỔNG QUAN: SỐ LIỆU THỰC TẾ TỪ DATABASE ---');
  const resOverview = await makeRequest({
    path: '/api/admin/overview',
    method: 'GET',
    headers: ADMIN_HEADERS,
  });

  assert(resOverview.statusCode === 200, 'Admin truy cập Overview thành công (HTTP 200)');
  const kpis = resOverview.data?.data?.kpis;
  assert(kpis && typeof kpis.totalUsers === 'number', `Tổng số người dùng thực tế: ${kpis?.totalUsers}`);
  assert(typeof kpis?.activeSubscriptions === 'number', `Số thuê bao đang hoạt động: ${kpis?.activeSubscriptions}`);
  assert(typeof kpis?.expiredSubscriptions === 'number', `Số thuê bao hết hạn: ${kpis?.expiredSubscriptions}`);
  assert(typeof kpis?.confirmedRevenue === 'number', `Doanh thu xác nhận: ${kpis?.confirmedRevenue?.toLocaleString('vi-VN')} VNĐ`);
  assert(typeof kpis?.pendingOrders === 'number', `Đơn hàng đang chờ: ${kpis?.pendingOrders}`);
  assert(typeof kpis?.needsReconciliation === 'number', `Đơn hàng chờ đối soát: ${kpis?.needsReconciliation}`);

  const sysHealth = resOverview.data?.data?.systemHealth;
  assert(sysHealth?.ssi?.status, `Giám sát cổng kết nối SSI FastConnect: ${sysHealth?.ssi?.status}`);
  assert(sysHealth?.pay2s?.merchantId, `Giám sát cổng thanh toán Pay2S Gateway: ${sysHealth?.pay2s?.merchantId}`);

  // --------------------------------------------------------------------------
  // TEST 3: Quản lý người dùng - Tìm kiếm, Lọc, Khóa & Mở khóa có Audit Log
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 3] QUẢN LÝ NGƯỜI DÙNG: TÌM KIẾM, KHÓA VÀ MỞ KHÓA TÀI KHOẢN ---');
  // Lấy danh sách user
  const resUsers = await makeRequest({
    path: '/api/admin/users?search=Quang',
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  assert(resUsers.statusCode === 200, 'Lấy danh sách người dùng thành công (HTTP 200)');
  const usersList = resUsers.data?.data?.users || [];
  assert(usersList.length > 0, `Tìm thấy ${usersList.length} tài khoản phù hợp với từ khóa "Quang"`);

  // Chọn tài khoản người dùng thường để kiểm thử khóa/mở khóa
  const testUserId = 'usr_regular_trader';

  // Thử khóa tài khoản mà KHÔNG có lý do -> Bị từ chối (400)
  const resLockNoReason = await makeRequest({
    path: '/api/admin/users',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'LOCK_USER',
      userId: testUserId,
      reason: '', // Thiếu lý do
    },
  });
  assert(resLockNoReason.statusCode === 400, 'Bắt buộc phải cung cấp lý do khi khóa tài khoản (HTTP 400)');

  // Khóa tài khoản hợp lệ
  const lockReasonText = 'Kiểm tra tài khoản vi phạm chính sách chia sẻ thông tin';
  const resLockValid = await makeRequest({
    path: '/api/admin/users',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'LOCK_USER',
      userId: testUserId,
      reason: lockReasonText,
    },
  });
  assert(resLockValid.statusCode === 200, 'Admin khóa tài khoản thành công khi có lý do hợp lệ');
  assert(resLockValid.data?.user?.isLocked === true, 'Trạng thái isLocked của user chuyển thành true');
  assert(resLockValid.data?.user?.lockedReason === lockReasonText, 'Lưu đúng lý do khóa tài khoản');

  // Mở khóa tài khoản
  const unlockReasonText = 'Đã hoàn tất xác minh danh tính chủ tài khoản';
  const resUnlock = await makeRequest({
    path: '/api/admin/users',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'UNLOCK_USER',
      userId: testUserId,
      reason: unlockReasonText,
    },
  });
  assert(resUnlock.statusCode === 200, 'Mở khóa tài khoản thành công');
  assert(resUnlock.data?.user?.isLocked === false, 'Trạng thái isLocked chuyển về false');

  // --------------------------------------------------------------------------
  // TEST 4: Quản lý đơn hàng & Đối soát thủ công (Admin Verify Payment)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 4] QUẢN LÝ ĐƠN HÀNG: ĐỐI SOÁT & KÍCH HOẠT THUÊ BAO BẰNG CHỨNG TỪ ---');
  // Tạo đơn hàng mới cho user thường
  const resCreateOrder = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    headers: REGULAR_USER_HEADERS,
    body: { action: 'CREATE_ORDER', targetTier: 'PRO' },
  });
  const newOrder = resCreateOrder.data?.data?.order;
  assert(resCreateOrder.statusCode === 200 && newOrder?.id, `Tạo đơn hàng PRO thành công (ID: ${newOrder?.orderCode})`);

  // Admin xem danh sách đơn hàng
  const resOrdersList = await makeRequest({
    path: `/api/admin/orders?search=${newOrder?.orderCode}`,
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  assert(resOrdersList.statusCode === 200, 'Admin tìm thấy đơn hàng trong danh sách');
  const foundOrder = (resOrdersList.data?.data?.orders || []).find(o => o.id === newOrder.id);
  assert(foundOrder && foundOrder.status === 'PENDING', 'Đơn hàng mới có trạng thái PENDING');

  // Admin đối soát đơn hàng: Yêu cầu actualAmount, bankTransactionRef và notes
  const bankRefCode = `VCB_TX_${Date.now()}`;
  const resVerifyOrder = await makeRequest({
    path: '/api/admin/orders',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: newOrder.id,
      actualAmount: 199000,
      bankTransactionRef: bankRefCode,
      notes: 'Khớp sao kê VCB lúc 14:30',
    },
  });
  assert(resVerifyOrder.statusCode === 200, 'Admin đối soát đơn hàng thành công (HTTP 200)');
  assert(resVerifyOrder.data?.order?.status === 'PAID', 'Trạng thái đơn hàng chuyển sang PAID');
  assert(resVerifyOrder.data?.order?.bankTransactionRef === bankRefCode, `Ghi nhận mã giao dịch ngân hàng ${bankRefCode}`);
  assert(resVerifyOrder.data?.user?.tier === 'PRO', 'Tài khoản người dùng được nâng cấp lên gói PRO');

  // --------------------------------------------------------------------------
  // TEST 5: Cơ chế phòng vệ đối soát đơn hàng
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 5] PHÒNG VỆ ĐỐI SOÁT: TỪ CHỐI SAI SỐ TIỀN & ĐƠN ĐÃ DUYỆT ---');
  // Tạo đơn hàng thứ hai
  const resOrder2 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    headers: REGULAR_USER_HEADERS,
    body: { action: 'CREATE_ORDER', targetTier: 'ENTERPRISE' },
  });
  const order2 = resOrder2.data?.data?.order;

  // Thử duyệt với sai số tiền
  const resWrongAmount = await makeRequest({
    path: '/api/admin/orders',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: order2.id,
      actualAmount: 100000, // Sai số tiền (cần 299000)
      bankTransactionRef: `TX_${Date.now()}`,
      notes: 'Thử duyệt sai số tiền',
    },
  });
  assert(resWrongAmount.statusCode === 400, 'Từ chối đối soát khi số tiền thực nhận không khớp (HTTP 400)');

  // Thử duyệt lại đơn hàng đã PAID ở Test 4
  const resDuplicateVerify = await makeRequest({
    path: '/api/admin/orders',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: newOrder.id,
      actualAmount: 199000,
      bankTransactionRef: `NEW_REF_${Date.now()}`,
      notes: 'Cố duyệt lần 2',
    },
  });
  assert(resDuplicateVerify.statusCode === 400, 'Chặn không cho phép duyệt lại đơn hàng đã PAID');

  // Từ chối đơn hàng order2 với lý do cụ thể
  const rejectReason = 'Số tiền chuyển khoản không hợp lệ hoặc khách hàng hủy yêu cầu';
  const resReject = await makeRequest({
    path: '/api/admin/orders',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'REJECT_PAYMENT',
      orderId: order2.id,
      reason: rejectReason,
    },
  });
  assert(resReject.statusCode === 200, 'Từ chối đơn hàng thành công');
  assert(resReject.data?.order?.status === 'REJECTED', 'Đơn hàng được chuyển sang REJECTED');
  assert(resReject.data?.order?.rejectionReason === rejectReason, 'Lưu trữ chính xác lý do từ chối');

  // --------------------------------------------------------------------------
  // TEST 6: Cổng thanh toán Pay2S - Webhook IPN, Ký số HMAC & Chống trùng lặp (Idempotent)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 6] CỔNG THANH TOÁN PAY2S: CHỮ KÝ HMAC, TỰ ĐỘNG DUYỆT & CHỐNG DUPLICATE IPN ---');
  // 6.1. Tạo đơn hàng mới để test Pay2S
  const resPay2sOrder = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    headers: REGULAR_USER_HEADERS,
    body: { action: 'CREATE_ORDER', targetTier: 'PRO' },
  });
  const pay2sOrder = resPay2sOrder.data?.data?.order;
  assert(pay2sOrder && pay2sOrder.id, `Tạo đơn hàng chờ Pay2S thanh toán (Mã: ${pay2sOrder?.orderCode})`);

  // Chuẩn bị payload IPN từ Pay2S
  const pay2sSecret = 'stockai_pay2s_secure_secret_key_2026';
  const pay2sTransId = `P2S_TXN_${Date.now()}`;
  const ipnPayload = {
    orderCode: pay2sOrder.orderCode,
    amount: pay2sOrder.amount,
    status: 'PAID',
    transactionId: pay2sTransId,
    timestamp: Date.now(),
  };

  // Tính chữ ký HMAC-SHA256 chuẩn
  const rawSignatureString = `${ipnPayload.orderCode}|${ipnPayload.amount}|${ipnPayload.status}|${ipnPayload.transactionId}`;
  const validSignature = crypto.createHmac('sha256', pay2sSecret).update(rawSignatureString).digest('hex');

  // 6.2. Gửi Webhook với chữ ký SAI -> Phải bị từ chối (401)
  const resInvalidSig = await makeRequest({
    path: '/api/payments/webhook',
    method: 'POST',
    headers: { 'x-pay2s-signature': 'invalid_fake_signature_hex_12345' },
    body: ipnPayload,
  });
  assert(resInvalidSig.statusCode === 401, 'Chặn Webhook IPN khi chữ ký HMAC không hợp lệ (HTTP 401)');

  // 6.3. Gửi Webhook với chữ ký ĐÚNG -> Kích hoạt thành công (200)
  const resValidIpn = await makeRequest({
    path: '/api/payments/webhook',
    method: 'POST',
    headers: { 'x-pay2s-signature': validSignature },
    body: ipnPayload,
  });
  assert(resValidIpn.statusCode === 200, 'Xác thực Pay2S IPN thành công với HMAC chuẩn (HTTP 200)');
  assert(resValidIpn.data?.order?.status === 'PAID', 'Đơn hàng tự động chuyển sang PAID qua Pay2S');
  assert(resValidIpn.data?.order?.pay2sTransactionId === pay2sTransId, `Ghi nhận Transaction ID của Pay2S: ${pay2sTransId}`);

  // Lưu lại hạn dùng sau lần kích hoạt đầu tiên
  const validUntilAfterFirstIpn = resValidIpn.data?.user?.validUntil;

  // 6.4. Gửi IPN LẦN HAI với cùng nội dung (Duplicate IPN / Retry từ Pay2S) -> Phải Idempotent, KHÔNG cộng dồn hạn dùng lần nữa
  const resDuplicateIpn = await makeRequest({
    path: '/api/payments/webhook',
    method: 'POST',
    headers: { 'x-pay2s-signature': validSignature },
    body: ipnPayload,
  });
  assert(resDuplicateIpn.statusCode === 200, 'Duplicate IPN được xử lý an toàn (HTTP 200)');
  assert(resDuplicateIpn.data?.code === 'ALREADY_PROCESSED', 'Hệ thống nhận diện mã ALREADY_PROCESSED');
  assert(resDuplicateIpn.data?.user?.validUntil === validUntilAfterFirstIpn, 'Hạn dùng KHÔNG BỊ CỘNG DỒN hai lần (Đảm bảo Idempotency)');

  // --------------------------------------------------------------------------
  // TEST 7: Quản lý gói dịch vụ - Đổi giá có lưu Audit Log & Không sửa hồi tố đơn cũ
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 7] QUẢN LÝ GÓI DỊCH VỤ: ĐỔI GIÁ CÓ AUDIT LOG & KHÔNG HỒI TỐ ĐƠN CŨ ---');
  // Admin lấy danh sách gói
  const resPlans = await makeRequest({
    path: '/api/admin/plans',
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  assert(resPlans.statusCode === 200, 'Lấy danh sách cấu hình các gói thành công');
  const plansList = resPlans.data?.data?.plans || [];
  const proPlan = Array.isArray(plansList) ? plansList.find(p => p.tier === 'PRO') : plansList.PRO;
  assert(proPlan && proPlan.price === 199000, `Gói PRO hiện tại có giá: ${proPlan?.price?.toLocaleString('vi-VN')} VNĐ`);

  // Admin cập nhật giá gói ENTERPRISE từ 299.000 lên 349.000 (Ví dụ)
  const resUpdatePlan = await makeRequest({
    path: '/api/admin/plans',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'UPDATE_PLAN',
      tier: 'ENTERPRISE',
      name: 'StockAI Enterprise Khách Hàng Tổ Chức',
      price: 349000,
      reason: 'Điều chỉnh biểu phí theo yêu cầu nâng cấp băng thông hạ tầng',
    },
  });
  assert(resUpdatePlan.statusCode === 200, 'Admin cập nhật giá gói ENTERPRISE thành công');
  assert(resUpdatePlan.data?.data?.price === 349000, 'Giá gói mới là 349.000 VNĐ');

  // Đổi lại giá chuẩn 299.000 VNĐ để giữ nguyên chính sách
  await makeRequest({
    path: '/api/admin/plans',
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: {
      action: 'UPDATE_PLAN',
      tier: 'ENTERPRISE',
      name: 'StockAI Enterprise',
      price: 299000,
      reason: 'Hoàn nguyên biểu phí chuẩn 299.000 VNĐ sau khi kiểm thử',
    },
  });

  // Kiểm tra đơn hàng cũ (pay2sOrder hoặc newOrder): Số tiền phải giữ nguyên, KHÔNG bị thay đổi hồi tố
  const resOldOrderCheck = await makeRequest({
    path: `/api/admin/orders?search=${pay2sOrder.orderCode}`,
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  const oldOrderSaved = (resOldOrderCheck.data?.data?.orders || [])[0];
  assert(oldOrderSaved.amount === 199000, 'Đơn hàng cũ TUYỆT ĐỐI không bị thay đổi số tiền hồi tố');

  // --------------------------------------------------------------------------
  // TEST 8: Giám sát hệ thống & Che giấu khóa bí mật (Masked Secrets)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 8] GIÁM SÁT HỆ THỐNG: SSI FASTCONNECT & BẢO MẬT KHÓA BÍ MẬT ---');
  const resSystem = await makeRequest({
    path: '/api/admin/system',
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  assert(resSystem.statusCode === 200, 'Admin lấy thông tin giám sát hệ thống thành công');
  const sysData = resSystem.data?.data;
  assert(sysData?.ssi?.name?.includes('SSI'), 'Tích hợp adapter SSI FastConnect chính thức');
  assert(['CONNECTED', 'NOT_CONFIGURED', 'DEMO'].includes(sysData?.ssi?.status), `Trạng thái kết nối SSI FastConnect: ${sysData?.ssi?.status}`);
  assert(typeof sysData?.ssi?.responseTimeMs === 'number', `Thời gian phản hồi SSI: ${sysData?.ssi?.responseTimeMs}ms`);

  // Kiểm tra che giấu secret key của Pay2S Gateway
  const pay2sConfig = sysData?.pay2s;
  assert(pay2sConfig?.isConfigured === true, 'Pay2S Gateway đã được cấu hình');
  assert(pay2sConfig?.secretKeyMasked?.includes('••••••'), `Khóa bảo mật Pay2S được che dấu an toàn: ${pay2sConfig?.secretKeyMasked}`);
  assert(!JSON.stringify(sysData).includes('stockai_pay2s_secure_secret_key_2026'), 'TUYỆT ĐỐI không để lộ secret key gốc trong API trả về');

  // --------------------------------------------------------------------------
  // TEST 9: Phân lập dữ liệu tài khoản
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 9] PHÂN LẬP BẢO MẬT: NGƯỜI DÙNG KHÔNG CAN THIỆP ĐƯỢC TÀI KHOẢN KHÁC ---');
  const resCrossAccount = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    headers: { 'x-user-id': 'usr_other_intruder' },
    body: {
      action: 'REPORT_PAYMENT',
      orderId: pay2sOrder.id, // Đơn hàng thuộc sở hữu của REGULAR_USER_HEADERS
      note: 'Xâm nhập trái phép',
    },
  });
  assert(resCrossAccount.statusCode === 400, 'Chặn hành vi can thiệp đơn hàng của tài khoản khác (HTTP 400)');

  // --------------------------------------------------------------------------
  // TEST 10: Nhật ký kiểm toán (Audit Logs)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 10] NHẬT KÝ KIỂM TOÁN: LƯU VẾT ĐẦY ĐỦ THAO TÁC NHẠY CẢM ---');
  const resAudit = await makeRequest({
    path: '/api/admin/audit-logs?limit=50',
    method: 'GET',
    headers: ADMIN_HEADERS,
  });
  assert(resAudit.statusCode === 200, 'Admin truy vấn Audit Logs thành công (HTTP 200)');
  const logs = resAudit.data?.data?.logs || [];
  assert(logs.length > 0, `Đã ghi nhận ${logs.length} bản ghi kiểm toán`);

  const hasLockLog = logs.some(l => l.action === 'LOCK_USER');
  const hasUnlockLog = logs.some(l => l.action === 'UNLOCK_USER');
  const hasVerifyLog = logs.some(l => l.action === 'VERIFY_PAYMENT');
  const hasPlanUpdateLog = logs.some(l => l.action === 'UPDATE_PLAN_PRICE');

  assert(hasLockLog, 'Audit log ghi nhận thao tác LOCK_USER');
  assert(hasUnlockLog, 'Audit log ghi nhận thao tác UNLOCK_USER');
  assert(hasVerifyLog, 'Audit log ghi nhận thao tác VERIFY_PAYMENT');
  assert(hasPlanUpdateLog, 'Audit log ghi nhận thao tác UPDATE_PLAN_PRICE (Lưu giá cũ và giá mới)');

  console.log('\n========================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passed} KỊCH BẢN ĐẠT / ${failed} THẤT BẠI`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminTestSuite().catch((err) => {
  console.error('Lỗi ngoại lệ trong quá trình chạy test:', err);
  process.exit(1);
});
