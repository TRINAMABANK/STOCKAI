'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  FileText,
  AlertCircle,
  XCircle,
  Database,
  ExternalLink,
  Zap,
  Key,
  Info
} from 'lucide-react';
import { ApiProvider, ApiConnectionStatus, SsiConfig } from '@/types';

interface ApiCenterViewProps {
  providers?: ApiProvider[];
  onTestApi?: (providerCode: string) => void;
  testingProvider?: string | null;
}

export default function ApiCenterView({
  providers: initialProviders,
  onTestApi,
  testingProvider: externalTestingProvider,
}: ApiCenterViewProps) {
  const [ssiConfig, setSsiConfig] = useState<SsiConfig | null>(null);
  const [providers, setProviders] = useState<ApiProvider[]>(initialProviders || []);
  const [logs, setLogs] = useState<Array<{
    timestamp: string;
    provider: string;
    status: string;
    message: string;
    latency?: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalTestingProvider, setInternalTestingProvider] = useState<string | null>(null);

  const activeTesting = externalTestingProvider || internalTestingProvider;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/api-center');
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.ssi_config) setSsiConfig(json.data.ssi_config);
        if (json.data.providers) setProviders(json.data.providers);
        if (json.data.logs) setLogs(json.data.logs);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu API Center:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTest = async (code: string) => {
    if (onTestApi) {
      onTestApi(code);
      // Wait a moment and refresh logs
      setTimeout(loadData, 1200);
      return;
    }

    setInternalTestingProvider(code);
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_CONNECTION', providerCode: code }),
      });
      await res.json();
      await loadData();
    } catch (e) {
      console.error('Lỗi test API:', e);
    } finally {
      setInternalTestingProvider(null);
    }
  };

  const getStatusBadge = (status: ApiConnectionStatus | string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            KẾT NỐI THÀNH CÔNG
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#087CFF]"></span>
            ĐÃ CẤU HÌNH (CHƯA TEST)
          </span>
        );
      case 'TESTING':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            ĐANG KIỂM TRA
          </span>
        );
      case 'SYNCING':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
            ĐANG ĐỒNG BỘ
          </span>
        );
      case 'SYNC_ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            ĐỒNG BỘ LỖI
          </span>
        );
      case 'CONNECTION_FAILED':
      case 'ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444] text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-[#EF4444]" />
            KẾT NỐI THẤT BẠI
          </span>
        );
      case 'NOT_SUPPORTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center gap-1.5">
            <Info className="w-3 h-3 text-[#D97706]" />
            CHƯA HỖ TRỢ OPEN API
          </span>
        );
      case 'NOT_CONFIGURED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#F4F7FF] text-[#647293] text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-[#647293]" />
            CHƯA CẤU HÌNH
          </span>
        );
    }
  };

  const ssiStatus = ssiConfig?.status || 'NOT_CONFIGURED';
  const isTestingSsi = activeTesting === 'SSI';

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#087CFF]" />
            <h2 className="text-[22px] lg:text-[24px] font-bold text-[#172554] tracking-tight">
              Trung tâm Quản trị Kết nối API (API Center)
            </h2>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Giám sát trạng thái kết nối dữ liệu SSI FastConnect Data thật (HOSE, HNX, UPCoM), đo độ trễ và nhật ký đồng bộ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#DCE5FF] hover:bg-[#F8FAFC] text-xs font-semibold text-[#172554] flex items-center gap-1.5 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#647293] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <a
            href="/admin"
            className="px-3.5 py-2 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <span>Khu vực Quản trị Admin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* HERO CARD: SSI FASTCONNECT DATA */}
      <div className="bg-gradient-to-br from-[#0B192C] to-[#1E3E62] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#087CFF]/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#087CFF]/20 border border-[#087CFF]/40 text-[#087CFF] font-mono font-bold text-xs">
                NGUỒN DỮ LIỆU CHÍNH THỨC
              </span>
              {getStatusBadge(ssiStatus)}
            </div>

            <div>
              <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2.5">
                <Database className="w-6 h-6 text-[#087CFF]" />
                SSI FastConnect Data v2.0
              </h3>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                Động cơ kết nối trực tiếp hạ tầng SSI Securities cung cấp dữ liệu báo giá khớp lệnh thời gian thực, sổ lệnh, chỉ số VN-Index, HNX-Index, UPCoM-Index và lịch sử giá nến OHLC.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[11px] text-white/60 block">Consumer ID:</span>
                <span className="font-mono text-xs font-bold text-white truncate block">
                  {ssiConfig?.consumerId || 'Chưa thiết lập'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[11px] text-white/60 block">Độ trễ phản hồi:</span>
                <span className="font-mono text-xs font-bold text-[#16A34A]">
                  {ssiConfig?.responseTimeMs ? `${ssiConfig.responseTimeMs} ms` : 'Chưa đo'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[11px] text-white/60 block">Đồng bộ gần nhất:</span>
                <span className="font-mono text-xs font-bold text-white truncate block">
                  {ssiConfig?.lastSyncTime || 'Chưa đồng bộ'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[11px] text-white/60 block">Bản ghi đã lưu:</span>
                <span className="font-mono text-xs font-bold text-[#087CFF]">
                  {ssiConfig?.syncedRecordsCount ? `${ssiConfig.syncedRecordsCount.toLocaleString()} mã/chỉ số` : '0 bản ghi'}
                </span>
              </div>
            </div>

            {ssiConfig?.lastError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Thông báo lỗi ghi nhận:</strong> {ssiConfig.lastError}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 shrink-0 justify-center">
            <button
              onClick={() => handleTest('SSI')}
              disabled={isTestingSsi}
              className="py-3 px-6 rounded-2xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingSsi ? 'animate-spin' : ''}`} />
              <span>{isTestingSsi ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối SSI'}</span>
            </button>
            <p className="text-[11px] text-white/50 text-center">
              Chỉ hiển thị &quot;Đã kết nối&quot; khi test thực tế thành công
            </p>
          </div>
        </div>
      </div>

      {/* 3 Secondary Providers Grid */}
      <div>
        <h4 className="text-sm font-bold text-[#172554] mb-3 flex items-center gap-2">
          <span>Các nhà cung cấp dữ liệu phụ trợ</span>
          <span className="text-xs font-normal text-[#647293]">(Vietstock, FiinTrade, BMSC)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers
            .filter((p) => p.code !== 'SSI')
            .map((p) => {
              const isTesting = activeTesting === p.code;
              return (
                <div key={p.id} className="bg-white rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#172554]">{p.name}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="text-xs text-[#647293] mt-1 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="bg-[#F4F7FF] p-3 rounded-xl border border-[#DCE5FF] text-xs space-y-1.5 font-[Calibri]">
                    <div className="flex justify-between">
                      <span className="text-[#647293]">Độ trễ phản hồi:</span>
                      <span className="font-semibold text-[#172554] font-mono tabular-nums">
                        {p.responseTimeMs ? `${p.responseTimeMs} ms` : 'Không áp dụng'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#647293]">Kiểm tra gần nhất:</span>
                      <span className="font-semibold text-[#172554] font-mono tabular-nums">{p.lastSyncTime || 'Vừa xong'}</span>
                    </div>
                    {p.lastError && (
                      <p className="text-[11px] text-[#D97706] font-medium pt-1 border-t border-[#DCE5FF]">
                        Ghi chú: {p.lastError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#647293]">
                      {p.code === 'BMSC' ? 'Phương thức: Sao kê CSV/Excel' : 'Phương thức: REST API'}
                    </span>
                    <button
                      onClick={() => handleTest(p.code)}
                      disabled={isTesting}
                      className="px-3.5 py-1.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Đang ping...' : 'Kiểm tra'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-3xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#DCE5FF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#087CFF]" />
            <div>
              <h3 className="font-bold text-base text-[#172554]">Nhật ký đồng bộ & Kiểm tra kết nối (API Sync Logs)</h3>
              <p className="text-xs text-[#647293]">Ghi nhận toàn bộ thao tác ping test và đồng bộ dữ liệu vào hệ thống</p>
            </div>
          </div>
          <span className="text-xs text-[#647293]">Hiển thị {logs.length} bản ghi gần nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-[Calibri] text-[11pt]">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] text-xs font-semibold border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-semibold text-left">Thời gian</th>
                <th className="py-3 px-4 font-semibold text-left">Nhà cung cấp</th>
                <th className="py-3 px-4 font-semibold text-right">Độ trễ</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-left">Chi tiết kết nối / Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#647293]">
                    Chưa có nhật ký hoạt động nào được ghi nhận. Bấm &quot;Kiểm tra kết nối SSI&quot; để thực hiện bài test đầu tiên.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC] transition h-[40px]">
                    <td className="py-2.5 px-4 text-[#647293] font-mono tabular-nums text-xs">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#087CFF] text-xs">
                      {log.provider}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#172554] text-xs">
                      {log.latency ? `${log.latency} ms` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          log.status === 'SUCCESS' || log.status === 'CONNECTED'
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : log.status === 'ERROR' || log.status === 'FAILED'
                            ? 'bg-[#FEE2E2] text-[#EF4444]'
                            : 'bg-[#EBF3FF] text-[#087CFF]'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#172554] text-xs font-medium">
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
