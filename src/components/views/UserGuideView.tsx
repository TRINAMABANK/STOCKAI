'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Target, 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Clock,
  Compass
} from 'lucide-react';

export default function UserGuideView() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Dữ liệu giao dịch của StockAI được cập nhật từ nguồn nào?',
      a: 'StockAI tích hợp trực tiếp nguồn cấp dữ liệu chuẩn từ Vietstock Financial Feed và SSI FastConnect API. Trong giờ giao dịch (09:00 - 15:00), dữ liệu được làm mới theo thời gian thực (Realtime). Ngoài giờ giao dịch, hệ thống tự động chốt dữ liệu cuối ngày (End-of-Day EOD) chuẩn xác.',
    },
    {
      q: 'Tín hiệu mua/bán của StockAI có cam kết lợi nhuận không?',
      a: 'Tuyệt đối không. StockAI là nền tảng phân tích định lượng và sàng lọc cơ hội kỹ thuật dựa trên dữ liệu lịch sử và xác suất thống kê. Thị trường chứng khoán luôn tiềm ẩn rủi ro biến động khó lường. Mọi tín hiệu chỉ mang tính chất tham khảo, nhà đầu tư luôn cần tuân thủ nghiêm ngặt nguyên tắc cắt lỗ 2% NAV.',
    },
    {
      q: 'Quy trình thanh toán và kích hoạt gói Pro/Enterprise diễn ra như thế nào?',
      a: 'Bạn chỉ cần chọn gói tại trang "Gói thuê bao StockAI", quét mã VietQR bằng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB, Techcombank, Nam A Bank...) hoặc qua cổng Pay2S. Khi chuyển khoản đúng nội dung đơn hàng, hệ thống đối soát tự động kích hoạt gói trong 1–3 phút mà không cần liên hệ tổng đài.',
    },
    {
      q: 'Sự khác biệt giữa gói Free và gói Pro là gì?',
      a: 'Gói Free cho phép theo dõi tối đa 5 mã cổ phiếu và xem biểu đồ nến cơ bản. Gói Pro mở khóa toàn bộ hệ thống: tín hiệu mũi tên Mua/Bán trực tiếp trên đồ thị, chỉ báo kỹ thuật chuyên sâu (RSI, MACD, Bollinger Bands, MA20/50/200), bộ lọc định lượng 50+ mã tiềm năng và danh sách theo dõi không giới hạn.',
    },
    {
      q: 'Tôi có thể sử dụng StockAI trên điện thoại di động không?',
      a: 'Có. StockAI được thiết kế theo tiêu chuẩn Web Responsive tối ưu cho cả máy tính, máy tính bảng iPad và điện thoại thông minh (iOS Safari, Android Chrome). Bạn có thể thêm StockAI ra màn hình chính (Add to Home Screen) để sử dụng như một ứng dụng độc lập tiện lợi.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
            Cẩm nang kỷ luật & Hướng dẫn sử dụng
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF]">
            Handbook v2.5
          </span>
        </div>
        <p className="text-[13px] text-[#647293] mt-0.5">
          Hệ thống hóa kỷ luật giao dịch ngắn hạn T+3, phương pháp quản trị rủi ro và cẩm nang hỗ trợ khách hàng
        </p>
      </div>

      {/* SECTION 1: CẨM NANG KỶ LUẬT GIAO DỊCH */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#087CFF] font-bold text-sm uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>I. Cẩm nang kỷ luật giao dịch sống còn</span>
        </div>

        {/* 1.1 Nguyên tắc chu kỳ T+3 */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5FF]">
            <Clock className="w-5 h-5 text-[#087CFF]" />
            <h3 className="text-base font-bold text-[#172554]">
              1. Nguyên tắc chu kỳ T+3 tại thị trường Việt Nam
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-1">
              <span className="font-bold text-[#087CFF] block">Phiên T+0 (Vào lệnh)</span>
              <p className="text-[#647293]">Chỉ giải ngân tại đúng vùng giá khuyến nghị (Buy Zone). Không đua lệnh khi giá đã tăng vượt 2.5% so với điểm mua chuẩn.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-1">
              <span className="font-bold text-[#172554] block">Phiên T+1 (Quan sát)</span>
              <p className="text-[#647293]">Cổ phiếu đang trên đường về. Đánh giá khối lượng của phiên T+1: thanh khoản duy trì cao là tín hiệu tích cực.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-1">
              <span className="font-bold text-[#172554] block">Phiên T+2 (Hàng về)</span>
              <p className="text-[#647293]">Cổ phiếu khả dụng trong tài khoản sau 16:00. Lên sẵn kịch bản hành động cho phiên T+3 (giá mục tiêu và giá phòng thủ).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#DCFCE7]/60 border border-[#BBF7D0] space-y-1">
              <span className="font-bold text-[#16A34A] block">Phiên T+3 (Quyết định)</span>
              <p className="text-[#172554]">Chủ động chốt lời 50% khi chạm Target 1. Nếu vi phạm mốc Stop-loss, dứt khoát bán dứt điểm để bảo toàn tiền mặt.</p>
            </div>
          </div>
        </div>

        {/* 1.2 4 Mẫu hình vào lệnh định lượng */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5FF]">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-base font-bold text-[#172554]">
              2. 4 Mẫu hình vào lệnh định lượng của StockAI
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#087CFF] text-sm">Mẫu hình 1: Breakout Kháng cự</span>
                <span className="px-2 py-0.5 rounded bg-[#EBF3FF] text-[#087CFF] text-[10px] font-bold">Xu hướng</span>
              </div>
              <p className="text-[#647293]">
                Giá đóng cửa bứt phá đỉnh kháng cự ngắn hạn với khối lượng đột biến đạt tối thiểu <strong>150% so với MA20 khối lượng</strong>. Xác nhận dòng tiền lớn tổ chức tham gia đẩy giá.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#16A34A] text-sm">Mẫu hình 2: Pullback MA20 / EMA20</span>
                <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">Rút chân</span>
              </div>
              <p className="text-[#647293]">
                Cổ phiếu trong xu hướng tăng kéo ngược về kiểm định hỗ trợ MA20. Thanh khoản trong nhịp giảm cạn kiệt và xuất hiện nến Hammer rút chân giữ vững hỗ trợ.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8B36FF] text-sm">Mẫu hình 3: Momentum Bứt phá</span>
                <span className="px-2 py-0.5 rounded bg-[#F3E8FF] text-[#8B36FF] text-[10px] font-bold">Động lượng</span>
              </div>
              <p className="text-[#647293]">
                Chỉ báo MACD cắt lên đường tín hiệu trên mức 0 kết hợp RSI dao động trong khoảng 55 - 65 hướng lên mạnh mẽ, thể hiện động lượng tăng giá đang đạt đỉnh cao.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#D97706] text-sm">Mẫu hình 4: Reversal Phân kỳ đáy</span>
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold">Đảo chiều</span>
              </div>
              <p className="text-[#647293]">
                Giá tạo đáy mới thấp hơn nhưng RSI hoặc MACD-Histogram tạo đáy cao hơn (Phân kỳ dương). Tín hiệu cảnh báo lực bán đã kiệt sức và sắp có nhịp hồi kỹ thuật ngắn hạn.
              </p>
            </div>
          </div>
        </div>

        {/* 1.3 Quy tắc cắt lỗ 2% NAV */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5FF]">
            <Calculator className="w-5 h-5 text-[#EF4444]" />
            <h3 className="text-base font-bold text-[#172554]">
              3. Quy tắc quản trị rủi ro bất biến 2% NAV
            </h3>
          </div>

          <div className="bg-[#FFF1F2] border border-[#FEE2E2] p-4 rounded-xl text-xs space-y-2">
            <div className="font-bold text-[#EF4444] text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Nguyên lý sống còn: Không bao giờ mạo hiểm quá 2% tổng tài sản cho một vị thế</span>
            </div>
            <p className="text-[#881337]">
              Công thức định cỡ khối lượng mua:
            </p>
            <div className="p-3 bg-white rounded-lg border border-[#FEE2E2] font-mono text-center text-[#172554] font-bold">
              Số cổ phiếu mua = (Tổng tài sản NAV × 2%) ÷ (Giá vào lệnh - Giá cắt lỗ)
            </div>
            <p className="text-[#881337] pt-1">
              <strong>Ví dụ thực tế:</strong> Bạn có tổng tài sản 200.000.000 đ. Mức rủi ro tối đa 2% là 4.000.000 đ. Khi mua FPT giá 135.000 đ với điểm cắt lỗ 127.000 đ (khoảng dừng lỗ là 8.000 đ/cp): Số cổ phiếu được phép mua = 4.000.000 ÷ 8.000 = <strong>500 cổ phiếu</strong>. Dù cổ phiếu chạm cắt lỗ, bạn chỉ mất đúng 2% NAV.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: CÂU HỎI THƯỜNG GẶP (FAQ) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#087CFF] font-bold text-sm uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>II. Câu hỏi thường gặp (FAQ)</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs divide-y divide-[#DCE5FF] overflow-hidden">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="p-4 lg:p-5">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="font-bold text-sm text-[#172554]">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#087CFF] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#647293] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="mt-3 text-xs text-[#647293] leading-relaxed animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: KÊNH HỖ TRỢ & LIÊN HỆ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#087CFF] font-bold text-sm uppercase tracking-wider">
          <Phone className="w-4 h-4" />
          <span>III. Kênh hỗ trợ khách hàng & Thông tin liên hệ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3FF] text-[#087CFF] flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#172554]">Zalo Hỗ trợ trực tuyến</h4>
            <p className="text-[#647293]">Hỗ trợ kỹ thuật, hướng dẫn cài đặt và giải đáp tín hiệu 24/7</p>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[#087CFF] font-bold pt-1 hover:underline"
            >
              Liên hệ qua Zalo &rarr;
            </a>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#172554]">Email hỗ trợ chính thức</h4>
            <p className="text-[#647293]">Gửi yêu cầu hợp tác, đối soát thanh toán và phản hồi dịch vụ</p>
            <a
              href="mailto:triqnnamabank@gmail.com"
              className="inline-block text-[#16A34A] font-bold pt-1 hover:underline font-mono"
            >
              triqnnamabank@gmail.com &rarr;
            </a>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#172554]">Chính sách & Miễn trừ</h4>
            <p className="text-[#647293]">Bảo mật thông tin khách hàng, minh bạch thuật toán định lượng</p>
            <span className="inline-block text-[#D97706] font-bold pt-1">
              Tuân thủ pháp luật Việt Nam
            </span>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-[#F4F7FF] border border-[#DCE5FF] text-[11px] text-[#647293] space-y-1">
          <p className="font-bold text-[#172554]">Tuyên bố miễn trừ trách nhiệm pháp lý:</p>
          <p>
            StockAI là công cụ phần mềm hỗ trợ phân tích kỹ thuật và định lượng dữ liệu chứng khoán. Nền tảng không thực hiện nghiệp vụ môi giới chứng khoán, không giữ tiền của khách hàng và không tự động đặt lệnh mua bán. Mọi quyết định giải ngân trên thị trường là quyết định độc lập của người dùng. Hãy luôn trang bị kiến thức và quản trị rủi ro nghiêm ngặt.
          </p>
        </div>
      </div>
    </div>
  );
}
