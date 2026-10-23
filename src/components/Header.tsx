'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, User, TrendingUp, LogOut, Shield, Menu, ChevronDown, Upload, ShieldCheck } from 'lucide-react';
import { MarketIndex, StockQuote, UserProfile } from '@/types';
import GoogleAuthModal from './GoogleAuthModal';

import Logo from './Logo';

interface HeaderProps {
  indices: MarketIndex[];
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
  quotes?: StockQuote[];
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenSubscription?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function Header({
  indices,
  onSelectStock,
  onOpenSettings,
  quotes = [],
  currentUser: initialUser,
  onOpenProfile,
  onOpenSubscription,
  onToggleMobileMenu,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser || null);
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

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync initialUser when prop updates
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  // Handle click outside and Escape key to close user dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  // Helper: Trạng thái gói dịch vụ theo phong cách FireAnt (Hội viên Miễn phí / PRO / Enterprise)
  const getTierInfo = () => {
    const tier = currentUser?.tier || 'FREE';
    if (tier === 'ENTERPRISE') {
      return {
        label: 'Hội viên Nâng cao',
        colorClass: 'text-[#8B5CF6]',
        bgClass: 'bg-[#EDE9FE] text-[#8B5CF6]',
        badgeText: 'ENTERPRISE',
      };
    }
    if (tier === 'PRO') {
      return {
        label: 'Hội viên Chuyên nghiệp (PRO)',
        colorClass: 'text-[#008FD3]',
        bgClass: 'bg-[#E0F2FE] text-[#008FD3]',
        badgeText: 'PRO',
      };
    }
    return {
      label: 'Hội viên Miễn phí',
      colorClass: 'text-[#F43F5E]',
      bgClass: 'bg-[#FFE4E6] text-[#F43F5E]',
      badgeText: 'FREE',
    };
  };

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

      {/* Left side: Mobile Toggle & Logo & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] transition"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
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

      {/* Right Controls: Notifications, Settings, Profile & Login/Admin */}
      <div className="flex items-center gap-2.5">
        {/* Admin Direct Button (if logged in as Admin) */}
        {currentUser?.role === 'ADMIN' ? (
          <a
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#008FD3] to-[#0284C7] hover:from-[#007CB8] hover:to-[#0369A1] text-white text-xs font-bold shadow-2xs transition group"
            title="Truy cập Bảng điều khiển Quản trị toàn hệ thống"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Trang Quản trị</span>
          </a>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Primary Login Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#008FD3] hover:bg-[#007CB8] text-white text-xs font-bold transition shadow-2xs"
              title="Đăng nhập tài khoản hoặc quản trị viên"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Đăng nhập</span>
            </button>


          </div>
        )}

        {/* Notification Bell */}
        <button
          title="Thông báo cảnh báo"
          className="relative p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] transition-colors duration-200 ease-out"
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
          className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] transition-colors duration-200 ease-out"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Dropdown Button */}
        <div ref={userMenuRef} className="relative">
          {/* Trigger Button with Avatar, Name, Badge and ChevronDown */}
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E2E8F0] text-left cursor-pointer focus:outline-none select-none group transition-colors duration-200 ease-out"
            title="Tài khoản cá nhân"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-[#BAE6FD] object-cover shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#008FD3] font-bold text-xs shadow-2xs">
                {(() => {
                  if (currentUser?.role === 'ADMIN') return 'TR';
                  if (!currentUser?.name || currentUser.name === 'Khách') return 'K';
                  const clean = currentUser.name.replace(/\s*\(Admin\)/i, '').trim();
                  const words = clean.split(/\s+/);
                  const lastName = words[words.length - 1];
                  return lastName.length <= 4 ? lastName.toUpperCase() : (words[0][0] + lastName[0]).toUpperCase();
                })()}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#172033] truncate max-w-[130px] group-hover:text-[#008FD3] transition-colors duration-200 ease-out">
                  {currentUser?.name || 'Quang Nhựt Trí'}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getTierInfo().bgClass}`}>
                  {getTierInfo().badgeText}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#64748B] group-hover:text-[#172033] transition-transform duration-200 ${
                isUserMenuOpen ? 'rotate-180 text-[#008FD3]' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu (FireAnt style) */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              {/* Dropdown Header: Avatar, Name, Tier Status */}
              <div className="p-5 pb-4 text-center border-b border-[#F1F5F9] bg-[#F8FAFC]/70">
                <div className="relative inline-block mx-auto mb-2">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#BAE6FD] shadow-xs mx-auto"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#008FD3] to-[#0284C7] text-white font-extrabold text-base flex items-center justify-center border-2 border-[#BAE6FD] shadow-xs mx-auto">
                      {(() => {
                        if (!currentUser?.name) return 'TRÍ';
                        const clean = currentUser.name.replace(/\s*\(Admin\)/i, '').trim();
                        const words = clean.split(/\s+/);
                        const lastName = words[words.length - 1];
                        return lastName.length <= 4 ? lastName.toUpperCase() : (words[0][0] + lastName[0]).toUpperCase();
                      })()}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-[#172033] tracking-wide uppercase truncate px-2">
                  {currentUser?.name || 'Quang Nhựt Trí'}
                </h3>

                <p className={`text-xs font-semibold mt-1 ${getTierInfo().colorClass}`}>
                  {getTierInfo().label}
                </p>
              </div>

              {/* Menu Actions */}
              <div className="p-2 space-y-0.5">
                {/* Admin Portal Link if Admin */}
                {currentUser?.role === 'ADMIN' ? (
                  <a
                    href="/admin"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-[#008FD3] bg-[#E0F2FE]/60 hover:bg-[#E0F2FE] transition group"
                  >
                    <Shield className="w-4 h-4 text-[#008FD3] shrink-0" />
                    <span className="flex-1 font-bold">Vào Trang Quản Trị (/admin)</span>
                  </a>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-[#008FD3] bg-[#F0F9FF] hover:bg-[#E0F2FE] transition group"
                    >
                      <User className="w-4 h-4 text-[#008FD3] shrink-0" />
                      <span className="flex-1">Đăng nhập / Đổi tài khoản</span>
                    </button>

                    <a
                      href="/admin"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#475569] hover:text-[#008FD3] hover:bg-[#F8FAFC] transition group"
                    >
                      <Shield className="w-4 h-4 text-[#64748B] group-hover:text-[#008FD3] shrink-0 transition" />
                      <span className="flex-1">Cổng Quản trị viên (/admin)</span>
                    </a>
                  </>
                )}

                <div className="border-t border-[#F1F5F9] my-1" />

                {/* Nâng cấp / Gia hạn */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenSubscription) onOpenSubscription();
                    else if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#172033] hover:bg-[#F0F9FF] hover:text-[#008FD3] transition group"
                >
                  <Upload className="w-4 h-4 text-[#008FD3] shrink-0" />
                  <span className="flex-1 font-medium">Nâng cấp/Gia hạn</span>
                </button>

                <div className="border-t border-[#F1F5F9] my-1" />

                {/* Hồ sơ cá nhân */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] hover:text-[#008FD3] transition group"
                >
                  <User className="w-4 h-4 text-[#64748B] group-hover:text-[#008FD3] shrink-0 transition" />
                  <span className="flex-1 font-medium">Hồ sơ cá nhân</span>
                </button>

                {/* Thiết lập tài khoản */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] hover:text-[#008FD3] transition group"
                >
                  <Settings className="w-4 h-4 text-[#64748B] group-hover:text-[#008FD3] shrink-0 transition" />
                  <span className="flex-1 font-medium">Thiết lập tài khoản</span>
                </button>

                <div className="border-t border-[#F1F5F9] my-1" />

                {/* Đăng xuất */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#F43F5E] hover:bg-[#FFF1F2] transition group"
                >
                  <LogOut className="w-4 h-4 text-[#F43F5E] shrink-0" />
                  <span className="flex-1 font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
