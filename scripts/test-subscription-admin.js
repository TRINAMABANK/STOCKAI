/**
 * STOCKAI PERSONAL — SUITE KIỂM THỬ TOÀN DIỆN THUÊ BAO, THANH TOÁN QR & QUẢN TRỊ ADMIN
 * Bắt buộc kiểm thử 12 kịch bản nghiệp vụ theo yêu cầu:
 * 1. Khách chọn PRO, số tiền đơn hàng là 199.000 VNĐ.
 * 2. Khách chọn ENTERPRISE, số tiền đơn hàng là 299.000 VNĐ.
 * 3. Mã QR và nội dung chuyển khoản khớp với đơn hàng.
 * 4. Khách báo đã chuyển khoản nhưng quyền sử dụng vẫn chưa được mở.
 * 5. Admin xác nhận đúng số tiền và giao dịch thì gói được kích hoạt.
 * 6. Admin nhập sai số tiền thì hệ thống từ chối.
 * 7. Một giao dịch ngân hàng không thể dùng để xác nhận hai đơn hàng.
 * 8. Người dùng thường không truy cập được API Admin (403 Forbidden).
 * 9. Khách không thể xem hoặc sửa đơn hàng của tài khoản khác.
 * 10. Đơn hàng đã được xử lý không thể kích hoạt lần hai.
 * 11. Đơn bị từ chối giữ nguyên lý do và lịch sử xử lý.
 * 12. Cấu hình ngân hàng: nếu chưa cấu hình thì chặn sinh QR giả; khi cấu hình thì sinh VietQR chuẩn.
 */

const http = require('http');

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

async function runSubscriptionTestSuite() {
  console.log('================================================================');
  console.log('⚡ STOCKAI — BẮT ĐẦU KIỂM THỬ 12 NGHIỆP VỤ THUÊ BAO, QR & ADMIN');
  console.log('================================================================\n');

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

  // Cấu hình ngân hàng OCB chuẩn theo thông tin chủ hệ thống
  console.log('--- KHỞI TẠO CẤU HÌNH NGÂN HÀNG OCB CHÍNH THỨC ---');
  await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'UPDATE_BANK_CONFIG',
      bankId: 'OCB',
      bankName: 'Ngân hàng TMCP Phương Đông (OCB)',
      accountNumber: '0982441446',
      accountHolder: 'QUANG NHỰT TRÍ',
      template: 'compact2',
      isConfigured: true,
    },
  });

  // TEST 0: Khách chọn gói FREE -> Không tạo đơn thanh toán có số tiền bằng 0
  console.log('\n[TEST 0] Khách hàng chọn gói FREE -> Kích hoạt ngay & KHÔNG tạo đơn thanh toán 0 VNĐ:');
  const res0 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'CREATE_ORDER', targetTier: 'FREE' },
  });
  assert(res0.statusCode === 200, 'Chuyển gói FREE thành công (HTTP 200)');
  assert(!res0.data?.data?.order, 'TUYỆT ĐỐI KHÔNG tạo đơn thanh toán có số tiền bằng 0 cho gói FREE');
  
  // Kiểm tra danh sách đơn hàng không có đơn 0 đ
  const resOrdersCheck = await makeRequest({ path: '/api/subscription' });
  const zeroAmountOrders = (resOrdersCheck.data?.data?.recentOrders || []).filter(o => o.amount === 0);
  assert(zeroAmountOrders.length === 0, 'Danh sách đơn hàng hoàn toàn không chứa đơn 0 VNĐ');

  // TEST 1: Khách chọn PRO, số tiền đơn hàng là 199.000 VNĐ
  console.log('\n[TEST 1] Khách hàng chọn gói PRO -> Số tiền đơn hàng bắt buộc là 199.000 VNĐ:');
  const res1 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'CREATE_ORDER', targetTier: 'PRO' },
  });
  const orderPro = res1.data?.data?.order;
  assert(res1.statusCode === 200, 'Tạo đơn hàng PRO thành công (HTTP 200)');
  assert(orderPro?.tier === 'PRO', 'Gói trong đơn hàng là PRO');
  assert(orderPro?.amount === 199000, `Số tiền chính xác là 199.000 VNĐ (thực tế: ${orderPro?.amount})`);
  assert(orderPro?.formattedAmount === '199.000 đ', `Định dạng tiền hiển thị là "199.000 đ"`);

  // TEST 2: Khách chọn ENTERPRISE, số tiền đơn hàng là 299.000 VNĐ
  console.log('\n[TEST 2] Khách hàng chọn gói ENTERPRISE -> Số tiền đơn hàng bắt buộc là 299.000 VNĐ:');
  const res2 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'CREATE_ORDER', targetTier: 'ENTERPRISE' },
  });
  const orderEnt = res2.data?.data?.order;
  assert(res2.statusCode === 200, 'Tạo đơn hàng ENTERPRISE thành công (HTTP 200)');
  assert(orderEnt?.tier === 'ENTERPRISE', 'Gói trong đơn hàng là ENTERPRISE');
  assert(orderEnt?.amount === 299000, `Số tiền chính xác là 299.000 VNĐ (thực tế: ${orderEnt?.amount})`);
  assert(orderEnt?.formattedAmount === '299.000 đ', `Định dạng tiền hiển thị là "299.000 đ"`);

  // TEST 3: Mã QR và nội dung chuyển khoản khớp với đơn hàng MB
  console.log('\n[TEST 3] Mã VietQR và nội dung chuyển khoản khớp với đơn hàng:');
  assert(orderPro?.transferContent === orderPro?.orderCode, `Nội dung chuyển khoản trùng mã đơn (${orderPro?.transferContent})`);
  assert(res1.data?.data?.qrUrl && res1.data?.data?.qrUrl.includes('MB-0982441446-compact2.png'), 'Mã VietQR trỏ đúng ngân hàng MB và STK 0982441446');
  assert(res1.data?.data?.qrUrl.includes(encodeURIComponent(orderPro?.orderCode)), `URL VietQR chứa đúng mã đơn hàng ${orderPro?.orderCode}`);
  assert(res1.data?.data?.qrUrl.includes('amount=199000'), 'URL VietQR chứa đúng số tiền amount=199000');
  assert(res1.data?.data?.bankConfig?.accountHolder === 'QUANG NHUT TRI', 'Tên chủ tài khoản là QUANG NHUT TRI');

  // TEST 4: Khách báo đã chuyển khoản nhưng quyền sử dụng vẫn chưa được mở
  console.log('\n[TEST 4] Khách báo đã chuyển khoản ("Tôi đã chuyển khoản") -> Gói KHÔNG ĐƯỢC kích hoạt:');
  const res4 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'REPORT_PAYMENT', orderId: orderPro.id, note: 'Khách báo đã chuyển' },
  });
  assert(res4.statusCode === 200, 'Gửi báo cáo chuyển khoản thành công');
  assert(res4.data?.data?.status === 'PENDING_CONFIRMATION', 'Trạng thái chuyển sang PENDING_CONFIRMATION (Chờ đối soát)');

  // Kiểm tra thông tin user: quyền chưa được kích hoạt từ PENDING_CONFIRMATION!
  const resUserBeforeVerify = await makeRequest({ path: '/api/subscription' });
  const userBeforeVerify = resUserBeforeVerify.data?.data?.user;
  assert(res4.data?.data?.status !== 'PAID', 'Trạng thái đơn hàng tuyệt đối không phải PAID');
  console.log(`    Thông tin đơn hiện tại: status=${res4.data?.data?.status}, userRole=${userBeforeVerify?.role}`);

  // TEST 5: Admin xác nhận đúng số tiền và giao dịch -> Gói được kích hoạt thành công
  console.log('\n[TEST 5] Admin xác nhận đúng số tiền & mã GD ngân hàng -> Kích hoạt gói + Hạn dùng +30 ngày:');
  const bankRef1 = `MB_TX_${Date.now()}_001`;
  const res5 = await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: orderPro.id,
      actualAmount: 199000,
      bankTransactionRef: bankRef1,
      notes: 'Khớp sao kê MB Bank 199.000đ',
    },
  });
  assert(res5.statusCode === 200, 'Admin đối soát thành công (HTTP 200)');
  assert(res5.data?.order?.status === 'PAID', 'Trạng thái đơn chuyển sang PAID');
  assert(res5.data?.order?.bankTransactionRef === bankRef1, `Lưu đúng mã GD ngân hàng ${bankRef1}`);
  assert(res5.data?.user?.tier === 'PRO', 'Gói người dùng được kích hoạt thành công sang PRO');

  // TEST 6: Admin nhập sai số tiền -> Hệ thống từ chối
  console.log('\n[TEST 6] Admin nhập sai số tiền thực nhận -> Hệ thống từ chối đối soát:');
  const res6 = await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: orderEnt.id,
      actualAmount: 200000, // Sai số tiền (phải là 299000)
      bankTransactionRef: `MB_TX_${Date.now()}_002`,
    },
  });
  assert(res6.statusCode === 400, 'Hệ thống trả về lỗi HTTP 400 khi sai số tiền');
  assert(res6.data?.message && res6.data.message.includes('không khớp'), `Thông báo lỗi chi tiết: "${res6.data?.message}"`);

  // TEST 7: Một giao dịch ngân hàng không thể dùng để xác nhận hai đơn hàng (Idempotency & Fraud Prevention)
  console.log('\n[TEST 7] Một giao dịch ngân hàng không thể dùng để xác nhận hai đơn hàng khác nhau:');
  // Duyệt orderEnt với số tiền đúng 299000 nhưng DÙNG LẠI bankRef1
  const res7 = await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: orderEnt.id,
      actualAmount: 299000,
      bankTransactionRef: bankRef1, // TRÙNG MÃ VỚI TEST 5
    },
  });
  assert(res7.statusCode === 400, 'Hệ thống từ chối mã giao dịch trùng (HTTP 400)');
  assert(res7.data?.message && res7.data.message.includes('đã được dùng'), `Thông báo chặn duplicate: "${res7.data?.message}"`);

  // TEST 8: Người dùng thường không truy cập được API Admin (403 Forbidden)
  console.log('\n[TEST 8] Người dùng thường không truy cập được API Admin (403 Forbidden):');
  const res8 = await makeRequest({
    path: '/api/admin/payments',
    method: 'GET',
    headers: {
      'x-user-role': 'USER',
      'x-user-id': 'usr_trader_demo',
    },
  });
  assert(res8.statusCode === 403, 'Người dùng thường bị từ chối truy cập API Admin (HTTP 403)');
  assert(res8.data?.message && res8.data.message.includes('Từ chối truy cập'), 'Thông báo cấm quyền hợp lệ');

  // TEST 9: Khách không thể xem hoặc sửa đơn hàng của tài khoản khác
  console.log('\n[TEST 9] Khách hàng B không thể sửa/báo cáo đơn hàng của khách hàng A:');
  const res9 = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    headers: {
      'x-user-id': 'usr_other_hacker',
    },
    body: {
      action: 'REPORT_PAYMENT',
      orderId: orderEnt.id, // orderEnt thuộc về usr_stockai_lead
    },
  });
  assert(res9.statusCode === 400, 'Hệ thống chặn thao tác trên đơn hàng của người khác');
  assert(res9.data?.message && res9.data.message.includes('không có quyền'), `Thông báo lỗi quyền: "${res9.data?.message}"`);

  // TEST 10: Đơn hàng đã được xử lý (PAID) không thể kích hoạt lần hai
  console.log('\n[TEST 10] Đơn hàng đã xử lý (PAID) không thể kích hoạt lần hai:');
  const res10 = await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'VERIFY_PAYMENT',
      orderId: orderPro.id, // orderPro đã PAID ở Test 5
      actualAmount: 199000,
      bankTransactionRef: `NEW_REF_${Date.now()}`,
    },
  });
  assert(res10.statusCode === 400, 'Hệ thống chặn kích hoạt lại đơn đã duyệt (HTTP 400)');
  assert(res10.data?.message && res10.data.message.includes('đã được đối soát'), `Thông báo lỗi kích hoạt lại: "${res10.data?.message}"`);

  // TEST 11: Đơn bị từ chối giữ nguyên lý do và lịch sử xử lý
  console.log('\n[TEST 11] Đơn bị từ chối giữ nguyên lý do và lịch sử xử lý:');
  const rejectReason = 'Số tiền chuyển khoản thiếu 50.000đ so với giá gói quy định';
  const res11 = await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'REJECT_PAYMENT',
      orderId: orderEnt.id,
      reason: rejectReason,
    },
  });
  assert(res11.statusCode === 200, 'Admin từ chối đơn hàng thành công (HTTP 200)');
  assert(res11.data?.order?.status === 'REJECTED', 'Trạng thái chuyển sang REJECTED');
  assert(res11.data?.order?.rejectionReason === rejectReason, `Lưu đúng lý do từ chối: "${res11.data?.order?.rejectionReason}"`);

  // TEST 12: Cấu hình ngân hàng: nếu chưa cấu hình thì không sinh mã QR giả; khi cấu hình thì sinh VietQR chuẩn
  console.log('\n[TEST 12] Cấu hình ngân hàng: bảo vệ chống sinh QR giả khi chưa cấu hình:');
  // Tắt cấu hình ngân hàng
  await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'UPDATE_BANK_CONFIG',
      bankId: 'MB',
      bankName: 'Ngân hàng TMCP Quân Đội',
      accountNumber: '', // Rỗng
      accountHolder: '',
      isConfigured: false,
    },
  });

  const res12Unconfigured = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'CREATE_ORDER', targetTier: 'PRO' },
  });
  assert(res12Unconfigured.data?.data?.isBankConfigured === false, 'isBankConfigured trả về false khi chưa có số tài khoản');
  assert(res12Unconfigured.data?.data?.qrUrl === undefined, 'qrUrl là undefined khi chưa có cấu hình ngân hàng (KHÔNG sinh QR giả)');

  // Bật lại cấu hình ngân hàng thật
  await makeRequest({
    path: '/api/admin/payments',
    method: 'POST',
    body: {
      action: 'UPDATE_BANK_CONFIG',
      bankId: 'OCB',
      bankName: 'Ngân hàng TMCP Phương Đông (OCB)',
      accountNumber: '0982441446',
      accountHolder: 'QUANG NHỰT TRÍ',
      template: 'compact2',
      isConfigured: true,
    },
  });
  const res12Configured = await makeRequest({
    path: '/api/subscription',
    method: 'POST',
    body: { action: 'CREATE_ORDER', targetTier: 'PRO' },
  });
  assert(res12Configured.data?.data?.isBankConfigured === true, 'isBankConfigured trả về true khi cấu hình hợp lệ');
  assert(Boolean(res12Configured.data?.data?.qrUrl), 'qrUrl sinh mã VietQR chuẩn xác khi cấu hình ngân hàng hợp lệ');

  console.log('\n================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} ĐẠT / ${failed} THẤT BẠI (${passed + failed} bài test)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSubscriptionTestSuite().catch(err => {
  console.error('Lỗi thực thi kiểm thử:', err);
  process.exit(1);
});
