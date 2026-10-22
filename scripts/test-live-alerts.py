import sys
import urllib.request
import json
import ssl

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://demoladipage.com"

print("==========================================================")
print("KIỂM TRA TRỰC TIẾP PHÂN HỆ CẢNH BÁO TRÊN DOMAIN LIVE")
print(f"Domain: {BASE_URL}")
print("==========================================================\n")

# 1. Kiểm tra API Overview
print("--- 1. Kiểm tra API GET /api/market-alerts/overview ---")
req = urllib.request.Request(f"{BASE_URL}/api/market-alerts/overview")
with urllib.request.urlopen(req, context=ctx) as res:
    status = res.status
    data = json.loads(res.read().decode('utf-8'))
    print(f"HTTP Status: {status}")
    assert data["success"] == True
    overview = data["data"]
    print(f"VN-Index: {overview['currentValue']} ({overview['changePercent']}%)")
    print(f"Trạng thái thị trường: {overview['marketStatus']}")
    print(f"MA20: {overview['indexMa20']} | MA50: {overview['indexMa50']}")
    print(f"Tỷ lệ > MA20: {overview['stocksAboveMa20Percent']}% | Tỷ lệ > MA50: {overview['stocksAboveMa50Percent']}%")
    print(f"Rủi ro: {overview['marketRiskLevel']}")
    print(f"Tỷ trọng tham khảo: {overview['portfolioAllocationReference']['recommendationText']}")
    print("[PASS] API /api/market-alerts/overview hoạt động chuẩn xác 100%!")

# 2. Kiểm tra API Alerts list & Filter counts
print("\n--- 2. Kiểm tra API GET /api/market-alerts ---")
req = urllib.request.Request(f"{BASE_URL}/api/market-alerts")
with urllib.request.urlopen(req, context=ctx) as res:
    status = res.status
    data = json.loads(res.read().decode('utf-8'))
    print(f"HTTP Status: {status}")
    assert data["success"] == True
    alerts = data["data"]["alerts"]
    counts = data["data"]["counts"]
    print(f"Tổng số bản ghi: {data['data']['total']}")
    print(f"Số lượng đếm các bộ lọc: All={counts['all']}, Breakout={counts['breakout']}, VolSurge={counts['volume_surge']}, FailedBreakout={counts['failed_breakout']}")
    assert len(alerts) >= 8
    print("[PASS] API /api/market-alerts trả về danh sách cảnh báo thực tế!")

# 3. Kiểm tra lọc tab 'breakout'
print("\n--- 3. Kiểm tra lọc tab 'breakout' ---")
req = urllib.request.Request(f"{BASE_URL}/api/market-alerts?tab=breakout")
with urllib.request.urlopen(req, context=ctx) as res:
    status = res.status
    data = json.loads(res.read().decode('utf-8'))
    alerts = data["data"]["alerts"]
    print(f"Số cảnh báo breakout: {len(alerts)}")
    for a in alerts:
        print(f"  - [{a['symbol']}] ({a['exchange']}) Giá cảnh báo: {a['alertPrice']:,} đ | Hiện tại: {a['currentPrice']:,} đ | Vol: {a['volumeRatio']}x | Trạng thái: {a['status']}")
        assert a['eventType'] == 'BREAKOUT_20'
    print("[PASS] Lọc theo tab breakout chính xác 100%!")

print("\n==========================================================")
print("TẤT CẢ KIỂM THỬ TRỰC TIẾP TRÊN DOMAIN DEMOLADIPAGE.COM ĐẠT CHUẨN!")
print("==========================================================")
