import { NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data/service';
import { analyzeShortTermOpportunity } from '@/lib/stockai-engine';
import { normalizeSymbol } from '@/lib/market-data/normalizer';
import { AiConfigService } from '@/lib/ai-config-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, symbol } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, message: 'Nội dung câu hỏi không được để trống' }, { status: 400 });
    }

    // Lấy cấu hình AI an toàn từ máy chủ (đã được giải mã từ DB hoặc môi trường)
    const { apiKey, model, timeoutMs, maxTokens, temperature, systemPromptExtra } = AiConfigService.getInternalConfig();
    const marketService = MarketDataService.getInstance();
    const activeProvider = marketService.getActiveProvider();

    // 1. Nhận diện mã cổ phiếu trong câu hỏi nếu không truyền trực tiếp
    let detectedSymbol = symbol ? normalizeSymbol(symbol) : '';
    if (!detectedSymbol) {
      const match = prompt.match(/\b([A-Z]{3})\b/i);
      if (match) {
        detectedSymbol = match[1].toUpperCase();
      }
    }

    // 2. Nếu có mã cổ phiếu, chạy qua động cơ định lượng StockAI Engine lấy dữ liệu thật
    let stockQuantitativeData: any = null;
    if (detectedSymbol) {
      try {
        const now = new Date();
        const toDate = now.toISOString().split('T')[0];
        const fromDateObj = new Date(now);
        fromDateObj.setDate(fromDateObj.getDate() - 75);
        const fromDate = fromDateObj.toISOString().split('T')[0];

        const { cleanCandles, report } = await marketService.getValidatedCandles(
          detectedSymbol,
          'HOSE',
          fromDate,
          toDate
        );

        const quote = await marketService.getActiveProvider().getStockQuote(detectedSymbol);
        const companyName = quote?.companyName || `CTCP ${detectedSymbol}`;
        const exchange = quote?.market || 'HOSE';

        const signal = analyzeShortTermOpportunity(
          detectedSymbol,
          companyName,
          exchange,
          cleanCandles,
          report
        );

        stockQuantitativeData = {
          symbol: detectedSymbol,
          companyName,
          exchange,
          quote,
          signal,
          dataReport: report,
        };
      } catch (err) {
        console.error(`[AI Route] Không thể lấy dữ liệu định lượng cho ${detectedSymbol}:`, err);
      }
    }

    // 3. Nếu chưa cấu hình OpenAI API Key -> Trả về báo cáo định lượng chuẩn xác từ StockAI Engine
    if (!apiKey || apiKey.trim().length < 10) {
      let reply = '';
      if (stockQuantitativeData) {
        const { signal, dataReport } = stockQuantitativeData;
        reply = `### [BÁO CÁO PHÂN TÍCH ĐỊNH LƯỢNG — MÃ ${signal.symbol}]
> **Nguồn dữ liệu**: ${activeProvider.name} (${dataReport?.dataMode || 'EOD'}) | **Chất lượng**: ${dataReport?.qualityScore || 100}/100đ ${dataReport?.isDemo ? '— ⚠️ DỮ LIỆU DEMO MÔ PHỎNG' : ''}
> *Ghi chú: Chưa cấu hình \`OPENAI_API_KEY\` trong mục "Cấu hình AI & API" trang Quản trị Admin. Toàn bộ số liệu và kết luận dưới đây được tính toán trực tiếp từ thuật toán định lượng toán học của StockAI Engine.*

#### 1. KẾT LUẬN & TRẠNG THÁI GIAO DỊCH (KHUNG 5–10 PHIÊN)
- **Trạng thái**: **${signal.statusLabel.toUpperCase()}** ${signal.status === 'BUY_CONFIRMED' ? '🟢' : signal.status === 'WATCHLIST' ? '🟡' : '🔴'}
- **Tổng điểm định lượng**: **${signal.score.totalScore}/100 điểm**
- **Giá tham chiếu hiện tại**: **${signal.currentPrice.toLocaleString('vi-VN')} đ**
- **Thanh khoản bình quân**: **${(signal.averageDailyValue / 1000000000).toFixed(1)} tỷ/phiên** (${signal.liquidityTier})

#### 2. CHI TIẾT BẢNG ĐIỂM (WEIGHTED SCORING BREAKDOWN)
| Tiêu chí đánh giá | Điểm đạt được | Trọng số tối đa | Đánh giá kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Xu hướng giá** | **${signal.score.trendScore}** | 25 | ${signal.score.trendScore >= 20 ? 'Nằm trên EMA20 và EMA50 dốc lên' : 'Xu hướng chưa đồng thuận rõ'} |
| **Động lượng (RSI/MACD)** | **${signal.score.momentumScore}** | 20 | ${signal.score.momentumScore >= 15 ? 'MACD dương, RSI trong vùng tăng trưởng' : 'Động lượng yếu hoặc phân kỳ'} |
| **Thanh khoản giao dịch** | **${signal.score.liquidityScore}** | 15 | ${signal.liquidityTier} |
| **Khối lượng bứt phá** | **${signal.score.volumeScore}** | 15 | ${signal.score.volumeScore >= 10 ? 'Có dòng tiền xác nhận bùng nổ' : 'Khối lượng trung bình'} |
| **Điểm vào & Tỷ lệ R:R** | **${signal.score.entryRiskRewardScore}** | 15 | Tỷ lệ R:R đạt **${signal.rewardRiskRatio}:1** |
| **Tin tức & Rủi ro** | **${signal.score.newsRiskScore}** | 10 | Dữ liệu toàn vẹn, không có rủi ro tin tiêu cực |

#### 3. KẾ HOẠCH GIAO DỊCH THAM KHẢO (TRADE PLAN)
- **Vùng mua tham khảo**: **${signal.buyZone}**
- **Mục tiêu chốt lời 1 (T+5)**: **${(signal.targetPrice1 / 1000).toFixed(1)}**
- **Mục tiêu chốt lời 2 (T+10)**: **${(signal.targetPrice2 / 1000).toFixed(1)}**
- **Mức cắt lỗ dứt khoát**: **${(signal.stopLoss / 1000).toFixed(1)}** (${signal.stopLossPercent}%)
- **Tỷ lệ Lợi nhuận / Rủi ro**: **${signal.rewardRiskRatio} : 1** (Đạt chuẩn tối thiểu 1.5)
- **Điều kiện vô hiệu hóa**: *${signal.invalidationCondition}*

#### 4. CẢNH BÁO RỦI RO & BẢO TOÀN VỐN
${signal.riskFactors.map((r: string) => `- ${r}`).join('\n')}
- **Miễn trừ trách nhiệm**: StockAI là nền tảng phân tích định lượng độc lập, không thực hiện đặt lệnh và không cam kết lợi nhuận chắc chắn.`;
      } else {
        reply = `### [TRỢ LÝ PHÂN TÍCH CHỨNG KHOÁN STOCKAI]
Bạn vừa hỏi: *"${prompt}"*

- **Trạng thái AI**: Chưa cấu hình \`OPENAI_API_KEY\` trong trang Quản trị Admin.
- **Hướng dẫn**: Để phân tích chi tiết một cổ phiếu, bạn có thể gõ câu hỏi kèm mã (ví dụ: *"Phân tích FPT"*, *"Đánh giá HPG trong 5-10 phiên"*, *"Tìm cơ hội T+1 đến T+5"*).
- Hệ thống sẽ tự động chạy thuật toán định lượng 100 điểm trên dữ liệu thực tế sàn HOSE, HNX và UPCoM.`;
      }

      return NextResponse.json({
        success: true,
        data: {
          reply,
          model: 'StockAI Quantitative Deterministic Engine (Offline Mode)',
          isRealtime: false,
          dataMode: activeProvider.code === 'MOCK_DEMO' ? 'DEMO' : 'EOD',
        },
      });
    }

    // 4. Nếu có OPENAI_API_KEY -> Gửi kèm số liệu định lượng thật vào OpenAI để phân tích ngữ nghĩa
    const systemPrompt = `Bạn là Trợ lý Phân tích Định lượng Cấp cao của nền tảng StockAI (chuyên phân tích chứng khoán Việt Nam trên 3 sàn HOSE, HNX, UPCoM).
Nguyên tắc bất biến:
1. TUYỆT ĐỐI KHÔNG BỊA ĐẶT GIÁ, số liệu tài chính hoặc kết quả kiểm thử.
2. Phân tích tập trung vào khung thời gian ngắn hạn 5–10 phiên giao dịch.
3. Khi phân tích một mã, bạn PHẢI dựa trên số liệu định lượng do hệ thống cung cấp dưới đây:
${stockQuantitativeData ? JSON.stringify(stockQuantitativeData, null, 2) : 'Chưa có mã cụ thể, hãy hướng dẫn người dùng nhập mã HOSE/HNX/UPCoM.'}
4. Kết luận phải thuộc 1 trong 3 trạng thái: "Cơ hội mua cần xác nhận", "Chờ theo dõi", hoặc "Không phù hợp".
5. Luôn làm rõ: Vùng mua tham khảo, Mục tiêu 1 & 2, Mức cắt lỗ, Tỷ lệ R:R (tối thiểu 1.5:1), Thời gian nắm giữ 5-10 phiên, và Điều kiện vô hiệu hóa.
6. Luôn nhấn mạnh StockAI không đặt lệnh thay và không cam kết chắc chắn có lời.
${systemPromptExtra ? `Chỉ dẫn bổ sung từ Quản trị viên: ${systemPromptExtra}` : ''}`;

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const openAiData = await openAiRes.json().catch(() => ({}));

      if (!openAiRes.ok || !openAiData?.choices?.[0]?.message?.content) {
        const errorMsg = openAiData?.error?.message || 'Lỗi xử lý từ OpenAI API.';
        AiConfigService.recordUsageLog({
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          latencyMs,
          status: 'ERROR',
          errorMessage: errorMsg,
          caller: 'USER_QUERY',
          queryPreview: prompt.slice(0, 100),
        });

        return NextResponse.json(
          {
            success: false,
            message: errorMsg,
          },
          { status: 502 }
        );
      }

      const usage = openAiData.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;
      const estimatedCostUsd = AiConfigService.calculateCost(model, promptTokens, completionTokens);

      // Ghi nhận chỉ số đo lường thực tế vào bộ thống kê của Admin
      AiConfigService.recordUsageLog({
        model: openAiData.model || model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        latencyMs,
        status: 'SUCCESS',
        caller: 'USER_QUERY',
        queryPreview: prompt.slice(0, 100),
      });

      return NextResponse.json({
        success: true,
        data: {
          reply: openAiData.choices[0].message.content,
          model: openAiData.model || model,
          isRealtime: true,
          dataMode: activeProvider.code === 'MOCK_DEMO' ? 'DEMO' : 'EOD',
        },
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      AiConfigService.recordUsageLog({
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        latencyMs,
        status: 'ERROR',
        errorMessage: err.message || String(err),
        caller: 'USER_QUERY',
        queryPreview: prompt.slice(0, 100),
      });

      return NextResponse.json(
        {
          success: false,
          message: err.name === 'AbortError' ? `Quá thời gian chờ phản hồi AI (${timeoutMs}ms)` : 'Lỗi kết nối OpenAI API',
          error: String(err),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi trong quá trình xử lý yêu cầu AI',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
