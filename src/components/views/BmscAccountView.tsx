'use client';

import React, { useState } from 'react';
import { Wallet, Upload, AlertCircle, FileText, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { PortfolioSummary, PortfolioItem } from '@/types';

interface BmscAccountViewProps {
  summary: PortfolioSummary;
  holdings: PortfolioItem[];
  onRefresh: () => void;
}

export default function BmscAccountView({
  summary,
  holdings,
  onRefresh,
}: BmscAccountViewProps) {
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const sampleCsv = `Ngày,Mã CP,Loại lệnh,Khối lượng,Giá,Phí,Ghi chú
2025-03-25,HPG,MUA,2000,27500,41250,Khớp lệnh phiên chiều
2025-03-24,TCB,MUA,1500,32800,73800,Khớp lệnh phiên sáng
2025-03-20,VNM,MUA,1000,67000,100500,Tích lũy dài hạn`;

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setImportStatus(null);

    try {
      const res = await fetch('/api/bmsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'IMPORT_STATEMENT', csvContent: csvText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportStatus(`✅ ${data.message}`);
        setCsvText('');
        onRefresh();
      } else {
        setImportStatus(`❌ Lỗi: ${data.message}`);
      }
    } catch {
      setImportStatus('❌ Lỗi kết nối máy chủ');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Tài khoản chứng khoán Bảo Minh (BMSC)</h2>
          <p className="text-[13px] text-[#647293] mt-1">Quản lý số dư, danh mục và đồng bộ sao kê tài khoản cá nhân</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] px-3 py-1 rounded-full bg-[#FEE2E2] text-[#EF4444] border border-[#FEE2E2] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            Chưa có Open API tự động
          </span>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs">
          <p className="text-[13px] text-[#647293] font-medium">Số tài khoản BMSC</p>
          <h4 className="text-[24px] font-bold text-[#172554] mt-1 font-mono tracking-tight tabular-nums">021C123456-1</h4>
          <p className="text-[12px] text-[#647293] mt-1">Chủ tài khoản: <span className="font-semibold text-[#172554]">QUANG NHỰT TRÍ</span></p>
          <div className="mt-3 pt-3 border-t border-[#DCE5FF] text-[12px] text-[#647293] flex items-center justify-between">
            <span>Chi nhánh: TP. Hồ Chí Minh</span>
            <span className="text-[#087CFF] font-semibold">Tài khoản thường (Đuôi 1)</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs">
          <p className="text-[13px] text-[#647293] font-medium">Số dư tiền mặt khả dụng</p>
          <h4 className="text-[24px] font-bold text-[#16A34A] mt-1 font-mono tracking-tight tabular-nums">{summary.cash.toLocaleString('vi-VN')} đ</h4>
          <p className="text-[12px] text-[#647293] mt-1">Sức mua dự kiến: <span className="font-semibold text-[#172554] font-mono tabular-nums">{(summary.cash * 2).toLocaleString('vi-VN')} đ</span></p>
          <div className="mt-3 pt-3 border-t border-[#DCE5FF] text-[12px] text-[#647293] flex items-center justify-between">
            <span>Tiền chờ về (T+2): 0 đ</span>
            <span>Cổ tức chờ về: 0 đ</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs">
          <p className="text-[13px] text-[#647293] font-medium">Tổng giá trị tài sản</p>
          <h4 className="text-[24px] font-bold text-[#172554] mt-1 font-mono tracking-tight tabular-nums">{summary.totalAssets.toLocaleString('vi-VN')} đ</h4>
          <p className="text-[12px] text-[#647293] mt-1">Giá trị cổ phiếu: <span className="font-semibold text-[#172554] font-mono tabular-nums">{summary.stockValue.toLocaleString('vi-VN')} đ</span></p>
          <div className="mt-3 pt-3 border-t border-[#DCE5FF] text-[12px] text-[#647293] flex items-center justify-between">
            <span>Số mã nắm giữ: {holdings.length} mã</span>
            <span className="text-[#16A34A] font-semibold tabular-nums">Lãi: +{summary.unrealizedPnL.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      {/* Security & API Status Notice */}
      <div className="p-4.5 rounded-2xl bg-[#EBF3FF] border border-[#DCE5FF] text-[13px] text-[#0066D6] leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#087CFF] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#0C4A6E]">Chính sách bảo mật tài khoản BMSC:</p>
          <p className="mt-0.5 text-[#0066D6]">
            StockAI Personal tuyệt đối không yêu cầu mật khẩu giao dịch hoặc mã PIN BMSC của bạn. Khi BMSC chưa công bố Open API cho nhà đầu tư cá nhân, hệ thống hỗ trợ bạn nhập khẩu sao kê giao dịch định kỳ để quản lý danh mục an toàn.
          </p>
        </div>
      </div>

      {/* Statement Importer Form */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#087CFF]" />
            <h3 className="font-semibold text-[15px] text-[#172554]">Nhập sao kê giao dịch BMSC (CSV / Excel Text)</h3>
          </div>
          <button 
            onClick={() => setCsvText(sampleCsv)}
            className="text-[12px] text-[#087CFF] hover:text-[#0066D6] font-semibold underline"
          >
            Chèn dữ liệu mẫu
          </button>
        </div>

        <p className="text-[13px] text-[#647293]">
          Dán nội dung bảng sao kê tải từ BMSC Web Portal vào đây (định dạng các cột: Ngày, Mã CP, Loại lệnh, Khối lượng, Giá, Phí, Ghi chú):
        </p>

        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={sampleCsv}
          className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-3 text-[13px] font-mono text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#087CFF]/20 focus:border-[#087CFF]"
        />

        <div className="flex items-center justify-between">
          {importStatus && <p className="text-[12px] font-semibold text-[#087CFF]">{importStatus}</p>}
          <button
            onClick={handleImport}
            disabled={isImporting || !csvText.trim()}
            className="ml-auto px-5 py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-medium text-[13px] transition flex items-center gap-2 shadow-xs"
          >
            {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isImporting ? 'Đang nhập...' : 'Nhập vào hệ thống'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
