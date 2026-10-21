'use client';

import React, { useState } from 'react';
import { Key, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function AdminChangePasswordModal({
  isOpen,
  isMandatory = false,
  onClose,
  onSuccess,
}: AdminChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (json.success) {
        onSuccess(json.message || 'Đổi mật khẩu Quản trị viên thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setErrorMsg(json.message || 'Lỗi khi cập nhật mật khẩu.');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isMandatory ? 'bg-amber-100 text-amber-700' : 'bg-[#008FD3]/10 text-[#008FD3]'
            }`}>
              {isMandatory ? <ShieldAlert className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                {isMandatory ? 'Đổi mật khẩu khởi tạo bắt buộc' : 'Đổi mật khẩu Quản trị viên'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isMandatory
                  ? 'Đây là lần đăng nhập đầu tiên, vui lòng cập nhật mật khẩu mới.'
                  : 'Cập nhật mật khẩu để tăng cường bảo mật hệ thống.'}
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#172033] p-1 rounded-lg text-lg font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Notice for Mandatory Change */}
        {isMandatory && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            ⚠️ <strong>Quy định bảo mật:</strong> Hệ thống yêu cầu đổi mật khẩu khởi tạo ngay trong lần đầu đăng nhập để ngăn chặn truy cập trái phép.
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#172033]">
                Mật khẩu hiện tại (khởi tạo):
              </label>
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-[11px] text-[#008FD3] hover:underline flex items-center gap-1"
              >
                {showCurrent ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showCurrent ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:bg-white focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#172033]">
                Mật khẩu mới (tối thiểu 8 ký tự):
              </label>
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-[11px] text-[#008FD3] hover:underline flex items-center gap-1"
              >
                {showNew ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showNew ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới an toàn"
              className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-[#172033] block mb-1">
              Xác nhận mật khẩu mới:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#F1F5F9]">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B] hover:bg-[#E2E8F0]"
              >
                Hủy bỏ
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isLoading ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
