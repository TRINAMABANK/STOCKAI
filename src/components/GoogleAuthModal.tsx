'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Copy, 
  Check, 
  Lock,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '@/types';
import Logo from './Logo';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  clientId: string;
  callbackUrl: string;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  currentUser,
  clientId,
  callbackUrl,
  onLoginSuccess,
  onLogout,
}: GoogleAuthModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Khởi tạo Google Identity Services Button khi modal mở
  useEffect(() => {
    if (!isOpen || !clientId) return;

    const renderGoogleButton = () => {
      const win = window as any;
      if (win.google?.accounts?.id) {
        win.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setIsLoading(true);
            setAuthError(null);
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });
              const data = await res.json();
              if (data.success && data.data?.user) {
                onLoginSuccess(data.data.user);
                onClose();
              } else {
                setAuthError(data.message || 'Xác thực Google thất bại');
              }
            } catch (err: any) {
              setAuthError(err.message || 'Lỗi kết nối khi xác thực token Google');
            } finally {
              setIsLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnElement = document.getElementById('google-signin-btn-container');
        if (btnElement) {
          btnElement.innerHTML = '';
          win.google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      }
    };

    renderGoogleButton();
    const interval = setInterval(() => {
      const win = window as any;
      if (win.google?.accounts?.id) {
        renderGoogleButton();
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, clientId, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const redirectUri = `${currentOrigin}/api/auth/callback/google`;
  const redirectAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="default" />
            <div>
              <h3 className="font-bold text-[#172033] text-base">Đăng nhập Google Gmail</h3>
              <p className="text-xs text-[#64748B]">Xác thực tài khoản và kích hoạt phiên giao dịch an toàn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#172033]">
          {/* Error Banner */}
          {authError && (
            <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-[#BE123C] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Lỗi đăng nhập Google:</p>
                <p className="text-[11px] mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          {/* User Account Info Section (if logged in) */}
          {currentUser && (
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full border border-[#86EFAC] object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold flex items-center justify-center text-xs tracking-tight border border-[#86EFAC]">
                    {(() => {
                      if (!currentUser.name) return 'TR';
                      const clean = currentUser.name.replace(/\s*\(Admin\)/i, '').trim();
                      const words = clean.split(/\s+/);
                      const lastName = words[words.length - 1];
                      return lastName.length <= 4 ? lastName.toUpperCase() : (words[0][0] + lastName[0]).toUpperCase();
                    })()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#166534] text-sm">{currentUser.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#E0F2FE] text-[#008FD3]'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#854D0E]">
                      {currentUser.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#15803D] mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2] text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Action 1: Google One-Tap & Popup Button */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Cách 1: Đăng nhập nhanh bằng Google (Khuyên dùng)</span>
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Xác thực trực tiếp bằng Google Identity Services Popup & One-Tap
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2 min-h-[46px]">
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-[#008FD3] font-semibold">
                  <div className="w-4 h-4 border-2 border-[#008FD3] border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xác minh token với máy chủ Google...</span>
                </div>
              ) : (
                <div id="google-signin-btn-container" className="flex justify-center w-full"></div>
              )}
            </div>
          </div>

          {/* Action 2: OAuth 2.0 Authorization Code Redirect Flow */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div>
              <p className="font-bold text-sm text-[#172033]">Cách 2: Luồng Redirect chuẩn (OAuth 2.0 Code Flow)</p>
              <p className="text-[11px] text-[#64748B]">
                Chuyển hướng toàn trang qua Google Accounts và trả về URL Callback
              </p>
            </div>

            <a
              href={redirectAuthUrl}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#008FD3] text-white hover:bg-[#007CB8] font-semibold text-xs transition shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Chuyển hướng đăng nhập qua Google OAuth</span>
            </a>
          </div>

          {/* Google Cloud Console Setup Verification Box */}
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#1E40AF] text-xs">Cấu hình Google Cloud Console cần thiết:</p>
                <p className="text-[11px] text-[#1D4ED8] mt-0.5">
                  Vui lòng thêm chính xác 2 thông số sau vào OAuth Client ID trên Google Cloud để tránh lỗi <code>origin_mismatch</code> hoặc <code>redirect_uri_mismatch</code>:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Authorized JavaScript Origins */}
              <div className="bg-white p-2.5 rounded-lg border border-[#DBEAFE]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1E3A8A] text-[11px]">
                    1. Authorized JavaScript origins (Nguồn gốc JavaScript):
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentOrigin, 'origin')}
                    className="flex items-center gap-1 text-[10px] text-[#008FD3] hover:underline font-semibold"
                  >
                    {copiedField === 'origin' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'origin' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <code className="text-[12px] font-mono text-[#008FD3] font-semibold block select-all">
                  {currentOrigin}
                </code>
              </div>

              {/* Authorized Redirect URIs */}
              <div className="bg-white p-2.5 rounded-lg border border-[#DBEAFE]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1E3A8A] text-[11px]">
                    2. Authorized redirect URIs (URI chuyển hướng được ủy quyền):
                  </span>
                  <button
                    onClick={() => copyToClipboard(redirectUri, 'redirect')}
                    className="flex items-center gap-1 text-[10px] text-[#008FD3] hover:underline font-semibold"
                  >
                    {copiedField === 'redirect' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'redirect' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <code className="text-[12px] font-mono text-[#008FD3] font-semibold block select-all break-all">
                  {redirectUri}
                </code>
              </div>

              {/* Client ID Status */}
              <div className="bg-white p-2.5 rounded-lg border border-[#DBEAFE]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1E3A8A] text-[11px]">Google Client ID (Đã cấu hình backend):</span>
                  <button
                    onClick={() => copyToClipboard(clientId, 'clientid')}
                    className="flex items-center gap-1 text-[10px] text-[#008FD3] hover:underline font-semibold"
                  >
                    {copiedField === 'clientid' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'clientid' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <code className="text-[11px] font-mono text-[#64748B] block truncate select-all">
                  {clientId}
                </code>
              </div>
            </div>
          </div>

          {/* Security & Data Integrity Assurance */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B] space-y-1">
            <p className="font-semibold text-[#172033] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Chính sách phân quyền & bảo vệ dữ liệu:</span>
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Người dùng đăng nhập lần đầu tự động nhận gói <strong>FREE</strong> và quyền <strong>USER</strong> (không cấp ADMIN).</li>
              <li>Tài khoản cũ đăng nhập lại giữ nguyên gói thuê bao (FREE/PRO/ENTERPRISE) và hạn sử dụng.</li>
              <li>Toàn bộ danh mục đầu tư mô phỏng, lịch sử giao dịch và tài khoản VietQR OCB được bảo toàn 100%.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F1F5F9] font-semibold text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
