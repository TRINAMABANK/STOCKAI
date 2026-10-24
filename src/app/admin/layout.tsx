'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Layers, 
  FileText, 
  Settings, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X, 
  Activity, 
  AlertCircle,
  RefreshCw,
  Lock,
  Radio
} from 'lucide-react';
import { UserProfile } from '@/types';
import Logo from '@/components/Logo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        }
      } catch (err) {
        console.error('Lỗi xác thực Admin:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAdminAuth();
  }, []);

  // 1. Loading State
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center space-y-4">
        <Logo size="md" variant="default" />
        <div className="flex items-center gap-2 text-xs font-semibold text-[#647293]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#087CFF]" />
          <span>Đang xác minh quyền Quản trị viên StockAI...</span>
        </div>
      </div>
    );
  }

  // 2. Access Denied Guard (Nếu không phải ADMIN)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#FEE2E2] shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172554]">Từ chối truy cập (403 Forbidden)</h2>
            <p className="text-xs text-[#647293] mt-2 leading-relaxed">
              Khu vực này dành riêng cho Ban Quản trị Hệ thống StockAI. Tài khoản hiện tại của bạn (<strong>{currentUser?.email || 'Chưa đăng nhập'}</strong>) không có quyền Quản trị viên (ADMIN).
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Về Trang Dành Cho Nhà Đầu Tư</span>
            </Link>
            <a
              href="/api/auth/logout"
              className="text-xs text-[#647293] hover:text-[#172554] py-1 font-semibold"
            >
              Đăng nhập bằng tài khoản Quản trị khác
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FF] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-[#FFFFFF] border-b border-[#DCE5FF] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-xl text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]"
            title="Menu Quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Logo size="sm" variant="default" />
          
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444] border border-[#FEE2E2] text-[10px] font-bold tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            ADMIN PORTAL
          </span>
        </div>

        {/* Center / Right Header controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FF] hover:bg-[#EBF3FF] border border-[#DCE5FF] text-xs font-semibold text-[#087CFF] transition shadow-2xs"
            title="Quay lại giao diện dành cho người dùng"
          >
            <span>Trang Người Dùng</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Admin Avatar Pill */}
          <div className="flex items-center gap-2 pl-3 border-l border-[#DCE5FF]">
            <div className="w-8 h-8 rounded-full bg-[#FEE2E2] text-[#EF4444] border border-[#FEE2E2] flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-[#172554] block truncate max-w-[140px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#EF4444] font-semibold block">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
