# STOCKAI PERSONAL — BÁO CÁO KIỂM TRA VÀ ĐÁNH GIÁ TOÀN DIỆN (AUDIT REPORT)

**Thời điểm thực hiện kiểm tra**: 2026-10-18  
**Kỹ sư trưởng**: Antigravity Fintech AI Lead  
**Vị trí làm việc**: `D:\09- LAM APP KIEM TIEN\LAM PM QUAN LY CHOI CHUNG KHOAN BMS`  
**Phiên bản môi trường máy chủ**:
- Node.js: `v20.20.2`
- NPM: `10.8.2`
- Python: `3.11.9`
- Git: `2.55.0.windows.3`
- OS: Windows 10/11 x64

---

## 1. HIỆN TRẠNG DỰ ÁN TRƯỚC KHI THỰC HIỆN

1. **Khảo sát thư mục và mã nguồn**:
   - Thư mục ban đầu chỉ bao gồm 2 file gốc:
     - `GIAO DIEN.png` (1.69 MB) — Ảnh mẫu thiết kế chính thức của StockAI Personal.
     - `PHÂN TÍCH PHẦN MỀM.docx` (1.71 MB) — Tài liệu đặc tả 14 yêu cầu nghiệp vụ và kỹ thuật chi tiết.
   - Trước khi can thiệp, thư mục **chưa có mã nguồn thực thi**, chưa có `package.json`, chưa có kho lưu trữ Git.
   - Đã khởi tạo Git repository và commit bảo lưu toàn bộ tài liệu và ảnh thiết kế gốc (Commit ID: `ca4a390`).

2. **Khảo sát công nghệ mục tiêu**:
   - Khung ứng dụng: **Next.js 14+ (React 18 / 19, TypeScript, Tailwind CSS)** chạy mượt mà trên desktop Windows qua localhost.
   - Biểu đồ: Biểu đồ tài chính tương tác cao (SVG + Canvas/Recharts) bám sát 100% giao diện `GIAO DIEN.png`.
   - Cơ sở dữ liệu: **SQLite** cục bộ (lưu trữ file `data/stockai.db`), đảm bảo dữ liệu giao dịch, tài sản, danh mục không bị mất khi khởi động lại.
   - Công cụ tài chính: Module tính toán toán học chuẩn mực cho: Giá vốn bình quân (Weighted Average Cost), Lãi/Lỗ đã thực hiện (Realized P&L), Lãi/Lỗ chưa thực hiện (Unrealized P&L), Phí giao dịch BMSC (0.15% mặc định), Thuế thu nhập cá nhân bán chứng khoán (0.1%), Chu kỳ thanh toán T+2.5 / T+3.
   - Module T+3: Động cơ phát hiện tín hiệu định lượng (Breakout, Pullback, Momentum, Reversal) dựa trên công thức kỹ thuật thực tế (RSI, Bollinger Bands, EMA 20/50, Volume Surge Ratio, ATR), có vùng mua, mục tiêu, cắt lỗ, tỷ lệ R:R, mức độ rủi ro.
   - API Center & Adapters:
     - BMSC Adapter: Xác định rõ trạng thái kết nối, kiểm tra tính khả dụng, hỗ trợ nhập khẩu sao kê giao dịch / số dư qua CSV/Excel khi BMSC chưa cấp public API.
     - Market Data Provider (Vietstock, SSI, FiinTrade, CafeF / FireAnt): Quản lý trạng thái kết nối thật, thời gian ping, timestamp dữ liệu, cờ cảnh báo dữ liệu cũ/mới.
     - OpenAI API Adapter: Tích hợp GPT-4o / GPT-4o-mini backend, bảo vệ API key tuyệt đối tại server-side (`.env.local`), có cơ chế cảnh báo khi chưa cấu hình Key (không bịa đặt kết quả giả lập khi không có key).

---

## 2. DANH SÁCH CHỨC NĂNG CẦN TRIỂN KHAI

| STT | Menu / Module | Mục tiêu & Yêu cầu cụ thể | Trạng thái |
|:---:|:---|:---|:---:|
| 1 | **Tổng quan (Dashboard)** | 4 stat cards (Tổng tài sản, Giá trị CP, Tiền mặt, Lãi/lỗ), Biểu đồ tài sản so sánh VN-Index, Phân bổ ngành, Top tăng/giảm, Chỉ số thị trường, Bảng T+3, Cột Trợ lý AI, Tin tức, Kết nối API. | Sẵn sàng triển khai |
| 2 | **Tài khoản chứng khoán (BMSC)** | Quản lý thông tin tài khoản BMSC, số dư tiền, danh mục, lịch sử đồng bộ, công cụ nhập file sao kê BMSC (CSV/Excel). | Sẵn sàng triển khai |
| 3 | **Danh mục đầu tư (Portfolio)** | Danh sách mã nắm giữ, khối lượng, giá vốn, giá thị trường, giá trị, lãi/lỗ %, tỷ trọng %, thao tác mua/bán thêm. | Sẵn sàng triển khai |
| 4 | **Giao dịch & Sổ lệnh (Transactions)** | Sổ lệnh, nhật ký mua/bán/nộp/rút tiền, tính tự động phí & thuế, kiểm tra số dư khả dụng. | Sẵn sàng triển khai |
| 5 | **Thị trường & Bảng giá (Market Board)** | Bảng giá trực tuyến HOSE, HNX, UPCoM; thông số khớp lệnh, giá trần/sàn/tham chiếu, khối lượng. | Sẵn sàng triển khai |
| 6 | **Bộ lọc cổ phiếu (Stock Screener)** | Lọc đa tiêu chí: Sàn, Ngành, Vốn hóa, P/E, P/B, ROE, Tăng trưởng, RSI, MACD, Volume đột biến; tính điểm tổng hợp. | Sẵn sàng triển khai |
| 7 | **Giao dịch T+3 (T+3 Radar)** | 4 chiến lược: Breakout, Pullback, Momentum, Reversal; Vùng mua, Mục tiêu 1 & 2, Cắt lỗ, Tỷ lệ R:R, Rủi ro; Xem chi tiết phân tích tín hiệu. | Sẵn sàng triển khai |
| 8 | **Phân tích cổ phiếu (Stock Analysis)** | Chi tiết từng mã: Biểu đồ kỹ thuật nến/đường, chỉ báo RSI, MACD, MA, bảng tài chính cơ bản, đánh giá AI. | Sẵn sàng triển khai |
| 9 | **Trợ lý AI (StockAI Chat)** | Trợ lý phân tích, hỗ trợ câu hỏi mẫu, phân tích danh mục, kịch bản thị trường, trích dẫn số liệu và cảnh báo rủi ro. | Sẵn sàng triển khai |
| 10 | **Danh sách theo dõi (Watchlist)** | Thêm/bớt mã quan tâm, phân nhóm danh sách, thông báo biến động. | Sẵn sàng triển khai |
| 11 | **Cảnh báo (Alerts)** | Thiết lập cảnh báo giá (chạm ngưỡng mua/cắt lỗ), cảnh báo khối lượng, cảnh báo tín hiệu T+3 mới. | Sẵn sàng triển khai |
| 12 | **Trung tâm API (API Center)** | Kiểm tra kết nối BMSC, Vietstock, FiinTrade, OpenAI; đo độ trễ ping, nhật ký lỗi, cấu hình an toàn. | Sẵn sàng triển khai |
| 13 | **Kiểm định chiến lược (Backtest)** | Chạy backtest trên chuỗi dữ liệu lịch sử, tính Win Rate, Lợi nhuận kỳ vọng, Max Drawdown, Phí/Thuế/Slippage, so sánh VN-Index. | Sẵn sàng triển khai |
| 14 | **Cài đặt & Sao lưu (Settings & Backup)** | Sao lưu database SQLite ra file `.json` / `.sqlite`, khôi phục dữ liệu, tùy chỉnh phí/thuế mặc định, nhật ký hệ thống. | Sẵn sàng triển khai |

---

## 3. RỦI RO KỸ THUẬT VÀ GIẢI PHÁP

1. **Rủi ro API BMSC**:
   - *Rủi ro*: BMSC hiện tại chưa cung cấp Open API cho nhà đầu tư cá nhân tự do gọi lệnh hoặc truy vấn số dư tự động bằng REST/WebSocket.
   - *Giải pháp*: Xây dựng chuẩn Adapter riêng. Khi chưa có API chính thức, trạng thái hiển thị rõ ràng `Chưa kết nối / Chưa có API chính thức` (tuyệt đối không hiển thị kết nối giả); cung cấp công cụ Parser file sao kê tài khoản (Excel / CSV) từ BMSC Web/App để người dùng import dữ liệu thật vào hệ thống một cách an toàn mà không cần nhập mật khẩu giao dịch.
2. **Rủi ro dữ liệu thị trường và giới hạn API**:
   - *Rủi ro*: API dữ liệu miễn phí từ các nguồn bên ngoài có thể bị nghẽn (rate-limit) hoặc thay đổi định dạng.
   - *Giải pháp*: Lưu trữ bộ đệm (Cache) trong SQLite với nhãn timestamp và trạng thái xác thực rõ ràng (`Nguồn dữ liệu: API`, `Thời điểm cập nhật: HH:mm:ss`, cờ kiểm định hợp lệ). Nếu API gặp sự cố, hệ thống chuyển sang chế độ dữ liệu offline/cache và hiển thị cảnh báo `Dữ liệu cũ - Chưa đồng bộ mới nhất`, không giả lập giá ảo.
3. **Rủi ro ảo tưởng hiệu suất T+3 và AI Hallucination**:
   - *Rủi ro*: AI tự sáng tác giá mua/bán hoặc chiến lược T+3 gây thua lỗ nếu người dùng hiểu lầm là cam kết lợi nhuận.
   - *Giải pháp*: Toàn bộ công thức tín hiệu T+3, điểm mua, điểm bán, cắt lỗ được tính toán hoàn toàn bằng thuật toán toán học xác thực (Deterministic Quantitative Engine). AI chỉ đóng vai trò phân tích định tính dựa trên các con số backend cung cấp. Giao diện luôn kèm tuyên bố miễn trừ trách nhiệm (Disclaimer) chuẩn mực tài chính.

---

## 4. KẾ HOẠCH TRIỂN KHAI VÀ THỰC THI (ACTION PLAN)

- **Bước 1**: Khởi tạo dự án Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React, cấu trúc component modular.
- **Bước 2**: Xây dựng Layout & Giao diện Dashboard bám sát 100% hình ảnh `GIAO DIEN.png` (Sidebar xanh navy, Header, Thống kê, Biểu đồ, Top CP, Bảng T+3, Cột phải AI & API).
- **Bước 3**: Xây dựng 14 màn hình menu đầy đủ nghiệp vụ.
- **Bước 4**: Xây dựng tầng Cơ sở dữ liệu SQLite (`better-sqlite3` / schema chuẩn với đầy đủ 14 bảng quan hệ), cơ chế sao lưu và khôi phục.
- **Bước 5**: Xây dựng Động cơ Tài chính (Finance Engine) tính chuẩn Giá vốn bình quân, Lãi/lỗ, Phí thuế, kèm bài kiểm thử tự động (Unit Test).
- **Bước 6**: Xây dựng Động cơ T+3 và Bộ lọc cổ phiếu (Quantitative Screener & T+3 Engine).
- **Bước 7**: Xây dựng Trung tâm API, BMSC Statement Parser, Market Data Service & OpenAI Assistant API.
- **Bước 8**: Xây dựng Động cơ Kiểm định chiến lược (Backtesting Engine).
- **Bước 9**: Kiểm thử tích hợp toàn diện, biên soạn tài liệu `STOCKAI_STATUS.md` và hướng dẫn vận hành.
