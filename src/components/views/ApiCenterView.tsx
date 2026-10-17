'use client';

import React, { useState } from 'react';
import { Radio, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, Clock, FileText } from 'lucide-react';
import { ApiProvider } from '@/types';

interface ApiCenterViewProps {
  providers: ApiProvider[];
  onTestApi: (providerCode: string) => void;
  testingProvider?: string | null;
}

export default function ApiCenterView({
  providers,
  onTestApi,
  testingProvider,
}: ApiCenterViewProps) {
  const [logs, setLogs] = useState<Array<{ timestamp: string; provider: string; status: string; message: string; latency?: number }>>([
    { timestamp: '14:35:22', provider: 'VIETSTOCK', status: 'SUCCESS', message: 'Kết nối thành công tới Vietstock. Đồng bộ dữ liệu giá khớp lệnh', latency: 42 },
    { timestamp: '14:35:22', provider: 'FIINTRADE', status: 'SUCCESS', message: 'Kết nối thành công tới FiinTrade. Dữ liệu tài chính hợp lệ', latency: 58 },
    { timestamp: '14:35:20', provider: 'BMSC', status: 'INFO', message: 'BMSC chưa có Open API công khai — Sẵn sàng nhập sao kê CSV/Excel', latency: 0 },
  ]);

  const handleTest = async (code: string) => {
    onTestApi(code);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ĐÃ KẾT NỐI</span>;
      case 'NOT_SUPPORTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> CHƯA HỖ TRỢ OPEN API</span>;
      case 'NOT_CONFIGURED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> CHƯA CẤU HÌNH KEY</span>;
      case 'ERROR':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> LỖI KẾT NỐI</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">CHƯA KẾT NỐI</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trung tâm Quản trị Kết nối API (API Center)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kiểm tra kết nối thực tế, đo độ trễ và giám sát nhật ký các nhà cung cấp dữ liệu</p>
        </div>
      </div>

      {/* 4 Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const isTesting = testingProvider === p.code;
          return (
            <div key={p.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                  {getStatusBadge(p.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Độ trễ phản hồi (Latency):</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {p.responseTimeMs ? `${p.responseTimeMs} ms` : 'Không áp dụng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời điểm kiểm tra:</span>
                  <span className="font-medium text-slate-700">{p.lastSyncTime || 'Vừa xong'}</span>
                </div>
                {p.lastError && (
                  <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-slate-200">
                    Ghi chú: {p.lastError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {p.code === 'BMSC' ? 'Phương thức: File CSV/Excel' : 'Phương thức: REST API'}
                </span>
                <button
                  onClick={() => handleTest(p.code)}
                  disabled={isTesting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isTesting ? 'Đang ping...' : 'Kiểm tra kết nối'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-sm text-slate-800">Nhật ký kiểm tra & Yêu cầu kết nối (API Sync Logs)</h3>
          </div>
          <span className="text-xs text-slate-400">Lưu tối đa 50 bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Thời gian</th>
                <th className="py-3 px-4 font-semibold">Nhà cung cấp</th>
                <th className="py-3 px-4 font-semibold">Độ trễ</th>
                <th className="py-3 px-4 font-semibold">Trạng thái</th>
                <th className="py-3 px-4 font-semibold">Thông điệp chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.provider}</td>
                  <td className="py-3 px-4 font-mono">{log.latency ? `${log.latency} ms` : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
