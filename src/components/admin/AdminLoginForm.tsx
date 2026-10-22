'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (user: any, mustChangePassword: boolean) => void;
}

export default function AdminLoginForm({ onLoginSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState('triqn');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const json = await res.json();

      if (json.success) {
        onLoginSuccess(json.user, json.mustChangePassword ?? false);
      } else {
        setErrorMessage(json.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F8FC] flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#008FD3] text-white shadow-lg shadow-[#008FD3]/20 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            STOCKAI ADMIN
          </h1>
          <p className="text-xs text-[#64748B]">
            Hệ thống Quản trị & Điều hành Dữ liệu SaaS Chứng khoán
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xl space-y-5">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h2 className="text-base font-bold text-[#172033]">Đăng nhập Quản trị</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Xác thực quyền hạn để truy cập Bảng điều khiển Quản trị viên
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Tên đăng nhập hoặc Email Quản trị:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="triqn hoặc email quản trị"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#172033] focus:bg-white focus:border-[#008FD3] focus:outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#172033]">
                  Mật khẩu Quản trị viên:
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#008FD3] hover:underline flex items-center gap-1 font-medium"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#172033] focus:bg-white focus:border-[#008FD3] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-bold text-xs shadow-md shadow-[#008FD3]/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập vào Hệ thống Quản trị</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#008FD3] font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Trang chủ StockAI</span>
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-[#94A3B8] space-y-1">
          <p>🛡️ Cổng quản trị phân quyền đa tầng RBAC • Mật khẩu lưu trữ dạng Hash an toàn</p>
          <p>Mọi hành vi truy cập và thao tác đều được ghi nhật ký kiểm toán (Audit Logs).</p>
        </div>
      </div>
    </div>
  );
}
