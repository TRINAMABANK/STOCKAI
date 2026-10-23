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
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
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
  const [activeTab, setActiveTab] = useState<'password' | 'google'>('password');
  
  // Password login form
  const [username, setUsername] = useState('triqn');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Google button initialization
  useEffect(() => {
    if (!isOpen || activeTab !== 'google' || !clientId) return;

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
                setAuthSuccessMsg(`Chào mừng ${data.data.user.name}!`);
                onLoginSuccess(data.data.user);
                setTimeout(() => {
                  onClose();
                  window.location.reload();
                }, 600);
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
  }, [isOpen, activeTab, clientId, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const redirectUri = `${currentOrigin}/api/auth/callback/google`;
  const redirectAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  // Submit Password Login
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: username,
          password: password,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setAuthSuccessMsg(data.message || 'Đăng nhập thành công!');
        onLoginSuccess(data.user);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 600);
      } else {
        setAuthError(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi kết nối tới máy chủ đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentGuest = !currentUser || currentUser.name === 'Khách' || currentUser.id === 'guest_user';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="default" />
            <div>
              <h3 className="font-bold text-[#172033] text-base">Đăng nhập Hệ thống StockAI</h3>
              <p className="text-xs text-[#64748B]">Xác thực tài khoản và quản trị danh mục đầu tư</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Chỉ giữ Tài khoản & Mật khẩu và Google) */}
        <div className="flex items-center border-b border-[#E2E8F0] bg-white px-6">
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setAuthError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'password'
                ? 'border-[#008FD3] text-[#008FD3]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Tài khoản & Mật khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('google'); setAuthError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'google'
                ? 'border-[#008FD3] text-[#008FD3]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google Gmail</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#172033]">
          {/* Error Banner */}
          {authError && (
            <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-[#BE123C] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Đăng nhập thất bại:</p>
                <p className="text-[11px] mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {authSuccessMsg && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-[#16A34A] flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Thành công:</p>
                <p className="text-[11px] mt-0.5">{authSuccessMsg}</p>
              </div>
            </div>
          )}

          {/* User Account Info Section (if already logged in and not guest) */}
          {!isCurrentGuest && currentUser && (
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold flex items-center justify-center text-xs tracking-tight border border-[#86EFAC]">
                  {currentUser.role === 'ADMIN' ? 'TR' : 'US'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#166534] text-xs">{currentUser.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#E0F2FE] text-[#008FD3]'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FEF08A] text-[#854D0E]">
                      {currentUser.tier}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#15803D] mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2] text-[11px] font-semibold transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* TAB 1: PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <div className="space-y-4">
              {/* Quick 1-Click Admin Button */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#008FD3]" />
                    <span className="font-bold text-[#0369A1] text-xs">Tài khoản Quản trị viên</span>
                  </div>
                  <p className="text-[11px] text-[#0284C7] mt-0.5">
                    Tên đăng nhập: <strong>triqn</strong> &bull; Mật khẩu: <strong>Admin@2026</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('triqn');
                    setPassword('Admin@2026');
                    setTimeout(() => handlePasswordLogin(), 50);
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-[#008FD3] hover:bg-[#007CB8] text-white font-bold text-xs shadow-2xs transition whitespace-nowrap"
                >
                  ⚡ Đăng nhập 1-Click
                </button>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Tên đăng nhập / Email
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="triqn hoặc email"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#008FD3] focus:ring-1 focus:ring-[#008FD3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu tài khoản"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#008FD3] focus:ring-1 focus:ring-[#008FD3] pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#008FD3] hover:bg-[#007CB8] text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Xác thực & Đăng nhập</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: GOOGLE AUTH */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {/* Google One-Tap & Popup Button */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div>
                  <p className="font-bold text-xs text-[#172033] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Đăng nhập nhanh với Google Popup</span>
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Xác thực tức thời thông qua tài khoản Gmail cá nhân
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-2 min-h-[44px]">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-[#008FD3] font-semibold">
                      <div className="w-4 h-4 border-2 border-[#008FD3] border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang kết nối xác thực Google...</span>
                    </div>
                  ) : (
                    <div id="google-signin-btn-container" className="flex justify-center w-full"></div>
                  )}
                </div>
              </div>

              {/* Redirect Button */}
              <a
                href={redirectAuthUrl}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#008FD3] text-white hover:bg-[#007CB8] font-semibold text-xs transition shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Chuyển hướng trang đăng nhập Google OAuth</span>
              </a>

              {/* Google Cloud Console Guidance */}
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-2 text-[11px]">
                <span className="font-bold text-[#1E40AF] block">Thông số tích hợp Google Cloud:</span>
                <div className="bg-white p-2 rounded border border-[#DBEAFE] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Origin:</span>
                    <button onClick={() => copyToClipboard(currentOrigin, 'origin')} className="text-[#008FD3] hover:underline font-semibold">
                      {copiedField === 'origin' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                  <code className="text-[#008FD3] block font-mono text-[10px] truncate">{currentOrigin}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>StockAI Vietnam &bull; Phiên bản V2</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] font-medium text-[#475569] transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
