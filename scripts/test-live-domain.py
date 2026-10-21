import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import urllib.request
import json
import ssl

ctx = ssl.create_default_context()

print("==========================================================")
print("TESTING LIVE DOMAIN DEMOLADIPAGE.COM DIRECTLY VIA HTTPS")
print("==========================================================\n")

def test():
    passed = 0
    failed = 0

    def assert_eq(cond, msg):
        nonlocal passed, failed
        if cond:
            print(f"[PASS] {msg}")
            passed += 1
        else:
            print(f"[FAIL] {msg}")
            failed += 1

    # 1. Trang chủ HTTPS
    print("--- 1. Kiểm tra Trang chủ https://demoladipage.com ---")
    req = urllib.request.Request("https://demoladipage.com/")
    with urllib.request.urlopen(req, context=ctx) as res:
        assert_eq(res.status == 200, "Trang chủ https://demoladipage.com/ trả về HTTP 200 OK với SSL")

    # 2. Trang admin HTTPS
    print("\n--- 2. Kiểm tra Trang Admin https://demoladipage.com/admin ---")
    req = urllib.request.Request("https://demoladipage.com/admin")
    with urllib.request.urlopen(req, context=ctx) as res:
        assert_eq(res.status == 200, "Trang Admin https://demoladipage.com/admin trả về HTTP 200 OK với SSL")

    # 3. Auth Check khi chưa đăng nhập
    print("\n--- 3. Kiểm tra API Auth Check khi chưa đăng nhập ---")
    req = urllib.request.Request("https://demoladipage.com/api/admin/auth-check")
    with urllib.request.urlopen(req, context=ctx) as res:
        data = json.loads(res.read().decode())
        assert_eq(data.get("authenticated") is False, "auth-check trả về authenticated: false khi chưa đăng nhập")

    # 4. Overview API khi chưa đăng nhập -> Chặn 403
    print("\n--- 4. Kiểm tra chặn 403 với người dùng chưa đăng nhập ---")
    try:
        req = urllib.request.Request("https://demoladipage.com/api/admin/overview")
        urllib.request.urlopen(req, context=ctx)
        assert_eq(False, "Phải chặn 403 khi chưa đăng nhập")
    except urllib.error.HTTPError as e:
        assert_eq(e.code == 403, f"Bị chặn 403 Forbidden chính xác (Code: {e.code})")

    # 5. Đăng nhập sai mật khẩu -> 401
    print("\n--- 5. Kiểm tra đăng nhập sai mật khẩu ---")
    try:
        login_data = json.dumps({"username": "admin", "password": "WrongPassword@123"}).encode()
        req = urllib.request.Request("https://demoladipage.com/api/admin/login", data=login_data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, context=ctx)
        assert_eq(False, "Phải chặn 401 khi sai mật khẩu")
    except urllib.error.HTTPError as e:
        assert_eq(e.code == 401, f"Chặn 401 Unauthorized khi sai mật khẩu (Code: {e.code})")

    # 6. Đăng nhập đúng với admin / Admin@2026
    print("\n--- 6. Kiểm tra đăng nhập thành công với admin / Admin@2026 ---")
    login_data = json.dumps({"username": "admin", "password": "Admin@2026"}).encode()
    req = urllib.request.Request("https://demoladipage.com/api/admin/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, context=ctx) as res:
        data = json.loads(res.read().decode())
        cookies = res.headers.get_all("Set-Cookie")
        assert_eq(res.status == 200, "Đăng nhập thành công trả về HTTP 200 OK")
        assert_eq(data.get("success") is True, "Phản hồi success: true")
        assert_eq(data.get("mustChangePassword") is True, "mustChangePassword: true sau lần đăng nhập đầu tiên")
        assert_eq(any("stockai_admin_session" in c for c in cookies), "Nhận Cookie phiên stockai_admin_session")

        # Lưu cookie
        cookie_header = "; ".join([c.split(";")[0] for c in cookies])

    # 7. Truy cập API Admin với Cookie phiên vừa được cấp
    print("\n--- 7. Kiểm tra truy cập dữ liệu Admin với Cookie phiên ---")
    req = urllib.request.Request("https://demoladipage.com/api/admin/overview", headers={"Cookie": cookie_header})
    with urllib.request.urlopen(req, context=ctx) as res:
        data = json.loads(res.read().decode())
        assert_eq(res.status == 200, "Truy cập thành công vào /api/admin/overview sau khi đăng nhập")
        assert_eq(data.get("success") is True, "Nhận được số liệu thống kê thực tế từ máy chủ VPS")
        kpis = data.get("data", {}).get("kpis", {})
        print(f"   KPI thực tế trên VPS: Tổng user = {kpis.get('totalUsers')}, Doanh thu = {kpis.get('formattedRevenue')}")

    print("\n==========================================================")
    print(f"TONG KET KIEM THU LIVE: {passed} PASSED, {failed} FAILED")
    print("==========================================================")

if __name__ == "__main__":
    test()
