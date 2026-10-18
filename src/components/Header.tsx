'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, User, TrendingUp, LogOut, Shield } from 'lucide-react';
import { MarketIndex, StockQuote, UserProfile } from '@/types';
import GoogleAuthModal from './GoogleAuthModal';

import Logo from './Logo';

interface HeaderProps {
  indices: MarketIndex[];
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
  quotes?: StockQuote[];
}

export default function Header({
  indices,
  onSelectStock,
  onOpenSettings,
  quotes = [],
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [googleConfig, setGoogleConfig] = useState<{
    clientId: string;
    isConfigured: boolean;
    callbackUrl: string;
  }>({
    clientId: '117963205714-bcsvrtpdb8j7qh9cu90tcit7to3h63gf.apps.googleusercontent.com',
    isConfigured: true,
    callbackUrl: 'http://localhost:3000/api/auth/callback/google',
  });
  const [headerToast, setHeaderToast] = useState<string | null>(null);

  // Load current session from backend
  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.data?.user) {
        setCurrentUser(data.data.user);
        if (data.data.google) {
          setGoogleConfig(data.data.google);
        }
      }
    } catch (err) {
      console.error('Lỗi tải thông tin user:', err);
    }
  };

  useEffect(() => {
    loadCurrentUser();

    // Check redirect callback params in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth_success') === '1') {
        setHeaderToast('✅ Đăng nhập Google thành công!');
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => setHeaderToast(null), 4000);
        loadCurrentUser();
      } else if (urlParams.get('auth_error')) {
        const err = urlParams.get('auth_error');
        setHeaderToast(`❌ Lỗi đăng nhập Google: ${err}`);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => setHeaderToast(null), 5000);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setHeaderToast('Đã đăng xuất');
      setTimeout(() => {
        setHeaderToast(null);
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    }
  };

  const filteredQuotes = searchTerm.trim()
    ? quotes
        .filter(
          (q) =>
            q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      {/* Toast in Header */}
      {headerToast && (
        <div className="absolute top-20 right-6 z-50 bg-[#172033] text-white px-4 py-2 rounded-xl shadow-xl border border-[#E2E8F0] text-xs font-semibold animate-in fade-in">
          {headerToast}
        </div>
      )}

      {/* Left side: Mobile Logo & Search Bar */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Logo size="xs" variant="default" />
        </div>

        {/* Search Bar */}
        <div className="relative w-64 sm:w-80 lg:w-96">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            placeholder="Tìm mã cổ phiếu (VD: FPT, VNM, HPG...)"
            className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs lg:text-sm text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#008FD3]/20 focus:border-[#008FD3] transition"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchTerm.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden z-50">
            {filteredQuotes.length > 0 ? (
              <div className="py-1">
                {filteredQuotes.map((q) => (
                  <button
                    key={q.symbol}
                    onClick={() => {
                      onSelectStock(q.symbol);
                      setSearchTerm('');
                      setIsSearching(false);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-[#F5F8FC] transition border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172033] text-sm">{q.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F8FC] text-[#64748B] font-semibold border border-[#E2E8F0]">
                          {q.exchange}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate max-w-[200px]">{q.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-[#172033]">{(q.price / 1000).toFixed(2)}k</p>
                      <p
                        className={`text-xs font-semibold ${
                          q.change >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                        }`}
                      >
                        {q.change >= 0 ? '+' : ''}
                        {q.changePercent}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#64748B]">
                Không tìm thấy mã nào phù hợp với &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Indices Tickers */}
      <div className="hidden md:flex items-center gap-6">
        {indices.slice(0, 3).map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="flex items-center gap-2 text-[12px]">
              <span className="font-semibold text-[#64748B] tracking-wide">{idx.symbol}</span>
              <span className="font-bold text-[#172033] font-mono tabular-nums">
                {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`font-semibold flex items-center font-mono tabular-nums ${
                  isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'
                }`}
              >
                {isUp ? '+' : ''}
                {idx.change.toFixed(2)} ({isUp ? '+' : ''}
                {idx.changePercent.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Right Controls: Notifications, Settings, Profile & Google Login */}
      <div className="flex items-center gap-3">
        {/* Google Login Trigger Button (visible if user not Google-logged-in or wants to manage auth) */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F8FC] hover:bg-[#E0F2FE] border border-[#E2E8F0] text-[#172033] text-xs font-semibold transition shadow-2xs"
          title="Đăng nhập hoặc liên kết Google Gmail"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Google Login</span>
        </button>

        {/* Notification Bell */}
        <button
          title="Thông báo cảnh báo"
          className="relative p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#F43F5E] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          title="Cài đặt hệ thống"
          className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] transition"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Capsule */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0] hover:opacity-85 transition text-left"
          title="Xem thông tin tài khoản & Đăng nhập Google"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-[#BAE6FD] object-cover shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#008FD3] font-bold text-xs shadow-2xs">
              {currentUser?.name
                ? currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'AT'}
            </div>
          )}
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#172033] truncate max-w-[110px]">
                {currentUser?.name || 'Anh Trí'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  currentUser?.tier === 'PRO'
                    ? 'bg-[#E0F2FE] text-[#008FD3]'
                    : currentUser?.tier === 'ENTERPRISE'
                    ? 'bg-[#EDE9FE] text-[#8B5CF6]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {currentUser?.tier || 'PRO'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        clientId={googleConfig.clientId}
        callbackUrl={googleConfig.callbackUrl}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setHeaderToast(`✅ Chào mừng ${user.name}! Đăng nhập Google thành công.`);
          setTimeout(() => {
            setHeaderToast(null);
            window.location.reload();
          }, 800);
        }}
        onLogout={handleLogout}
      />
    </header>
  );
}
