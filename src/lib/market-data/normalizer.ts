import { Exchange } from '@/types';

/**
 * Chuẩn hóa mã cổ phiếu (Ticker Symbol)
 * Luôn viết hoa, loại bỏ khoảng trắng thừa
 */
export function normalizeSymbol(rawSymbol: string): string {
  if (!rawSymbol) return '';
  return rawSymbol.trim().toUpperCase();
}

/**
 * Chuẩn hóa sàn giao dịch chứng khoán Việt Nam
 * Chỉ chấp nhận 3 sàn: HOSE, HNX, UPCOM
 */
export function normalizeExchange(rawExchange: string): Exchange {
  if (!rawExchange) return 'HOSE';
  const clean = rawExchange.trim().toUpperCase();
  if (clean.includes('HNX')) return 'HNX';
  if (clean.includes('UPCOM') || clean.includes('UPC')) return 'UPCOM';
  return 'HOSE';
}

/**
 * Chuyển đổi ngày từ các định dạng khác nhau (DD/MM/YYYY của SSI, ISO, timestamp)
 * về định dạng chuẩn ISO YYYY-MM-DD
 */
export function normalizeDate(rawDate: string | number | Date): string {
  if (!rawDate) {
    return new Date().toISOString().split('T')[0];
  }

  if (rawDate instanceof Date) {
    return rawDate.toISOString().split('T')[0];
  }

  if (typeof rawDate === 'number') {
    return new Date(rawDate).toISOString().split('T')[0];
  }

  const str = String(rawDate).trim();

  // Định dạng DD/MM/YYYY (SSI FastConnect)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // Định dạng ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // Cố gắng parse qua Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Định dạng ngày sang DD/MM/YYYY theo đúng yêu cầu tham số SSI API
 */
export function formatDateToSsi(isoDateStr: string): string {
  const norm = normalizeDate(isoDateStr);
  const parts = norm.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${now.getFullYear()}`;
}

/**
 * Chuẩn hóa giá cổ phiếu sang VNĐ chuẩn
 * Bảng giá VN thường hiển thị x1000 (ví dụ 28.5 tức 28,500 VNĐ).
 * SSI API trả về giá VNĐ trực tiếp (ví dụ 28500).
 * Hàm này tự động phát hiện và chuẩn hóa về VNĐ đầy đủ.
 */
export function normalizePrice(rawPrice: number | string, inputUnit: 'VND' | 'KVND' | 'AUTO' = 'AUTO'): number {
  const val = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/,/g, ''));
  if (isNaN(val) || val <= 0) return 0;

  if (inputUnit === 'KVND') {
    return Math.round(val * 1000);
  }

  if (inputUnit === 'VND') {
    return Math.round(val);
  }

  // Chế độ AUTO:
  // Trên sàn chứng khoán VN, giá cổ phiếu dao động từ 1,000 đ đến ~300,000 đ.
  // Nếu giá < 500, rất có thể là đơn vị ngàn đồng (ví dụ 28.5 = 28,500 đ).
  if (val < 500) {
    return Math.round(val * 1000);
  }

  return Math.round(val);
}

/**
 * Chuyển giá VNĐ sang đơn vị ngàn đồng để hiển thị trên bảng điện tử
 */
export function toBoardPrice(priceVnd: number): number {
  return Number((priceVnd / 1000).toFixed(2));
}

/**
 * Định dạng giá tiền VNĐ kèm đơn vị tiền tệ dễ đọc
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

/**
 * Chuẩn hóa khối lượng cổ phiếu (luôn là số nguyên dương)
 */
export function normalizeVolume(rawVolume: number | string): number {
  const val = typeof rawVolume === 'number' ? rawVolume : parseFloat(String(rawVolume).replace(/,/g, ''));
  if (isNaN(val) || val < 0) return 0;
  return Math.round(val);
}

/**
 * Xác định biên độ trần/sàn theo quy định Ủy ban Chứng khoán Nhà nước:
 * - HOSE: ±7%
 * - HNX: ±10%
 * - UPCoM: ±15%
 */
export function getExchangeBandPercentage(exchange: Exchange): number {
  switch (exchange) {
    case 'HOSE': return 0.07;
    case 'HNX': return 0.10;
    case 'UPCOM': return 0.15;
    default: return 0.07;
  }
}

/**
 * Tính giá Trần và Sàn lý thuyết từ Giá tham chiếu theo bước giá chuẩn HOSE/HNX/UPCoM
 */
export function calculateCeilingFloor(refPriceVnd: number, exchange: Exchange): { ceiling: number; floor: number } {
  const band = getExchangeBandPercentage(exchange);
  const ceiling = Math.round(refPriceVnd * (1 + band));
  const floor = Math.round(refPriceVnd * (1 - band));
  return { ceiling, floor };
}

/**
 * Kiểm tra xem một ngày có phải là ngày làm việc / giao dịch của thị trường Việt Nam không
 * (Thứ 2 đến Thứ 6, trừ các ngày nghỉ lễ theo Luật Lao động)
 */
export function isVietnamTradingDay(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  // Chủ nhật (0) hoặc Thứ bảy (6)
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Kiểm tra ngày lễ cố định:
  // 01/01 (Tết Dương lịch), 30/04 (Giải phóng), 01/05 (Quốc tế Lao động), 02/09 (Quốc khánh)
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 1 && day === 1) return false;
  if (month === 4 && day === 30) return false;
  if (month === 5 && day === 1) return false;
  if (month === 9 && (day === 1 || day === 2 || day === 3)) return false;

  return true;
}

/**
 * Kiểm tra trạng thái phiên giao dịch hiện tại của thị trường chứng khoán Việt Nam (Giờ UTC+7)
 */
export function getVietnamTradingSession(): {
  isTradingHours: boolean;
  sessionName: 'PRE_OPEN' | 'ATO' | 'MORNING_CONTINUOUS' | 'LUNCH_BREAK' | 'AFTERNOON_CONTINUOUS' | 'ATC' | 'POST_CLOSE' | 'CLOSED';
  description: string;
} {
  const now = new Date();
  
  // Tính giờ UTC+7
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const vnMinutesTotal = ((utcHours + 7) % 24) * 60 + utcMinutes;

  if (!isVietnamTradingDay(now)) {
    return { isTradingHours: false, sessionName: 'CLOSED', description: 'Thị trường đóng cửa (Cuối tuần / Ngày lễ)' };
  }

  // 09:00 (540 phút) đến 09:15 (555 phút): Phiên ATO
  if (vnMinutesTotal >= 540 && vnMinutesTotal < 555) {
    return { isTradingHours: true, sessionName: 'ATO', description: 'Phiên khớp lệnh định kỳ mở cửa (ATO - HOSE)' };
  }
  // 09:15 đến 11:30 (690 phút): Khớp lệnh liên tục sáng
  if (vnMinutesTotal >= 555 && vnMinutesTotal < 690) {
    return { isTradingHours: true, sessionName: 'MORNING_CONTINUOUS', description: 'Phiên khớp lệnh liên tục sáng' };
  }
  // 11:30 đến 13:00 (780 phút): Nghỉ trưa
  if (vnMinutesTotal >= 690 && vnMinutesTotal < 780) {
    return { isTradingHours: false, sessionName: 'LUNCH_BREAK', description: 'Nghỉ giữa phiên' };
  }
  // 13:00 đến 14:30 (870 phút): Khớp lệnh liên tục chiều
  if (vnMinutesTotal >= 780 && vnMinutesTotal < 870) {
    return { isTradingHours: true, sessionName: 'AFTERNOON_CONTINUOUS', description: 'Phiên khớp lệnh liên tục chiều' };
  }
  // 14:30 đến 14:45 (885 phút): Phiên ATC
  if (vnMinutesTotal >= 870 && vnMinutesTotal < 885) {
    return { isTradingHours: true, sessionName: 'ATC', description: 'Phiên khớp lệnh định kỳ đóng cửa (ATC)' };
  }
  // 14:45 đến 15:00 (900 phút): Giao dịch thỏa thuận sau giờ
  if (vnMinutesTotal >= 885 && vnMinutesTotal <= 900) {
    return { isTradingHours: false, sessionName: 'POST_CLOSE', description: 'Phiên giao dịch thỏa thuận / Tổng kết' };
  }

  return { isTradingHours: false, sessionName: 'CLOSED', description: 'Thị trường đã đóng cửa (Dữ liệu EOD)' };
}
