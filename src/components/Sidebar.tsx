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
  Radio, 
  History, 
  Settings,
  RefreshCw,
  Activity,
  ShieldCheck
} from 'lucide-react';

export type ActiveMenu = 
  | 'dashboard'
  | 'subscription'
  | 'admin-subscription'
  | 'portfolio'
  | 'transactions'
  | 'market'
  | 'screener'
  | 't3'
  | 'analysis'
  | 'ai'
  | 'watchlist'
  | 'alerts'
  | 'api-center'
  | 'backtest'
  | 'settings';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  onCheckConnection: () => void;
  isCheckingConn?: boolean;
}

import Logo from './Logo';

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  onCheckConnection,
  isCheckingConn = false,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'subscription', label: 'Gói thuê bao StockAI', icon: Wallet },
    { id: 'admin-subscription', label: 'Admin Duyệt Thuê Bao', icon: ShieldCheck, isAdmin: true },
    { id: 'portfolio', label: 'Danh mục mô phỏng', icon: PieChart },
    { id: 'transactions', label: 'Sổ giao dịch ghi nhận', icon: ArrowLeftRight },
    { id: 'market', label: 'Thị trường & Bảng giá', icon: TrendingUp },
    { id: 'screener', label: 'Bộ lọc cổ phiếu', icon: Filter },
    { id: 't3', label: 'Quét T+1–T+5', icon: Zap },
    { id: 'analysis', label: 'Phân tích cổ phiếu', icon: LineChart },
    { id: 'ai', label: 'Trợ lý AI', icon: Bot, isAi: true },
    { id: 'watchlist', label: 'Danh sách theo dõi', icon: Bookmark },
    { id: 'alerts', label: 'Cảnh báo', icon: Bell },
    { id: 'api-center', label: 'Trung tâm API & Dữ liệu', icon: Radio },
    { id: 'backtest', label: 'Kiểm định chiến lược', icon: History },
    { id: 'settings', label: 'Cài đặt & Sao lưu', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#FFFFFF] text-[#172033] flex flex-col h-screen select-none border-r border-[#E2E8F0] shrink-0 shadow-xs">
      {/* Brand Header with Official StockAI Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0]">
        <Logo size="md" variant="default" onClick={() => onSelectMenu('dashboard')} />
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
          Personal
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          let btnClass = 'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all text-left ';

          if (isActive) {
            btnClass += 'bg-[#E0F2FE] text-[#008FD3] font-semibold shadow-2xs';
          } else {
            btnClass += 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC] font-medium';
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id as ActiveMenu)}
              className={btnClass}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 transition ${
                isActive 
                  ? 'text-[#008FD3]' 
                  : (item.isAi ? 'text-[#8B5CF6]' : 'text-[#64748B]')
              }`} />
              <span className="truncate">{item.label}</span>
              {item.isAi && !isActive && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#8B5CF6]">
                  AI
                </span>
              )}
              {item.isAdmin && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-[#008FD3] text-white' : 'bg-[#FFE4E6] text-[#F43F5E]'}`}>
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Market Data Status Box at Sidebar Bottom */}
      <div className="p-3.5 m-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-xs">
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
    </aside>
  );
}
