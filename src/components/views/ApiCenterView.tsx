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
        return <span className="px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> ĐÃ KẾT NỐI</span>;
      case 'NOT_SUPPORTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span> CHƯA HỖ TRỢ OPEN API</span>;
      case 'NOT_CONFIGURED':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#008FD3]"></span> CHƯA CẤU HÌNH KEY</span>;
      case 'ERROR':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#F43F5E] text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]"></span> LỖI KẾT NỐI</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B] text-xs font-bold">CHƯA KẾT NỐI</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">Trung tâm Quản trị Kết nối API (API Center)</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Kiểm tra kết nối thực tế, đo độ trễ và giám sát nhật ký các nhà cung cấp dữ liệu</p>
        </div>
      </div>

      {/* 4 Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const isTesting = testingProvider === p.code;
          return (
            <div key={p.id} className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[#172033]">{p.name}</h3>
                  {getStatusBadge(p.status)}
                </div>
                <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">{p.description}</p>
              </div>

              <div className="bg-[#F5F8FC] p-3 rounded-xl border border-[#E2E8F0] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Độ trễ phản hồi (Latency):</span>
                  <span className="font-semibold text-[#172033] font-mono tabular-nums">
                    {p.responseTimeMs ? `${p.responseTimeMs} ms` : 'Không áp dụng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Thời điểm kiểm tra:</span>
                  <span className="font-semibold text-[#172033] font-mono tabular-nums">{p.lastSyncTime || 'Vừa xong'}</span>
                </div>
                {p.lastError && (
                  <p className="text-[11px] text-[#D97706] font-medium pt-1 border-t border-[#E2E8F0]">
                    Ghi chú: {p.lastError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#64748B]">
                  {p.code === 'BMSC' ? 'Phương thức: File CSV/Excel' : 'Phương thức: REST API'}
                </span>
                <button
                  onClick={() => handleTest(p.code)}
                  disabled={isTesting}
                  className="px-4 py-1.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-white' : ''}`} />
                  <span>{isTesting ? 'Đang ping...' : 'Kiểm tra kết nối'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Logs Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#64748B]" />
            <h3 className="font-semibold text-[15px] text-[#172033]">Nhật ký kiểm tra & Yêu cầu kết nối (API Sync Logs)</h3>
          </div>
          <span className="text-[12px] text-[#64748B]">Lưu tối đa 50 bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-medium text-left">Thời gian</th>
                <th className="py-3 px-4 font-medium text-left">Nhà cung cấp</th>
                <th className="py-3 px-4 font-medium text-right">Độ trễ</th>
                <th className="py-3 px-4 font-medium text-center">Trạng thái</th>
                <th className="py-3 px-4 font-medium text-left">Thông điệp chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition h-[40px]">
                  <td className="py-2.5 px-4 text-[#64748B] font-mono tabular-nums text-xs">{log.timestamp}</td>
                  <td className="py-2.5 px-4 font-semibold text-[#008FD3]">{log.provider}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#172033]">{log.latency ? `${log.latency} ms` : '-'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#E0F2FE] text-[#008FD3]'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#172033] text-[13px]">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
