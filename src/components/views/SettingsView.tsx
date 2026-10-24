'use client';

import React, { useState } from 'react';
import { Settings, Download, Upload, ShieldCheck, Database, RefreshCw, CheckCircle } from 'lucide-react';
import Logo from '@/components/Logo';

interface SettingsViewProps {
  onRefreshAll: () => void;
}

export default function SettingsView({ onRefreshAll }: SettingsViewProps) {
  const [feeRate, setFeeRate] = useState('0.0015');
  const [taxRate, setTaxRate] = useState('0.0010');
  const [openAiModel, setOpenAiModel] = useState('gpt-4o');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [restoreText, setRestoreText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateSnapshot = async () => {
    setIsProcessing(true);
    setBackupMessage(null);

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_SNAPSHOT' }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage(`✅ ${data.message}`);
      } else {
        setBackupMessage(`❌ ${data.message}`);
      }
    } catch {
      setBackupMessage('❌ Lỗi kết nối hệ thống sao lưu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stockai_personal_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMessage('✅ Đã tải file sao lưu JSON về máy tính của bạn!');
    } catch {
      setBackupMessage('❌ Lỗi tải file sao lưu');
    }
  };

  const handleRestore = async () => {
    if (!restoreText.trim()) return;
    setIsProcessing(true);
    setBackupMessage(null);

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', backupData: restoreText }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage('✅ Khôi phục cơ sở dữ liệu thành công!');
        setRestoreText('');
        onRefreshAll();
      } else {
        setBackupMessage(`❌ ${data.message}`);
      }
    } catch {
      setBackupMessage('❌ Lỗi khôi phục sao lưu');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Logo size="md" variant="default" />
          <div>
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Cài đặt Hệ thống & Quản lý Sao lưu</h2>
            <p className="text-[13px] text-[#647293] mt-0.5">Tùy biến tham số giao dịch BMSC, cấu hình AI và an toàn dữ liệu cá nhân</p>
          </div>
        </div>
      </div>

      {/* Financial Parameters */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <h3 className="font-semibold text-[15px] text-[#172554] flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#087CFF]" />
          <span>Tham số Giao dịch & Thuế Phí</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[#647293] font-medium text-[12px] block mb-1.5">Phí giao dịch mặc định (BMSC)</label>
            <input
              type="text"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 font-mono text-[13px] font-medium text-[#172554]"
            />
            <p className="text-[11px] text-[#647293] mt-1">Mặc định: 0.0015 (tương đương 0.15%)</p>
          </div>

          <div>
            <label className="text-[#647293] font-medium text-[12px] block mb-1.5">Thuế TNCN bán chứng khoán</label>
            <input
              type="text"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 font-mono text-[13px] font-medium text-[#172554]"
            />
            <p className="text-[11px] text-[#647293] mt-1">Quy định luật: 0.0010 (tương đương 0.1%)</p>
          </div>

          <div>
            <label className="text-[#647293] font-medium text-[12px] block mb-1.5">Mô hình AI ưu tiên</label>
            <select
              value={openAiModel}
              onChange={(e) => setOpenAiModel(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] font-medium text-[#172554]"
            >
              <option value="gpt-4o">GPT-4o (Khuyên dùng - Phân tích sâu)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Phản hồi siêu tốc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup & Restore Panel */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <h3 className="font-semibold text-[15px] text-[#172554] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#087CFF]" />
          <span>Sao lưu & Khôi phục Cơ sở Dữ liệu (SQLite / JSON)</span>
        </h3>

        <p className="text-[13px] text-[#647293] leading-relaxed">
          Toàn bộ tài khoản, lịch sử lệnh, danh mục và cấu hình đều được lưu an toàn tại máy tính Windows của bạn trong thư mục <code>data/</code>. Bạn có thể tạo bản sao lưu định kỳ để không bao giờ bị mất dữ liệu.
        </p>

        {backupMessage && (
          <div className="p-3.5 rounded-xl bg-[#EBF3FF] border border-[#DCE5FF] text-[12px] font-medium text-[#087CFF]">
            {backupMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleCreateSnapshot}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-medium text-[13px] flex items-center gap-2 transition shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Tạo bản Snapshot lưu trên đĩa</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#DCE5FF] hover:bg-[#F4F7FF] text-[#172554] font-medium text-[13px] flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-[#087CFF]" />
            <span>Tải file sao lưu JSON về máy</span>
          </button>
        </div>

        {/* Restore area */}
        <div className="pt-4 border-t border-[#DCE5FF] space-y-2">
          <label className="text-[13px] font-semibold text-[#172554] block">Khôi phục từ nội dung file sao lưu JSON:</label>
          <textarea
            rows={4}
            value={restoreText}
            onChange={(e) => setRestoreText(e.target.value)}
            placeholder="Dán toàn bộ nội dung file sao lưu JSON vào đây để khôi phục..."
            className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-3 text-[13px] font-mono text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
          />
          <button
            onClick={handleRestore}
            disabled={isProcessing || !restoreText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#e11d48] disabled:opacity-50 text-white font-medium text-[13px] flex items-center gap-1.5 transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Khôi phục dữ liệu ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
