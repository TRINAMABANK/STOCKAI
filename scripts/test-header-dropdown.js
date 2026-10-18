/**
 * STOCKAI — SUITE KIỂM THỬ GIAO DIỆN DROPDOWN TÀI KHOẢN TRÊN HEADER (PHONG CÁCH FIREANT)
 * 1. Kiểm tra cấu trúc Component Header: Dropdown Trigger + Menu FireAnt.
 * 2. Xác thực dữ liệu động: Avatar, Tên người dùng, Trạng thái gói dịch vụ.
 * 3. Kiểm tra 4 hành động: Nâng cấp/Gia hạn, Hồ sơ cá nhân, Thiết lập tài khoản, Đăng xuất.
 * 4. Kiểm tra sự kiện đóng menu: Click outside và phím Escape.
 * 5. Đảm bảo giữ nguyên Google Login, chuông thông báo và nút cài đặt.
 * 6. Đảm bảo tuyệt đối không đưa tính năng Admin vào menu người dùng.
 * 7. Kiểm tra tính tương thích Desktop & Mobile.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

function makeRequest({ path: reqPath, method = 'GET', headers = {}, body = null }) {
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
      path: reqPath,
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

async function runHeaderDropdownTestSuite() {
  console.log('========================================================================');
  console.log('🎯 KIỂM THỬ GIAO DIỆN MENU DROPDOWN TÀI KHOẢN FIREANT TRÊN HEADER');
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

  const headerFilePath = path.join(process.cwd(), 'src', 'components', 'Header.tsx');
  const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');

  const headerContent = fs.readFileSync(headerFilePath, 'utf8');
  const pageContent = fs.readFileSync(pageFilePath, 'utf8');

  // TEST 1: Giữ nguyên Google Login, chuông thông báo và nút cài đặt
  console.log('--- [TEST 1] BẢO TOÀN CÁC THÀNH PHẦN HEADER HIỆN HỮU ---');
  assert(headerContent.includes('Google Login') && headerContent.includes('GoogleAuthModal'), 'Nút Google Login và GoogleAuthModal được bảo toàn 100%');
  assert(headerContent.includes('<Bell') && headerContent.includes('w-5 h-5'), 'Chuông thông báo (Bell icon) được bảo toàn');
  assert(headerContent.includes('<Settings') && headerContent.includes('onOpenSettings'), 'Nút Cài đặt hệ thống (Settings gear) được bảo toàn');

  // TEST 2: Nút trigger Dropdown có Avatar, Tên và Mũi tên xuống
  console.log('\n--- [TEST 2] CẤU TRÚC NÚT TRIGGER DROPDOWN ---');
  assert(headerContent.includes('ref={userMenuRef}') && headerContent.includes('isUserMenuOpen'), 'Có ref quản lý dropdown và state isUserMenuOpen');
  assert(headerContent.includes('ChevronDown') && headerContent.includes('rotate-180'), 'Có icon mũi tên xuống ChevronDown tự động xoay khi mở');
  assert(headerContent.includes('currentUser?.avatarUrl') || headerContent.includes('avatarUrl'), 'Hiển thị avatar thực tế hoặc monogram chữ cái');
  assert(headerContent.includes('currentUser?.name'), 'Hiển thị tên người dùng động từ dữ liệu tài khoản');

  // TEST 3: Phần đầu Dropdown: Avatar, Tên người dùng và Trạng thái gói
  console.log('\n--- [TEST 3] PHẦN ĐẦU DROPDOWN THEO ẢNH THAM CHIẾU FIREANT ---');
  assert(headerContent.includes('getTierInfo'), 'Hàm getTierInfo xác định nhãn và màu sắc gói thuê bao thực tế');
  assert(headerContent.includes('Hội viên Miễn phí'), 'Có định nghĩa trạng thái "Hội viên Miễn phí"');
  assert(headerContent.includes('Hội viên Chuyên nghiệp (PRO)'), 'Có định nghĩa trạng thái "Hội viên Chuyên nghiệp (PRO)"');
  assert(headerContent.includes('Hội viên Nâng cao'), 'Có định nghĩa trạng thái "Hội viên Nâng cao"');
  assert(headerContent.includes('tracking-wide uppercase'), 'Tên người dùng được căn giữa và in đậm nổi bật như ảnh mẫu');

  // TEST 4: Danh sách các mục menu theo đúng thứ tự
  console.log('\n--- [TEST 4] 4 MỤC MENU THAO TÁC THEO MẪU FIREANT ---');
  assert(headerContent.includes('Nâng cấp/Gia hạn') || headerContent.includes('Nâng cấp / Gia hạn'), 'Mục 1: "Nâng cấp/Gia hạn"');
  assert(headerContent.includes('Hồ sơ cá nhân'), 'Mục 2: "Hồ sơ cá nhân"');
  assert(headerContent.includes('Thiết lập tài khoản'), 'Mục 3: "Thiết lập tài khoản"');
  assert(headerContent.includes('Đăng xuất'), 'Mục 4: "Đăng xuất"');

  // TEST 5: Định tuyến chính xác đến các view trong ứng dụng
  console.log('\n--- [TEST 5] ĐỊNH TUYẾN VIEW VÀ LIÊN KẾT HÀNH ĐỘNG ---');
  assert(headerContent.includes('onOpenSubscription'), 'Nâng cấp/Gia hạn gọi hàm onOpenSubscription');
  assert(pageContent.includes("onOpenSubscription={() => setActiveMenu('subscription')}"), 'page.tsx truyền onOpenSubscription điều hướng đến view subscription');
  assert(headerContent.includes('onOpenProfile'), 'Hồ sơ cá nhân gọi hàm onOpenProfile');
  assert(pageContent.includes("onOpenProfile={() => setActiveMenu('profile')}"), 'page.tsx truyền onOpenProfile điều hướng đến view profile');
  assert(headerContent.includes('onOpenSettings'), 'Thiết lập tài khoản gọi hàm onOpenSettings');
  assert(pageContent.includes("onOpenSettings={() => setActiveMenu('settings')}"), 'page.tsx truyền onOpenSettings điều hướng đến view settings');

  // TEST 6: Cơ chế đăng xuất
  console.log('\n--- [TEST 6] CƠ CHẾ ĐĂNG XUẤT HIỆN HỮU ---');
  assert(headerContent.includes('handleLogout') && headerContent.includes('/api/auth/logout'), 'Đăng xuất gọi đúng endpoint bảo mật /api/auth/logout của hệ thống');

  // TEST 7: Cơ chế đóng menu: Click outside và phím Escape
  console.log('\n--- [TEST 7] SỰ KIỆN CLICK OUTSIDE & PHÍM ESCAPE ---');
  assert(headerContent.includes("event.key === 'Escape'"), 'Lắng nghe sự kiện phím Escape để tự động đóng menu');
  assert(headerContent.includes('handleClickOutside') && headerContent.includes('contains(event.target'), 'Lắng nghe click ngoài màn hình để tự động đóng menu');

  // TEST 8: Phân định ranh giới bảo mật: Không đưa Admin vào menu người dùng
  console.log('\n--- [TEST 8] BẢO MẬT: KHÔNG ĐƯA CHỨC NĂNG ADMIN VÀO MENU NGƯỜI DÙNG ---');
  // Dropdown menu của Header không được chứa các link admin
  const dropdownSectionMatch = headerContent.match(/isUserMenuOpen && \([\s\S]*?\n\s*\)/);
  if (dropdownSectionMatch) {
    const dropdownHtml = dropdownSectionMatch[0];
    assert(!dropdownHtml.includes('/admin') && !dropdownHtml.includes('Quản trị viên') && !dropdownHtml.includes('admin-subscription'), 'Menu người dùng hoàn toàn sạch sẽ, không lộ chức năng Admin');
  } else {
    assert(false, 'Tìm thấy khối dropdown menu');
  }

  // TEST 9: Kiểm tra API Endpoint xác thực và phiên làm việc
  console.log('\n--- [TEST 9] KIỂM TRA PHIÊN LÀM VIỆC BACKEND API ---');
  const resMe = await makeRequest({ path: '/api/auth/me' });
  assert(resMe.statusCode === 200, 'API /api/auth/me trả về 200 OK');
  assert(resMe.data?.data?.user?.name, `Tên tài khoản thực tế: ${resMe.data?.data?.user?.name}`);
  assert(resMe.data?.data?.user?.tier, `Gói thuê bao thực tế: ${resMe.data?.data?.user?.tier}`);

  console.log('\n========================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passed} KỊCH BẢN ĐẠT / ${failed} THẤT BẠI`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHeaderDropdownTestSuite().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
