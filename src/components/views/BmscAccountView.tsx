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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tài khoản chứng khoán Bảo Minh (BMSC)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý số dư, danh mục và đồng bộ sao kê tài khoản cá nhân</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Chưa có Open API tự động
          </span>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Số tài khoản BMSC</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1">021C123456-1</h4>
          <p className="text-xs text-slate-600 mt-1">Chủ tài khoản: <span className="font-semibold text-slate-800">LÊ TRÍ ANH</span></p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Chi nhánh: TP. Hồ Chí Minh</span>
            <span className="text-emerald-600 font-semibold">Tài khoản đuôi 1 (Thường)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Số dư tiền mặt khả dụng</p>
          <h4 className="text-xl font-bold text-emerald-600 mt-1">{summary.cash.toLocaleString('vi-VN')} đ</h4>
          <p className="text-xs text-slate-600 mt-1">Sức mua dự kiến: <span className="font-semibold text-slate-800">{(summary.cash * 2).toLocaleString('vi-VN')} đ</span></p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Tiền chờ về (T+2): 0 đ</span>
            <span>Cổ tức chờ về: 0 đ</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Tổng giá trị danh mục</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1">{summary.totalAssets.toLocaleString('vi-VN')} đ</h4>
          <p className="text-xs text-slate-600 mt-1">Cổ phiếu: <span className="font-semibold text-slate-800">{summary.stockValue.toLocaleString('vi-VN')} đ</span></p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Số mã đang giữ: {holdings.length} mã</span>
            <span className="text-emerald-600 font-semibold">Lãi/Lỗ: +{summary.unrealizedPnL.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      {/* Security & API Status Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Chính sách bảo mật tài khoản BMSC:</p>
          <p className="mt-0.5 text-blue-800">
            StockAI Personal tuân thủ nghiêm ngặt bảo mật tài chính cá nhân: <strong>Tuyệt đối không yêu cầu mật khẩu đăng nhập hay mã PIN đặt lệnh BMSC</strong>. Khi BMSC chưa công bố Open API cho nhà đầu tư cá nhân, hệ thống hỗ trợ bạn nhập khẩu sao kê giao dịch định kỳ để đối soát tự động.
          </p>
        </div>
      </div>

      {/* Statement Importer Form */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Nhập sao kê giao dịch BMSC (CSV / Excel Text)</h3>
          </div>
          <button 
            onClick={() => setCsvText(sampleCsv)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Chèn dữ liệu mẫu
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Dán nội dung bảng sao kê tải từ BMSC Web Portal vào đây (định dạng các cột phân tách bởi dấu phẩy: Ngày, Mã CP, Loại lệnh, Khối lượng, Giá, Phí, Ghi chú):
        </p>

        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={sampleCsv}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />

        <div className="flex items-center justify-between">
          {importStatus && <p className="text-xs font-medium">{importStatus}</p>}
          <button
            onClick={handleImport}
            disabled={isImporting || !csvText.trim()}
            className="ml-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-2"
          >
            {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isImporting ? 'Đang nhập...' : 'Nhập vào hệ thống'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
