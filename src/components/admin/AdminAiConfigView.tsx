'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  Cpu, 
  Zap, 
  Activity, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Database,
  Trash2,
  Info,
  Server
} from 'lucide-react';
import { AiUsageStats, AiUsageLog } from '@/types';
import { ModelPricing } from '@/lib/ai-config-service';

interface AdminAiConfigViewProps {
  onShowToast: (msg: string) => void;
}

export default function AdminAiConfigView({ onShowToast }: AdminAiConfigViewProps) {
  // Trạng thái nạp cấu hình
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isTestingSample, setIsTestingSample] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  // Dữ liệu cấu hình
  const [config, setConfig] = useState<{
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
  } | null>(null);

  // Form inputs
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [temperature, setTemperature] = useState(0.3);
  const [systemPromptExtra, setSystemPromptExtra] = useState('');

  // Bộ lọc thống kê
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [modelFilter, setModelFilter] = useState('ALL');

  // Thống kê & Logs
  const [stats, setStats] = useState<AiUsageStats>({
    totalCalls: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    estimatedCostVnd: 0,
  });
  const [logs, setLogs] = useState<AiUsageLog[]>([]);

  // Kết quả kiểm tra gần nhất
  const [testResult, setTestResult] = useState<{
    type: 'CONNECTION' | 'SAMPLE';
    success: boolean;
    latencyMs: number;
    message: string;
    details?: any;
  } | null>(null);

  // Danh sách model động lấy từ OpenAI
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [testSymbol, setTestSymbol] = useState('FPT');

  // Tải dữ liệu từ backend
  const loadAiConfig = async (range = dateRange, mFilter = modelFilter) => {
    setIsLoading(true);
    try {
      const url = `/api/admin/ai-config?dateRange=${range}${mFilter !== 'ALL' ? `&model=${encodeURIComponent(mFilter)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        const c = json.data.config;
        setConfig(c);
        setSelectedModel(c.model);
        setTimeoutMs(c.timeoutMs);
        setMaxTokens(c.maxTokens);
        setTemperature(c.temperature);
        setSystemPromptExtra(c.systemPromptExtra || '');

        if (json.data.stats) setStats(json.data.stats);
        if (json.data.logs) setLogs(json.data.logs);
      } else {
        onShowToast(`⚠️ ${json.message || 'Không thể tải cấu hình AI'}`);
      }
    } catch {
      onShowToast('❌ Lỗi kết nối khi tải cấu hình AI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAiConfig();
  }, []);

  // Xử lý lưu cấu hình
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        model: selectedModel,
        timeoutMs: Number(timeoutMs),
        maxTokens: Number(maxTokens),
        temperature: Number(temperature),
        systemPromptExtra,
      };

      if (newApiKey.trim()) {
        payload.apiKey = newApiKey.trim();
      }

      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast('✅ Cập nhật cấu hình AI & API thành công!');
        setNewApiKey('');
        loadAiConfig();
      } else {
        onShowToast(`❌ ${json.message || 'Lưu cấu hình thất bại'}`);
      }
    } catch {
      onShowToast('❌ Lỗi khi gửi dữ liệu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  // Kiểm tra kết nối thật
  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_CONNECTION' }),
      });
      const json = await res.json();

      if (json.success) {
        setTestResult({
          type: 'CONNECTION',
          success: true,
          latencyMs: json.data.latencyMs,
          message: json.data.message,
          details: json.data.details,
        });
        onShowToast(`🟢 ${json.data.message}`);
      } else {
        setTestResult({
          type: 'CONNECTION',
          success: false,
          latencyMs: json.data?.latencyMs || 0,
          message: json.data?.message || json.message || 'Kết nối OpenAI thất bại',
          details: json.data?.details,
        });
        onShowToast(`🔴 ${json.data?.message || 'Kiểm tra kết nối thất bại'}`);
      }
    } catch (e: any) {
      setTestResult({
        type: 'CONNECTION',
        success: false,
        latencyMs: 0,
        message: 'Lỗi mạng khi gọi kiểm tra OpenAI API',
      });
      onShowToast('❌ Lỗi mạng khi kiểm tra kết nối');
    } finally {
      setIsTestingConn(false);
    }
  };

  // Thử phân tích mẫu
  const handleTestSampleAnalysis = async () => {
    setIsTestingSample(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_SAMPLE', symbol: testSymbol }),
      });
      const json = await res.json();

      if (json.success) {
        setTestResult({
          type: 'SAMPLE',
          success: true,
          latencyMs: json.data.latencyMs,
          message: json.data.message,
          details: json.data,
        });
        onShowToast(`✨ Thử phân tích thành công (${json.data.latencyMs}ms)!`);
        // Nạp lại thống kê
        loadAiConfig();
      } else {
        setTestResult({
          type: 'SAMPLE',
          success: false,
          latencyMs: json.data?.latencyMs || 0,
          message: json.data?.message || json.message || 'Thử phân tích thất bại',
        });
        onShowToast(`🔴 ${json.data?.message || 'Thử phân tích thất bại'}`);
      }
    } catch {
      onShowToast('❌ Lỗi khi gửi yêu cầu thử nghiệm phân tích');
    } finally {
      setIsTestingSample(false);
    }
  };

  // Lấy danh sách mô hình từ OpenAI
  const handleFetchOpenAiModels = async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/admin/ai-config/models');
      const json = await res.json();
      if (json.success && Array.isArray(json.models) && json.models.length > 0) {
        setDynamicModels(json.models);
        onShowToast(`✅ Đã tải ${json.models.length} mô hình khả dụng từ tài khoản OpenAI!`);
      } else {
        onShowToast(`⚠️ ${json.message || 'Không thể lấy danh sách mô hình từ OpenAI'}`);
      }
    } catch {
      onShowToast('❌ Lỗi khi truy vấn danh sách mô hình');
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Xóa lịch sử logs
  const handleClearLogs = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử nhật ký gọi AI? Thao tác này sẽ ghi lại audit log.')) {
      return;
    }
    setIsClearingLogs(true);
    try {
      const res = await fetch('/api/admin/ai-config', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        onShowToast(`✅ ${json.message}`);
        loadAiConfig();
      } else {
        onShowToast(`❌ ${json.message}`);
      }
    } catch {
      onShowToast('❌ Lỗi xóa nhật ký');
    } finally {
      setIsClearingLogs(false);
    }
  };

  const selectedModelPricing = config?.verifiedModels?.find(
    (m) => m.modelId.toLowerCase() === selectedModel.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Giới thiệu khu vực */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5FF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#8B36FF] to-[#087CFF] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#172554] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#8B36FF]" />
              Trung tâm Cấu hình AI & API
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#647293] mt-1 pl-3.5">
            Quản lý tích hợp OpenAI GPT-4o, bảo mật khóa API bằng mã hóa AES-256-GCM, kiểm tra kết nối thật và kiểm soát chi phí token.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadAiConfig()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5FF] bg-white text-xs font-semibold text-[#172554] hover:bg-[#F4F7FF] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Banner Trạng thái kết nối & Nhà cung cấp */}
      <div className="stockai-card p-5 relative overflow-hidden">
        {/* Soft horizontal wash */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#8B36FF]/10 via-[#087CFF]/3 to-transparent pointer-events-none rounded-l-2xl" />
        <div className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full bg-gradient-to-r from-[#8B36FF] to-[#087CFF] opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#101B4B] to-[#172554] text-white flex items-center justify-center shrink-0 shadow-md">
              <Cpu className="w-6 h-6 text-[#13C9D5]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-[#172554]">Nhà cung cấp: OpenAI Platform</h3>
                {config?.isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã sẵn sàng hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA]">
                    <XCircle className="w-3.5 h-3.5" />
                    Chưa cấu hình API Key
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF]">
                  Mô hình: {config?.model || 'gpt-4o-mini'}
                </span>
              </div>

              <p className="text-xs text-[#647293]">
                {config?.isConfigured
                  ? `Khóa API đang kích hoạt: ${config.maskedApiKey}. Cập nhật lần cuối: ${new Date(config.updatedAt).toLocaleString('vi-VN')} bởi ${config.updatedBy}.`
                  : 'Chưa cấu hình API Key. StockAI đang chạy chế độ Dự phòng Định lượng Nội bộ (StockAI Quantitative Engine).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConn || !config?.isConfigured}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5FF] text-xs font-bold text-[#087CFF] hover:bg-[#EBF3FF] transition shadow-2xs disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-[#087CFF] ${isTestingConn ? 'animate-bounce' : ''}`} />
              <span>{isTestingConn ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            <button
              onClick={handleTestSampleAnalysis}
              disabled={isTestingSample || !config?.isConfigured}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8B36FF] to-[#087CFF] hover:opacity-95 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTestingSample ? 'animate-spin' : ''}`} />
              <span>{isTestingSample ? 'Đang phân tích...' : 'Thử phân tích mẫu'}</span>
            </button>
          </div>
        </div>

        {/* Kết quả Test gần nhất (nếu có) */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
            testResult.success
              ? 'bg-[#DCFCE7]/40 border-[#BBF7D0] text-[#166534]'
              : 'bg-[#FEE2E2]/50 border-[#FECACA] text-[#991B1B]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> : <XCircle className="w-4 h-4 text-[#EF4444]" />}
                <span>
                  {testResult.type === 'CONNECTION' ? 'Kết quả kiểm tra kết nối' : 'Kết quả phân tích thử nghiệm'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/60">
                  {testResult.latencyMs}ms
                </span>
              </div>
              <button onClick={() => setTestResult(null)} className="text-[11px] underline opacity-70 hover:opacity-100">
                Đóng
              </button>
            </div>

            <p className="font-medium">{testResult.message}</p>

            {testResult.details?.responsePreview && (
              <div className="p-3 bg-white rounded-lg border border-[#BBF7D0] text-[#172554] space-y-1">
                <span className="font-bold text-[11px] text-[#087CFF] block">Câu trả lời từ OpenAI ({testResult.details.modelUsed}):</span>
                <p className="italic text-xs leading-relaxed">"{testResult.details.responsePreview}"</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-[#647293] font-mono">
                  <span>Tokens: {testResult.details.totalTokens} (Prompt: {testResult.details.promptTokens}, Trả lời: {testResult.details.completionTokens})</span>
                  <span>Chi phí: ${testResult.details.estimatedCostUsd}</span>
                </div>
              </div>
            )}

            {testResult.details?.solution && (
              <p className="text-[11px] bg-white/80 p-2 rounded border border-[#FECACA] font-sans">
                💡 <strong>Cách xử lý:</strong> {testResult.details.solution}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Thống kê sử dụng AI & Ước tính chi phí (Section E) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-[#13C9D5] to-[#087CFF] opacity-80 shrink-0" />
            <h3 className="text-base font-bold text-[#172554] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#087CFF]" />
              Thống kê Số lượt gọi & Chi phí OpenAI
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Bộ lọc ngày */}
            <div className="flex items-center rounded-xl border border-[#DCE5FF] bg-white p-0.5">
              {(['today', '7days', '30days', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setDateRange(r);
                    loadAiConfig(r, modelFilter);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    dateRange === r
                      ? 'bg-gradient-to-r from-[#EBF3FF] to-white text-[#087CFF] shadow-2xs'
                      : 'text-[#647293] hover:text-[#172554]'
                  }`}
                >
                  {r === 'today' ? 'Hôm nay' : r === '7days' ? '7 ngày' : r === '30days' ? '30 ngày' : 'Tất cả'}
                </button>
              ))}
            </div>

            {/* Bộ lọc model */}
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                loadAiConfig(dateRange, e.target.value);
              }}
              className="px-2.5 py-1 rounded-xl border border-[#DCE5FF] bg-white text-xs font-semibold text-[#172554] focus:outline-hidden"
            >
              <option value="ALL">Tất cả mô hình</option>
              {config?.verifiedModels?.map((m) => (
                <option key={m.modelId} value={m.modelId}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="stockai-card p-4">
            <div className="flex items-center justify-between text-[#647293] text-xs">
              <span>Tổng lượt gọi</span>
              <Activity className="w-4 h-4 text-[#087CFF]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#172554] font-mono tabular-nums">
                {stats.totalCalls.toLocaleString('vi-VN')}
              </span>
              <span className="text-[10px] text-[#16A34A] font-bold">cuộc gọi</span>
            </div>
            <span className="text-[10px] text-[#647293] block mt-1">Đo lường trực tiếp</span>
          </div>

          <div className="stockai-card p-4">
            <div className="flex items-center justify-between text-[#647293] text-xs">
              <span>Tỷ lệ lỗi</span>
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono tabular-nums ${stats.totalErrors > 0 ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
                {stats.totalErrors}
              </span>
              <span className="text-[10px] text-[#647293]">
                ({stats.totalCalls > 0 ? ((stats.totalErrors / stats.totalCalls) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-[#647293] block mt-1">Gặp sự cố / Timeout</span>
          </div>

          <div className="stockai-card p-4">
            <div className="flex items-center justify-between text-[#647293] text-xs">
              <span>Độ trễ trung bình</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#172554] font-mono tabular-nums">
                {stats.avgLatencyMs}
              </span>
              <span className="text-[10px] text-[#647293] font-bold">ms</span>
            </div>
            <span className="text-[10px] text-[#647293] block mt-1">Thời gian phản hồi API</span>
          </div>

          <div className="stockai-card p-4">
            <div className="flex items-center justify-between text-[#647293] text-xs">
              <span>Tổng Tokens</span>
              <Cpu className="w-4 h-4 text-[#8B36FF]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#8B36FF] font-mono tabular-nums">
                {stats.totalTokens.toLocaleString('vi-VN')}
              </span>
            </div>
            <span className="text-[10px] text-[#647293] block mt-1">
              Prompt: {stats.totalPromptTokens.toLocaleString()} | Out: {stats.totalCompletionTokens.toLocaleString()}
            </span>
          </div>

          <div className="stockai-card p-4 col-span-2 lg:col-span-1 bg-gradient-to-br from-white to-[#F4F7FF]">
            <div className="flex items-center justify-between text-[#647293] text-xs">
              <span>Chi phí ước tính</span>
              <DollarSign className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#16A34A] font-mono tabular-nums">
                ${stats.estimatedCostUsd}
              </span>
            </div>
            <span className="text-[10px] text-[#647293] block mt-1 font-mono">
              ~ {stats.estimatedCostVnd.toLocaleString('vi-VN')} đ (Bảng giá OpenAI)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Form Cấu hình API Key & Tham số Vận hành */}
      <form onSubmit={handleSaveConfig} className="stockai-card p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-[#7C3CFF] to-[#087CFF] opacity-80 shrink-0" />
            <h3 className="font-bold text-base text-[#172554] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#087CFF]" />
              Thiết lập Khóa Bảo mật & Tham số Mô hình
            </h3>
          </div>
          <span className="text-[11px] text-[#647293] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            Mã hóa AES-256-GCM Phía Máy chủ
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột trái: Quản lý API Key an toàn */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1">
                OpenAI API Key (Khóa bí mật)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={config?.isConfigured ? `Giữ nguyên (${config.maskedApiKey}) hoặc nhập key mới` : 'sk-proj-...'}
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-[#DCE5FF] bg-white text-xs font-mono text-[#172554] focus:outline-hidden focus:border-[#087CFF] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-[#647293] hover:text-[#172554] flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showApiKey ? 'Ẩn' : 'Xem'}</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] text-[#647293] space-y-1">
                <p className="flex items-center gap-1">
                  🔒 <strong>Nguyên tắc an toàn:</strong> Khóa được mã hóa bằng khóa riêng biệt trước khi lưu vào DB. Không lưu dạng văn bản thuần và không bao giờ gửi về client.
                </p>
                <p>
                  Lấy khóa API tại:{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#087CFF] hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    OpenAI Platform API Keys <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            {/* Chọn mô hình AI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#172554]">
                  Mô hình AI sử dụng (OpenAI Model)
                </label>
                <button
                  type="button"
                  onClick={handleFetchOpenAiModels}
                  disabled={isFetchingModels || !config?.isConfigured}
                  className="text-[11px] text-[#087CFF] hover:underline font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ từ OpenAI</span>
                </button>
              </div>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5FF] bg-white text-xs font-semibold text-[#172554] focus:outline-hidden focus:border-[#087CFF] transition"
              >
                {config?.verifiedModels?.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.name} ({m.modelId}) {m.isRecommended ? '⭐ [Khuyên dùng]' : ''} — ${m.inputCostPer1M}/1M in, ${m.outputCostPer1M}/1M out
                  </option>
                ))}
                {dynamicModels
                  .filter((dm) => !config?.verifiedModels?.some((vm) => vm.modelId === dm))
                  .map((dm) => (
                    <option key={dm} value={dm}>
                      {dm} (Phát hiện từ tài khoản)
                    </option>
                  ))}
              </select>

              {selectedModelPricing && (
                <div className="mt-2 p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[11px] text-[#172554] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#087CFF]">{selectedModelPricing.name}</span>
                    <span className="font-mono text-[#647293]">{selectedModelPricing.contextWindow}</span>
                  </div>
                  <p className="text-[#647293]">{selectedModelPricing.description}</p>
                  <div className="text-[10px] font-mono text-[#16A34A] pt-1 border-t border-[#DCE5FF]">
                    Giá áp dụng: ${selectedModelPricing.inputCostPer1M}/1M prompt tokens | ${selectedModelPricing.outputCostPer1M}/1M completion tokens
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Tham số vận hành */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1">
                  Thời gian chờ tối đa (Timeout ms)
                </label>
                <input
                  type="number"
                  min={5000}
                  max={120000}
                  step={1000}
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5FF] bg-white text-xs font-mono text-[#172554] focus:outline-hidden focus:border-[#087CFF]"
                />
                <span className="text-[10px] text-[#647293] mt-1 block">Khuyên dùng: 20000 – 45000ms</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1">
                  Giới hạn Token (Max Tokens)
                </label>
                <input
                  type="number"
                  min={256}
                  max={8192}
                  step={128}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5FF] bg-white text-xs font-mono text-[#172554] focus:outline-hidden focus:border-[#087CFF]"
                />
                <span className="text-[10px] text-[#647293] mt-1 block">Khuyên dùng: 1000 – 2500 tokens</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#172554]">
                  Nhiệt độ sáng tạo (Temperature: {temperature})
                </label>
                <span className="text-[11px] font-mono text-[#647293]">
                  {temperature <= 0.3 ? '🎯 Toán học khách quan cao' : temperature <= 0.7 ? '⚖️ Cân bằng' : '🎨 Sáng tạo cao'}
                </span>
              </div>
              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#087CFF] cursor-pointer"
              />
              <span className="text-[10px] text-[#647293] block mt-1">
                Khuyên dùng 0.2 - 0.3 trong tài chính để đảm bảo AI diễn giải sát số liệu định lượng, không tự bịa đặt giá.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1">
                Chỉ dẫn bổ sung cho System Prompt (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={systemPromptExtra}
                onChange={(e) => setSystemPromptExtra(e.target.value)}
                placeholder="Ví dụ: Chú trọng thêm chỉ báo RSI phân kỳ và cảnh báo rủi ro biến động khối ngoại..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5FF] bg-white text-xs text-[#172554] focus:outline-hidden focus:border-[#087CFF]"
              />
            </div>
          </div>
        </div>

        {/* Nút lưu cấu hình */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DCE5FF]">
          <span className="text-xs text-[#647293]">
            Mọi thay đổi cấu hình sẽ được ghi lại trong <strong>Nhật ký kiểm toán (Audit Logs)</strong>.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3CFF] to-[#087CFF] text-white text-xs font-bold hover:opacity-95 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình AI'}</span>
          </button>
        </div>
      </form>

      {/* 5. Nhật ký Lịch sử Gọi AI & Lỗi gần nhất (Section A.7 & G) */}
      <div className="stockai-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444] opacity-80 shrink-0" />
            <h3 className="font-bold text-base text-[#172554] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F59E0B]" />
              Nhật ký Gọi AI & Sự cố Gần nhất
            </h3>
            <span className="text-xs text-[#647293]">({logs.length} bản ghi)</span>
          </div>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              disabled={isClearingLogs}
              className="text-xs text-[#EF4444] hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa nhật ký</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-[#647293] space-y-2">
            <Info className="w-8 h-8 text-[#087CFF] mx-auto opacity-40" />
            <p className="text-sm font-semibold">Chưa có nhật ký gọi AI nào</p>
            <p className="text-xs">Khi người dùng hoặc Admin gửi câu hỏi phân tích, các chỉ số token và độ trễ sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE5FF] text-[#647293] font-semibold bg-[#F4F7FF]/50">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Nguồn gọi</th>
                  <th className="py-2.5 px-3">Mô hình</th>
                  <th className="py-2.5 px-3 text-right">Độ trễ</th>
                  <th className="py-2.5 px-3 text-right">Tokens</th>
                  <th className="py-2.5 px-3 text-right">Chi phí ước tính</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3">Chi tiết / Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF] font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2.5 px-3 text-[#172554] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-[10px] text-[#647293]">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.caller === 'ADMIN_TEST' ? 'bg-[#EBF3FF] text-[#087CFF]' : 'bg-[#F3E8FF] text-[#8B36FF]'
                      }`}>
                        {log.caller === 'ADMIN_TEST' ? 'Admin Test' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#172554] font-semibold">
                      {log.model}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#172554]">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#647293]">
                      {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#16A34A]">
                      {log.estimatedCostUsd > 0 ? `$${log.estimatedCostUsd}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Thành công
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-bold text-[11px]">
                          <XCircle className="w-3 h-3" /> Lỗi
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[#647293] font-sans" title={log.errorMessage || log.queryPreview}>
                      {log.status === 'ERROR' ? (
                        <span className="text-[#EF4444] font-medium">{log.errorMessage || 'Lỗi không xác định'}</span>
                      ) : (
                        <span>{log.queryPreview || 'Yêu cầu phân tích'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
