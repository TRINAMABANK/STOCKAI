'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  ArrowLeftRight, 
  TrendingUp, 
  Filter, 
  Zap, 
  LineChart, 
  Bot, 
  Bookmark, 
  Bell, 
  History,
  FileText, 
  RefreshCw,
  Activity,
  ShieldCheck,
  User,
  BookOpen,
  X
} from 'lucide-react';
import { UserProfile } from '@/types';
import Logo from './Logo';

export type ActiveMenu = 
  | 'dashboard'
  | 'screener'
  | 'analysis'
  | 't3'
  | 'watchlist'
  | 'profile'
  | 'subscription'
  | 'guide'
  | 'admin-subscription'
  | 'portfolio'
  | 'transactions'
  | 'market'
  | 'ai'
  | 'alerts'
  | 'eod-report'
  | 'api-center'
  | 'backtest'
  | 'settings';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  onCheckConnection: () => void;
  isCheckingConn?: boolean;
  currentUser?: UserProfile | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  onCheckConnection,
  isCheckingConn = false,
  currentUser,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // 1. Nhóm chức năng chính cho Người Dùng (User Portal)
  const userPortalItems = [
    { id: 'dashboard', label: 'Dashboard thị trường', icon: LayoutDashboard },
    { id: 'screener', label: 'Bộ quét cổ phiếu', icon: Filter },
    { id: 'analysis', label: 'Phân tích cổ phiếu', icon: LineChart },
    { id: 't3', label: 'Quét T+1–T+5', icon: Zap },
    { id: 'watchlist', label: 'Danh sách theo dõi', icon: Bookmark },
    { id: 'profile', label: 'Tài khoản cá nhân', icon: User },
    { id: 'subscription', label: 'Gói dịch vụ StockAI', icon: Wallet },
    { id: 'guide', label: 'Cẩm nang & Hướng dẫn', icon: BookOpen },
  ];

  // 2. Nhóm công cụ bổ trợ
  const toolItems = [
    { id: 'portfolio', label: 'Danh mục mô phỏng', icon: PieChart },
    { id: 'transactions', label: 'Sổ giao dịch ghi nhận', icon: ArrowLeftRight },
    { id: 'market', label: 'Bảng giá trực tuyến', icon: TrendingUp },
    { id: 'ai', label: 'Trợ lý AI', icon: Bot, isAi: true },
    { id: 'alerts', label: 'Cảnh báo thị trường', icon: Bell },
    { id: 'eod-report', label: 'Tổng kết phiên (EOD)', icon: FileText },
    { id: 'backtest', label: 'Kiểm định chiến lược', icon: History },
  ];

  // 3. Nhóm Admin: CHỈ hiển thị khi người dùng có quyền ADMIN
  const adminItems = isAdmin ? [
    { id: 'admin-subscription', label: 'Admin Duyệt Thuê Bao', icon: ShieldCheck, isAdmin: true },
  ] : [];

  const handleSelect = (id: ActiveMenu) => {
    onSelectMenu(id);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavGroup = (title: string, items: any[]) => (
    <div className="space-y-1">
      <div className="px-3.5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#8FA0CA]">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;

        let btnClass = 'group flex items-center gap-3 w-full px-3.5 py-2.2 rounded-xl text-[13px] text-left transition-all duration-200 ease-out select-none ';

        if (isActive) {
          btnClass += 'bg-gradient-to-r from-[#7C3CFF] to-[#087CFF] text-white font-bold shadow-md shadow-[#087CFF]/30';
        } else {
          btnClass += 'text-[#8FA0CA] hover:text-white hover:bg-white/[0.08] font-medium';
        }

        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id as ActiveMenu)}
            className={btnClass}
          >
            <Icon className={`w-[18px] h-[18px] shrink-0 transition ${
              isActive 
                ? 'text-white' 
                : (item.isAi ? 'text-[#C084FC] group-hover:text-white' : item.isAdmin ? 'text-[#EF4444]' : 'text-[#8FA0CA] group-hover:text-white')
            }`} />
            <span className="truncate">{item.label}</span>
            {item.isAi && !isActive && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#8B36FF]/30 text-[#E9D5FF] border border-[#8B36FF]/40">
                AI
              </span>
            )}
            {item.isAdmin && (
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'}`}>
                ADMIN
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="w-64 bg-[#101B4B] text-white flex flex-col h-full select-none border-r border-[#1E2B6B] shadow-xl">
      {/* Brand Header with Official StockAI Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <Logo size="md" variant="plain" onClick={() => handleSelect('dashboard')} />
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isAdmin 
              ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40' 
              : 'bg-[#087CFF]/20 text-[#38BDF8] border-[#087CFF]/40'
          }`}>
            {isAdmin ? 'Admin' : (currentUser?.tier || 'Pro')}
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {renderNavGroup('Giao diện Người dùng', userPortalItems)}
        {renderNavGroup('Công cụ Phân tích', toolItems)}
        {adminItems.length > 0 && renderNavGroup('Khu vực Quản trị', adminItems)}
      </nav>

      {/* Market Data Status Box at Sidebar Bottom */}
      <div className="p-3 m-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs shrink-0 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#00A991] animate-pulse"></span>
          <span className="font-semibold text-white text-[12px]">Dữ liệu thị trường</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00A991]/20 text-[#00A991] border border-[#00A991]/30 ml-auto">
            REALTIME
          </span>
        </div>
        <p className="text-[#8FA0CA] text-[11px] mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#00A991]" />
          <span>Thời gian thực • 14:35:22</span>
        </p>
        <button
          onClick={onCheckConnection}
          disabled={isCheckingConn}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition border border-white/15"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConn ? 'animate-spin text-[#13C9D5]' : 'text-[#13C9D5]'}`} />
          <span>{isCheckingConn ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible md+) */}
      <aside className="hidden md:flex h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isOpenMobile is true) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Sliding Drawer */}
          <div className="relative flex-1 max-w-xs w-full bg-white z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
