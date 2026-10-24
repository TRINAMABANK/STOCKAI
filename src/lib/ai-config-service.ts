import crypto from 'crypto';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AiConfig, AiUsageLog, AiUsageStats } from '@/types';

// Bí mật mã hóa cấp máy chủ (không bao giờ lộ ra frontend)
const AI_SECRET_SEED = process.env.AI_CONFIG_SECRET || process.env.SESSION_SECRET || 'stockai-ai-secret-encryption-master-key-2026';
const ENCRYPTION_KEY = crypto.scryptSync(AI_SECRET_SEED, 'stockai-ai-salt-2026', 32);

// Bảng giá token OpenAI chính thức (USD / 1.000.000 tokens)
export interface ModelPricing {
  modelId: string;
  name: string;
  description: string;
  contextWindow: string;
  inputCostPer1M: number;  // USD
  outputCostPer1M: number; // USD
  isRecommended?: boolean;
}

export const VERIFIED_OPENAI_MODELS: ModelPricing[] = [
  {
    modelId: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Tối ưu chi phí & tốc độ cao nhất, suy luận tài chính xuất sắc (Khuyên dùng)',
    contextWindow: '128K tokens',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    isRecommended: true,
  },
  {
    modelId: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    description: 'Mô hình flagship cao cấp, khả năng phân tích ngữ nghĩa và định lượng chuyên sâu',
    contextWindow: '128K tokens',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
  },
  {
    modelId: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Mô hình GPT-4 hiệu năng cao truyền thống',
    contextWindow: '128K tokens',
    inputCostPer1M: 10.00,
    outputCostPer1M: 30.00,
  },
  {
    modelId: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Mô hình kế thừa thế hệ trước, tốc độ phản hồi nhanh',
    contextWindow: '16K tokens',
    inputCostPer1M: 0.50,
    outputCostPer1M: 1.50,
  },
  {
    modelId: 'o1-mini',
    name: 'o1-mini',
    description: 'Mô hình lý luận chuỗi tư duy (Chain-of-thought) cho bài toán số liệu',
    contextWindow: '128K tokens',
    inputCostPer1M: 3.00,
    outputCostPer1M: 12.00,
  },
  {
    modelId: 'o1-preview',
    name: 'o1-preview',
    description: 'Mô hình lý luận phức tạp chuyên sâu cao cấp',
    contextWindow: '128K tokens',
    inputCostPer1M: 15.00,
    outputCostPer1M: 60.00,
  },
];

const USD_TO_VND_RATE = 25400;

// Bộ đệm chống spam test API (Rate Limiting)
const testCallTimestamps: number[] = [];
const MAX_TEST_CALLS_PER_MINUTE = 10;

export class AiConfigService {
  /**
   * Mã hóa API key bằng AES-256-GCM
   */
  static encryptApiKey(plainKey: string): { encryptedApiKey: string; iv: string; tag: string; maskedApiKey: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    const maskedApiKey = this.maskApiKey(plainKey);

    return {
      encryptedApiKey: encrypted,
      iv: iv.toString('hex'),
      tag,
      maskedApiKey,
    };
  }

  /**
   * Giải mã API key an toàn
   */
  static decryptApiKey(encryptedHex: string, ivHex: string, tagHex: string): string | null {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error('[AiConfigService] Lỗi giải mã API key:', e);
      return null;
    }
  }

  /**
   * Che giấu API key (Masking), chỉ hiển thị 4 ký tự cuối
   */
  static maskApiKey(key: string): string {
    if (!key || typeof key !== 'string') return '';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '****';
    const lastFour = trimmed.slice(-4);
    if (trimmed.startsWith('sk-proj-')) {
      return `sk-proj-...${lastFour}`;
    }
    return `sk-...${lastFour}`;
  }

  /**
   * Lấy cấu hình công khai (An toàn để gửi về frontend Admin - KHÔNG chứa raw key)
   */
  static getPublicConfig(): {
    provider: string;
    model: string;
    isConfigured: boolean;
    hasEnvKey: boolean;
    maskedApiKey: string;
    timeoutMs: number;
    maxTokens: number;
    temperature: number;
    systemPromptExtra: string;
    updatedAt: string;
    updatedBy: string;
    verifiedModels: ModelPricing[];
  } {
    const db = getDatabase();
    const config = db.ai_config;
    const envKey = process.env.OPENAI_API_KEY;

    let isConfigured = false;
    let maskedKey = '';

    // Ưu tiên key mã hóa trong DB, sau đó đến biến môi trường
    if (config?.encryptedApiKey && config?.encryptionIv && config?.encryptionTag) {
      isConfigured = true;
      maskedKey = config.maskedApiKey || 'sk-***[ENCRYPTED]';
    } else if (envKey && envKey.trim().length >= 10) {
      isConfigured = true;
      maskedKey = this.maskApiKey(envKey) + ' (từ .env)';
    }

    const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    return {
      provider: 'OpenAI',
      model: config?.model || defaultModel,
      isConfigured,
      hasEnvKey: Boolean(envKey && envKey.trim().length >= 10),
      maskedApiKey: maskedKey,
      timeoutMs: config?.timeoutMs || 30000,
      maxTokens: config?.maxTokens || 1500,
      temperature: config?.temperature ?? 0.3,
      systemPromptExtra: config?.systemPromptExtra || '',
      updatedAt: config?.updatedAt || new Date().toISOString(),
      updatedBy: config?.updatedBy || 'System',
      verifiedModels: VERIFIED_OPENAI_MODELS,
    };
  }

  /**
   * Lấy API key giải mã và tham số thực thi (CHỈ DÙNG BÊN PHÍA SERVER)
   */
  static getInternalConfig(): {
    apiKey: string | null;
    model: string;
    timeoutMs: number;
    maxTokens: number;
    temperature: number;
    systemPromptExtra: string;
  } {
    const db = getDatabase();
    const config = db.ai_config;
    let apiKey: string | null = null;

    if (config?.encryptedApiKey && config?.encryptionIv && config?.encryptionTag) {
      apiKey = this.decryptApiKey(config.encryptedApiKey, config.encryptionIv, config.encryptionTag);
    }

    // Dự phòng biến môi trường nếu DB chưa cấu hình hoặc giải mã lỗi
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY || null;
    }

    const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    return {
      apiKey,
      model: config?.model || defaultModel,
      timeoutMs: config?.timeoutMs || 30000,
      maxTokens: config?.maxTokens || 1500,
      temperature: config?.temperature ?? 0.3,
      systemPromptExtra: config?.systemPromptExtra || '',
    };
  }

  /**
   * Lưu hoặc cập nhật cấu hình AI từ Admin (có ghi Audit Log)
   */
  static saveConfig(
    adminUsername: string,
    params: {
      apiKey?: string;
      model?: string;
      timeoutMs?: number;
      maxTokens?: number;
      temperature?: number;
      systemPromptExtra?: string;
    }
  ): { success: boolean; message: string; config: ReturnType<typeof AiConfigService.getPublicConfig> } {
    const db = getDatabase();
    const currentConfig = db.ai_config;
    const now = new Date().toISOString();

    let encryptedData: { encryptedApiKey?: string; encryptionIv?: string; encryptionTag?: string; maskedApiKey?: string } = {};

    // Nếu người dùng cung cấp API Key mới
    if (params.apiKey && params.apiKey.trim().length > 0) {
      const cleanKey = params.apiKey.trim();
      if (!cleanKey.startsWith('sk-')) {
        throw new Error('API key OpenAI không hợp lệ. Khóa phải bắt đầu bằng "sk-".');
      }
      if (cleanKey.length < 20) {
        throw new Error('API key quá ngắn. Vui lòng kiểm tra lại khóa OpenAI của bạn.');
      }
      const enc = this.encryptApiKey(cleanKey);
      encryptedData = {
        encryptedApiKey: enc.encryptedApiKey,
        encryptionIv: enc.iv,
        encryptionTag: enc.tag,
        maskedApiKey: enc.maskedApiKey,
      };
    } else {
      // Giữ nguyên key cũ nếu không nhập key mới
      if (currentConfig?.encryptedApiKey) {
        encryptedData = {
          encryptedApiKey: currentConfig.encryptedApiKey,
          encryptionIv: currentConfig.encryptionIv,
          encryptionTag: currentConfig.encryptionTag,
          maskedApiKey: currentConfig.maskedApiKey,
        };
      }
    }

    const newModel = params.model?.trim() || currentConfig?.model || 'gpt-4o-mini';
    const newTimeout = Math.max(5000, Math.min(120000, Number(params.timeoutMs) || 30000));
    const newMaxTokens = Math.max(256, Math.min(8192, Number(params.maxTokens) || 1500));
    const newTemp = Math.max(0, Math.min(1.0, typeof params.temperature === 'number' ? params.temperature : 0.3));

    const updatedConfig: AiConfig = {
      provider: 'OPENAI',
      model: newModel,
      isConfigured: Boolean(encryptedData.encryptedApiKey || process.env.OPENAI_API_KEY),
      maskedApiKey: encryptedData.maskedApiKey || (process.env.OPENAI_API_KEY ? this.maskApiKey(process.env.OPENAI_API_KEY) : undefined),
      encryptedApiKey: encryptedData.encryptedApiKey,
      encryptionIv: encryptedData.encryptionIv,
      encryptionTag: encryptedData.encryptionTag,
      timeoutMs: newTimeout,
      maxTokens: newMaxTokens,
      temperature: newTemp,
      systemPromptExtra: params.systemPromptExtra ?? currentConfig?.systemPromptExtra ?? '',
      updatedAt: now,
      updatedBy: adminUsername,
    };

    db.ai_config = updatedConfig;

    // Ghi Audit Log an toàn (TUYỆT ĐỐI KHÔNG GHI RAW KEY)
    const auditChanges: string[] = [];
    if (params.apiKey) auditChanges.push('Cập nhật API Key (đã mã hóa AES-256-GCM)');
    if (params.model && params.model !== currentConfig?.model) auditChanges.push(`Đổi mô hình: ${currentConfig?.model || 'mặc định'} -> ${params.model}`);
    if (params.timeoutMs && params.timeoutMs !== currentConfig?.timeoutMs) auditChanges.push(`Đổi timeout: ${newTimeout}ms`);
    if (params.maxTokens && params.maxTokens !== currentConfig?.maxTokens) auditChanges.push(`Đổi max tokens: ${newMaxTokens}`);

    if (auditChanges.length > 0) {
      if (!db.audit_logs) db.audit_logs = [];
      db.audit_logs.unshift({
        id: `audit_ai_${Date.now()}`,
        action: 'UPDATE_AI_CONFIG',
        targetUserId: 'SYSTEM_AI_CONFIG',
        targetUserEmail: 'admin@stockai.local',
        performedBy: {
          id: adminUsername,
          email: adminUsername,
          role: 'ADMIN',
        },
        timestamp: now,
        details: {
          note: `Quản trị viên cập nhật cấu hình OpenAI: ${auditChanges.join('; ')}`,
          model: newModel,
          isKeyConfigured: updatedConfig.isConfigured,
          maskedKey: updatedConfig.maskedApiKey,
        },
      });
    }

    saveDatabase(db);

    return {
      success: true,
      message: 'Lưu cấu hình AI & API thành công!',
      config: this.getPublicConfig(),
    };
  }

  /**
   * Kiểm tra tần suất gọi test để tránh spam làm tốn chi phí
   */
  static checkRateLimit(): void {
    const now = Date.now();
    // Xóa các mốc thời gian ngoài 60s
    while (testCallTimestamps.length > 0 && now - testCallTimestamps[0] > 60000) {
      testCallTimestamps.shift();
    }
    if (testCallTimestamps.length >= MAX_TEST_CALLS_PER_MINUTE) {
      throw new Error(`Đã đạt giới hạn ${MAX_TEST_CALLS_PER_MINUTE} lượt gọi thử/phút. Vui lòng chờ vài giây trước khi thử lại.`);
    }
    testCallTimestamps.push(now);
  }

  /**
   * Kiểm tra kết nối thật tới OpenAI API
   */
  static async testConnection(): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    details?: any;
    errorType?: 'AUTH_ERROR' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'MODEL_NOT_FOUND' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  }> {
    this.checkRateLimit();

    const { apiKey, timeoutMs } = this.getInternalConfig();

    if (!apiKey) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Chưa cấu hình API Key. Vui lòng nhập OpenAI API Key và bấm Lưu cấu hình trước khi kiểm tra.',
        errorType: 'AUTH_ERROR',
      };
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 20000));

    try {
      // Gọi endpoint /v1/models để kiểm tra xác thực và kết nối
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: `Kết nối thành công tới OpenAI API! Độ trễ phản hồi: ${latencyMs}ms.`,
          details: {
            totalModelsAccessible: Array.isArray(data.data) ? data.data.length : 0,
          },
        };
      }

      // Xử lý các mã lỗi cụ thể từ OpenAI
      const status = res.status;
      const errMsg = data?.error?.message || res.statusText;
      const errCode = data?.error?.code || '';

      if (status === 401) {
        return {
          success: false,
          latencyMs,
          message: 'Lỗi xác thực (401): API Key không chính xác hoặc đã bị thu hồi trên OpenAI Platform.',
          errorType: 'AUTH_ERROR',
          details: { solution: 'Vui lòng kiểm tra lại API Key trên https://platform.openai.com/api-keys và cập nhật lại.' },
        };
      }

      if (status === 429) {
        if (errCode === 'insufficient_quota' || errMsg.toLowerCase().includes('quota')) {
          return {
            success: false,
            latencyMs,
            message: 'Hết hạn mức thanh toán (429 - Insufficient Quota): Tài khoản OpenAI chưa nạp tiền hoặc đã hết số dư khả dụng.',
            errorType: 'QUOTA_EXCEEDED',
            details: { solution: 'Vui lòng nạp thêm tín dụng tại https://platform.openai.com/settings/organization/billing.' },
          };
        }
        return {
          success: false,
          latencyMs,
          message: 'Vượt giới hạn tốc độ (429 - Rate Limit): Đã vượt số lượt yêu cầu cho phép/phút.',
          errorType: 'RATE_LIMITED',
          details: { solution: 'Vui lòng giảm tần suất gọi hoặc nâng cấp bậc hạn mức trên tài khoản OpenAI.' },
        };
      }

      return {
        success: false,
        latencyMs,
        message: `OpenAI phản hồi lỗi (${status}): ${errMsg}`,
        errorType: 'UNKNOWN',
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (err.name === 'AbortError') {
        return {
          success: false,
          latencyMs,
          message: `Quá thời gian kết nối (Timeout) sau ${timeoutMs}ms. Kiểm tra kết nối mạng máy chủ tới OpenAI.`,
          errorType: 'TIMEOUT',
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối mạng: Không thể kết nối tới api.openai.com (${err.message || String(err)})`,
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Thử nghiệm một yêu cầu phân tích chứng khoán mẫu thực tế
   */
  static async testSampleAnalysis(symbol = 'FPT'): Promise<{
    success: boolean;
    latencyMs: number;
    responsePreview?: string;
    modelUsed?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
    message: string;
    errorType?: string;
  }> {
    this.checkRateLimit();

    const { apiKey, model, timeoutMs, temperature } = this.getInternalConfig();

    if (!apiKey) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Chưa cấu hình API Key. Vui lòng nhập OpenAI API Key trước khi thử phân tích.',
        errorType: 'AUTH_ERROR',
      };
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 30000));

    const samplePrompt = `Phân tích ngắn gọn mã ${symbol} (HOSE) trong 2 câu: Xu hướng kỹ thuật và khuyến nghị quản trị rủi ro khung T+3 đến T+5.`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia phân tích định lượng chứng khoán Việt Nam của nền tảng StockAI. Trả lời súc tích, khách quan, chính xác.',
            },
            { role: 'user', content: samplePrompt },
          ],
          max_tokens: 180,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.error?.message || res.statusText;
        const status = res.status;

        // Ghi nhận log lỗi
        this.recordUsageLog({
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          latencyMs,
          status: 'ERROR',
          errorMessage: errMsg,
          caller: 'ADMIN_TEST',
          queryPreview: samplePrompt,
        });

        if (status === 404 || errMsg.toLowerCase().includes('model')) {
          return {
            success: false,
            latencyMs,
            message: `Mô hình "${model}" không tồn tại hoặc tài khoản OpenAI của bạn chưa được cấp quyền truy cập mô hình này.`,
            errorType: 'MODEL_NOT_FOUND',
          };
        }

        if (status === 429) {
          return {
            success: false,
            latencyMs,
            message: `Hết hạn mức hoặc quá giới hạn tốc độ (429): ${errMsg}`,
            errorType: 'QUOTA_EXCEEDED',
          };
        }

        return {
          success: false,
          latencyMs,
          message: `Lỗi suy luận OpenAI (${status}): ${errMsg}`,
          errorType: 'UNKNOWN',
        };
      }

      const responseContent = data?.choices?.[0]?.message?.content || '';
      const usage = data?.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;

      const estimatedCostUsd = this.calculateCost(model, promptTokens, completionTokens);

      // Ghi nhận log thành công
      this.recordUsageLog({
        model: data.model || model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        latencyMs,
        status: 'SUCCESS',
        caller: 'ADMIN_TEST',
        queryPreview: samplePrompt,
      });

      return {
        success: true,
        latencyMs,
        responsePreview: responseContent,
        modelUsed: data.model || model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        message: 'Thử phân tích thành công!',
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      this.recordUsageLog({
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        latencyMs,
        status: 'ERROR',
        errorMessage: err.message || String(err),
        caller: 'ADMIN_TEST',
        queryPreview: samplePrompt,
      });

      if (err.name === 'AbortError') {
        return {
          success: false,
          latencyMs,
          message: `Yêu cầu bị ngắt do quá thời gian chờ (${timeoutMs}ms).`,
          errorType: 'TIMEOUT',
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối khi thử phân tích: ${err.message || String(err)}`,
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Tính toán chi phí ước tính chính xác theo bảng giá OpenAI
   */
  static calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
    const verified = VERIFIED_OPENAI_MODELS.find(
      (m) => m.modelId.toLowerCase() === modelId.toLowerCase() || modelId.toLowerCase().includes(m.modelId.toLowerCase())
    );

    const inputRate = verified ? verified.inputCostPer1M : 1.0;
    const outputRate = verified ? verified.outputCostPer1M : 3.0;

    const inputCost = (promptTokens / 1_000_000) * inputRate;
    const outputCost = (completionTokens / 1_000_000) * outputRate;

    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Lấy danh sách mô hình trực tiếp từ OpenAI bằng API Key đã cấu hình
   */
  static async fetchOpenAiModels(): Promise<{ success: boolean; models: string[]; message?: string }> {
    const { apiKey } = this.getInternalConfig();
    if (!apiKey) {
      return { success: false, models: [], message: 'Chưa cấu hình API Key' };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        return { success: false, models: [], message: `OpenAI trả về mã lỗi ${res.status}` };
      }
      const data = await res.json();
      if (!Array.isArray(data.data)) {
        return { success: false, models: [], message: 'Định dạng dữ liệu không hợp lệ' };
      }

      // Lọc các model thích hợp cho chat / completion
      const chatModels = data.data
        .map((m: any) => m.id as string)
        .filter((id: string) => (id.startsWith('gpt-') || id.startsWith('o1-') || id.startsWith('chatgpt-')) && !id.includes('realtime') && !id.includes('audio'))
        .sort((a: string, b: string) => a.localeCompare(b));

      return { success: true, models: chatModels };
    } catch (e: any) {
      return { success: false, models: [], message: e.message || 'Lỗi kết nối OpenAI' };
    }
  }

  /**
   * Ghi log sử dụng AI vào DB
   */
  static recordUsageLog(entry: Omit<AiUsageLog, 'id' | 'timestamp'>): void {
    try {
      const db = getDatabase();
      if (!db.ai_usage_logs) db.ai_usage_logs = [];

      const logItem: AiUsageLog = {
        id: `ai_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      };

      db.ai_usage_logs.unshift(logItem);

      // Giới hạn tối đa 500 logs gần nhất để bảo toàn kích thước file DB
      if (db.ai_usage_logs.length > 500) {
        db.ai_usage_logs = db.ai_usage_logs.slice(0, 500);
      }

      saveDatabase(db);
    } catch (err) {
      console.error('[AiConfigService] Lỗi ghi nhận usage log:', err);
    }
  }

  /**
   * Thống kê số liệu sử dụng, phân biệt số đo trực tiếp và chi phí ước tính
   */
  static getUsageStats(dateRange: 'today' | '7days' | '30days' | 'all' = 'all', modelFilter?: string): {
    stats: AiUsageStats;
    logs: AiUsageLog[];
  } {
    const db = getDatabase();
    const allLogs = db.ai_usage_logs || [];

    const now = Date.now();
    let minTime = 0;
    if (dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      minTime = startOfDay.getTime();
    } else if (dateRange === '7days') {
      minTime = now - 7 * 24 * 3600 * 1000;
    } else if (dateRange === '30days') {
      minTime = now - 30 * 24 * 3600 * 1000;
    }

    const filtered = allLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      if (minTime > 0 && logTime < minTime) return false;
      if (modelFilter && modelFilter !== 'ALL' && log.model !== modelFilter) return false;
      return true;
    });

    let totalCalls = 0;
    let totalErrors = 0;
    let totalLatency = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let estimatedCostUsd = 0;

    for (const log of filtered) {
      totalCalls++;
      if (log.status === 'ERROR') totalErrors++;
      totalLatency += log.latencyMs || 0;
      totalPromptTokens += log.promptTokens || 0;
      totalCompletionTokens += log.completionTokens || 0;
      totalTokens += log.totalTokens || 0;
      estimatedCostUsd += log.estimatedCostUsd || 0;
    }

    const avgLatencyMs = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;
    const estimatedCostVnd = Math.round(estimatedCostUsd * USD_TO_VND_RATE);

    return {
      stats: {
        totalCalls,
        totalErrors,
        avgLatencyMs,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
        estimatedCostVnd,
      },
      logs: filtered.slice(0, 50),
    };
  }

  /**
   * Xóa toàn bộ lịch sử logs sử dụng AI (Ghi audit log)
   */
  static clearLogs(adminUsername: string): { success: boolean; message: string } {
    const db = getDatabase();
    const count = (db.ai_usage_logs || []).length;
    db.ai_usage_logs = [];

    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.unshift({
      id: `audit_ai_clear_${Date.now()}`,
      action: 'CLEAR_AI_LOGS',
      targetUserId: 'SYSTEM_AI_LOGS',
      targetUserEmail: 'admin@stockai.local',
      performedBy: {
        id: adminUsername,
        email: adminUsername,
        role: 'ADMIN',
      },
      timestamp: new Date().toISOString(),
      details: {
        note: `Quản trị viên đã xóa ${count} bản ghi nhật ký sử dụng AI.`,
      },
    });

    saveDatabase(db);
    return { success: true, message: `Đã dọn dẹp ${count} nhật ký sử dụng AI.` };
  }
}
