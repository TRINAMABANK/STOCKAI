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
      <div className="px-3.5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;

        let btnClass = 'group flex items-center gap-3 w-full px-3.5 py-2.2 rounded-xl text-[13px] text-left transition-colors duration-200 ease-out select-none ';

        if (isActive) {
          btnClass += 'bg-[#E0F2FE] text-[#008FD3] font-bold shadow-2xs';
        } else {
          btnClass += 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] font-medium';
        }

        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id as ActiveMenu)}
            className={btnClass}
          >
            <Icon className={`w-[18px] h-[18px] shrink-0 transition ${
              isActive 
                ? 'text-[#008FD3]' 
                : (item.isAi ? 'text-[#8B5CF6]' : item.isAdmin ? 'text-[#F43F5E]' : 'text-[#64748B]')
            }`} />
            <span className="truncate transition-colors duration-200 ease-out">{item.label}</span>
            {item.isAi && !isActive && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EDE9FE] text-[#8B5CF6]">
                AI
              </span>
            )}
            {item.isAdmin && (
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded ${isActive ? 'bg-[#008FD3] text-white' : 'bg-[#FFE4E6] text-[#F43F5E]'}`}>
                ADMIN
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="w-64 bg-[#FFFFFF] text-[#172033] flex flex-col h-full select-none border-r border-[#E2E8F0] shadow-xs">
      {/* Brand Header with Official StockAI Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
        <Logo size="md" variant="default" onClick={() => handleSelect('dashboard')} />
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isAdmin 
              ? 'bg-[#FFE4E6] text-[#F43F5E] border-[#FECDD3]' 
              : 'bg-[#E0F2FE] text-[#008FD3] border-[#BAE6FD]'
          }`}>
            {isAdmin ? 'Admin' : (currentUser?.tier || 'Pro')}
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]"
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
      <div className="p-3 m-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-xs shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-profit"></span>
          <span className="font-semibold text-[#172033] text-[12px]">Dữ liệu thị trường</span>
        </div>
        <p className="text-[#64748B] text-[11px] mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#10B981]" />
          <span>Thời gian thực • 14:35:22</span>
        </p>
        <button
          onClick={onCheckConnection}
          disabled={isCheckingConn}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#E0F2FE] text-[#008FD3] text-[11px] font-semibold transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConn ? 'animate-spin text-[#008FD3]' : ''}`} />
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
