import { Exchange } from '@/types';
import { Candle } from '@/lib/t3-engine';
import { 
  DataMode, 
  DataQualityReport, 
  DataQualityStatus, 
  NormalizedOhlcv 
} from './types';
import { 
  normalizeDate, 
  getExchangeBandPercentage, 
  getVietnamTradingSession 
} from './normalizer';

/**
 * Bộ kiểm định và làm sạch dữ liệu nến chứng khoán (Quality Checker & Sanitizer)
 */
export function validateAndSanitizeCandles(
  symbol: string,
  exchange: Exchange,
  rawBars: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>,
  isDemo: boolean = false,
  dataMode: DataMode = 'EOD'
): { cleanCandles: Candle[]; report: DataQualityReport } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawBars || rawBars.length === 0) {
    return {
      cleanCandles: [],
      report: {
        symbol,
        totalBars: 0,
        validBars: 0,
        status: 'INSUFFICIENT',
        qualityScore: 0,
        isStale: true,
        isDemo,
        errors: ['Không có dữ liệu nến nào được trả về từ nhà cung cấp.'],
        warnings: [],
        lastUpdated: new Date().toISOString(),
        dataMode,
      },
    };
  }

  // 1. Chuẩn hóa ngày và loại bỏ bản ghi trùng lặp (Deduplication)
  const mapByDate = new Map<string, Candle>();
  let duplicateCount = 0;

  for (const bar of rawBars) {
    const normDate = normalizeDate(bar.date);
    if (mapByDate.has(normDate)) {
      duplicateCount++;
    }
    // Ghi đè bằng bản ghi mới nhất nếu trùng ngày
    mapByDate.set(normDate, {
      date: normDate,
      open: Math.round(bar.open),
      high: Math.round(bar.high),
      low: Math.round(bar.low),
      close: Math.round(bar.close),
      volume: Math.round(bar.volume),
    });
  }

  if (duplicateCount > 0) {
    warnings.push(`Đã phát hiện và loại bỏ ${duplicateCount} bản ghi trùng lặp ngày.`);
  }

  // 2. Sắp xếp theo thứ tự thời gian tăng dần (Chronological order)
  const sortedBars: Candle[] = Array.from(mapByDate.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 3. Kiểm định từng nến theo quy tắc kỹ thuật và biên độ sàn HOSE/HNX/UPCoM
  const cleanCandles: Candle[] = [];
  let corruptedCount = 0;
  let bandViolationCount = 0;
  const bandLimit = getExchangeBandPercentage(exchange);

  for (let i = 0; i < sortedBars.length; i++) {
    const c = sortedBars[i];
    let isBarValid = true;

    // Quy tắc 1: Giá trị phải dương
    if (c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0 || c.volume < 0) {
      corruptedCount++;
      errors.push(`Phiên ${c.date}: Giá hoặc khối lượng mang giá trị không hợp lệ (<= 0).`);
      isBarValid = false;
    }

    // Quy tắc 2: Logic OHLC bất biến (High phải là cao nhất, Low phải là thấp nhất)
    if (c.high < c.low || c.high < c.open || c.high < c.close || c.low > c.open || c.low > c.close) {
      corruptedCount++;
      errors.push(`Phiên ${c.date}: Vi phạm logic OHLC (High: ${c.high}, Low: ${c.low}, Open: ${c.open}, Close: ${c.close}).`);
      isBarValid = false;
    }

    // Quy tắc 3: Kiểm tra biên độ trần sàn so với phiên liền trước
    if (i > 0 && isBarValid) {
      const prevClose = sortedBars[i - 1].close;
      if (prevClose > 0) {
        const changeRatio = Math.abs(c.close - prevClose) / prevClose;
        // Cho phép dung sai 1% phòng trường hợp chia tách cổ tức / tăng vốn
        if (changeRatio > (bandLimit + 0.02)) {
          bandViolationCount++;
          warnings.push(
            `Phiên ${c.date}: Biến động giá ${(changeRatio * 100).toFixed(1)}% vượt quá biên độ sàn ${exchange} (${(bandLimit * 100)}%). Có thể do sự kiện chia tách hoặc cổ tức.`
          );
        }
      }
    }

    if (isBarValid) {
      cleanCandles.push(c);
    }
  }

  // 4. Kiểm tra độ cũ của dữ liệu (Staleness Detection)
  const session = getVietnamTradingSession();
  const lastBar = cleanCandles[cleanCandles.length - 1];
  let isStale = false;

  if (lastBar) {
    const lastDate = new Date(lastBar.date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    // Nếu khoảng cách trên 4 ngày (loại trừ cuối tuần) -> dữ liệu quá cũ
    if (diffDays > 4) {
      isStale = true;
      warnings.push(`Dữ liệu cập nhật gần nhất từ ngày ${lastBar.date} (đã cách đây ${diffDays} ngày).`);
    }
  } else {
    isStale = true;
  }

  // 5. Cảnh báo dữ liệu DEMO
  if (isDemo || dataMode === 'DEMO') {
    warnings.push('⚠️ ĐANG SỬ DỤNG DỮ LIỆU DEMO MÔ PHỎNG. KHÔNG SỬ DỤNG ĐỂ ĐẶT LỆNH GIAO DỊCH THẬT!');
  }

  // 6. Tính điểm chất lượng dữ liệu (Quality Score 0 - 100)
  let score = 100;
  if (corruptedCount > 0) score -= Math.min(corruptedCount * 15, 50);
  if (bandViolationCount > 0) score -= Math.min(bandViolationCount * 5, 20);
  if (duplicateCount > 0) score -= 10;
  if (isStale) score -= 20;
  if (cleanCandles.length < 20) score -= 30;
  score = Math.max(0, Math.min(100, score));

  // 7. Xác định trạng thái chung
  let status: DataQualityStatus = 'VALID';
  if (cleanCandles.length < 20) {
    status = 'INSUFFICIENT';
    warnings.push(`Chỉ có ${cleanCandles.length} nến hợp lệ. Cần tối thiểu 20 phiên để sàng lọc T+3 chính xác.`);
  } else if (corruptedCount > 0) {
    status = 'CORRUPTED';
  } else if (isStale) {
    status = 'STALE';
  } else if (warnings.length > 0) {
    status = 'WARNING';
  }

  return {
    cleanCandles,
    report: {
      symbol,
      totalBars: rawBars.length,
      validBars: cleanCandles.length,
      status,
      qualityScore: score,
      isStale,
      isDemo,
      errors,
      warnings,
      lastUpdated: new Date().toISOString(),
      dataMode,
    },
  };
}

/**
 * Kiểm tra xem dữ liệu có đủ điều kiện an toàn để phát sinh tín hiệu giao dịch T+3 hay không
 * Nghiêm ngặt: TUYỆT ĐỐI KHÔNG PHÁT SINH TÍN HIỆU THẬT TỪ DỮ LIỆU DEMO HOẶC LỖI!
 */
export function canGenerateLiveTradingSignal(report: DataQualityReport): {
  allowed: boolean;
  reason?: string;
} {
  if (report.isDemo || report.dataMode === 'DEMO') {
    return {
      allowed: false,
      reason: 'DỮ LIỆU DEMO MÔ PHỎNG: Tuyệt đối không sử dụng dữ liệu giả lập để phát tín hiệu giao dịch thực tế!',
    };
  }

  if (report.status === 'CORRUPTED') {
    return {
      allowed: false,
      reason: 'DỮ LIỆU BỊ LỖI LOGIC: Nến giá có xung đột OHLC, không đủ tin cậy để chạy thuật toán định lượng.',
    };
  }

  if (report.status === 'INSUFFICIENT') {
    return {
      allowed: false,
      reason: 'DỮ LIỆU KHÔNG ĐỦ: Cần tối thiểu 20 phiên nến để tính các chỉ báo MA20, MA50, RSI và Volume Surge.',
    };
  }

  if (report.isStale) {
    return {
      allowed: false,
      reason: 'DỮ LIỆU QUÁ CŨ (STALE): Giá chưa được cập nhật theo phiên gần nhất, rủi ro tín hiệu trễ.',
    };
  }

  return { allowed: true };
}
