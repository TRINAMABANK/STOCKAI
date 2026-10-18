# StockAI Personal — Nền Tảng Quản Lý Đầu Tư & Phân Tích Chứng Khoán Cá Nhân

Ứng dụng Fintech quản lý tài khoản chứng khoán Bảo Minh (BMSC), phân tích kỹ thuật và định lượng T+3 trên thị trường HOSE, HNX và UPCoM, tích hợp trí tuệ nhân tạo (AI Assistant) và giao diện phong cách FireAnt tối ưu cho máy tính Windows.

---

## 🎨 Hệ Thống Màu Sắc & Giao Diện (FireAnt Style)
- **Nền tổng thể**: `#F5F8FC`
- **Thẻ nội dung**: `#FFFFFF`
- **Màu chủ đạo**: `#008FD3`
- **Màu nền khi chọn menu**: `#E0F2FE`
- **Tiêu đề và nội dung chính**: `#172033`
- **Chữ phụ**: `#64748B`
- **Đường viền**: `#E2E8F0`
- **Tính năng AI**: `#8B5CF6`
- **Lợi nhuận**: `#10B981`
- **Thua lỗ và cảnh báo**: `#F43F5E`

---

## 🚀 14 Phân Hệ Chức Năng Chính

1. **Tổng quan (Dashboard)**: Thống kê tài sản ròng, lãi/lỗ chưa thực hiện, biểu đồ so sánh VN-Index, phân bổ ngành, tín hiệu T+3 mới nhất, cột Trợ lý AI và trạng thái kết nối dữ liệu.
2. **Tài khoản chứng khoán (BMSC Account)**: Quản lý số dư tiền, danh mục tài khoản Bảo Minh Securities, nhập sao kê giao dịch (CSV/Excel).
3. **Danh mục đầu tư (Portfolio Management)**: Theo dõi giá vốn bình quân (WAC), giá trị thị trường, tỷ trọng phân bổ và lãi/lỗ từng mã.
4. **Giao dịch & Sổ lệnh (Order Book & Transactions)**: Quản lý lệnh mua/bán, tự động tính phí giao dịch và thuế TNCN 0.1%.
5. **Thị trường & Bảng giá (Market Live Board)**: Bảng giá trực quan 3 sàn HOSE, HNX, UPCoM với chỉ số, thanh khoản và biến động giá.
6. **Bộ lọc cổ phiếu (Stock Screener)**: Bộ lọc đa tiêu chí cơ bản và kỹ thuật (P/E, ROE, Tăng trưởng LN, Khối lượng đột biến, RSI).
7. **Giao dịch T+3 (T+3 Radar & Strategies)**: Động cơ định lượng 4 chiến lược (Breakout, Pullback, Momentum, Reversal) với điểm vào lệnh, giá mục tiêu, cắt lỗ và tỷ lệ R:R.
8. **Phân tích cổ phiếu (Stock Analysis)**: Biểu đồ kỹ thuật tương tác (RSI, MACD, Volume, MA20/MA50), các chỉ số cơ bản và đánh giá sức khỏe tài chính.
9. **Trợ lý AI (StockAI Copilot)**: Phân tích danh mục, đánh giá rủi ro, dự phóng kịch bản thị trường dựa trên OpenAI GPT-4o / GPT-4o-mini.
10. **Danh sách theo dõi (Watchlist)**: Quản lý các nhóm cổ phiếu yêu thích và theo dõi nhịp đập giá.
11. **Cảnh báo (Alerts)**: Cấu hình ngưỡng cảnh báo giá, khối lượng đột biến và chạm điểm cắt lỗ/chốt lời.
12. **Trung tâm API (API Gateway & Adapters)**: Giám sát kết nối dữ liệu thị trường (Vietstock, SSI, FiinTrade, CafeF) và OpenAI API với nhật ký latency thực tế.
13. **Kiểm định chiến lược (Strategy Backtest)**: Kiểm thử hiệu suất chiến lược T+3 trên dữ liệu lịch sử (Win Rate, Profit Factor, Max Drawdown).
14. **Cài đặt & Sao lưu (Settings & Backup)**: Xuất/nhập file sao lưu toàn bộ cơ sở dữ liệu SQLite, quản lý cấu hình phí thuế và bảo mật.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Database**: Next.js API Routes, SQLite (`better-sqlite3`), Engine tính toán tài chính chuẩn mực.
- **Engine T+3**: Thuật toán định lượng phát hiện Breakout/Pullback/Momentum/Reversal.
- **Kiểm thử**: Bộ test tự động 24/24 cho Engine tài chính và 12/12 API endpoints.

---

## 📦 Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env.local` từ mẫu `.env.local.example`:
```bash
cp .env.local.example .env.local
```
Điền `OPENAI_API_KEY` nếu bạn muốn sử dụng tính năng Trợ lý AI trực tiếp.

### 3. Khởi chạy môi trường phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### 4. Build sản phẩm (Production)
```bash
npm run build
npm start
```

---

## 🔒 Bản Quyền & Lưu Ý Bảo Mật
- Không tự động đặt lệnh mua bán thực tế vào tài khoản chứng khoán khi chưa có sự xác nhận của người dùng.
- Khóa bảo mật API (OpenAI API Key) được lưu trữ an toàn tại server-side (`.env.local`), không bị rò rỉ ra client hoặc Git repository.
