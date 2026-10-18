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
  Activity
} from 'lucide-react';

export type ActiveMenu = 
  | 'dashboard'
  | 'subscription'
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

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  onCheckConnection,
  isCheckingConn = false,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'subscription', label: 'Gói thuê bao StockAI', icon: Wallet },
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
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#E2E8F0]">
        <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#008FD3]" />
        </div>
        <div>
          <div className="flex items-center gap-1 font-bold text-base text-[#172033] tracking-tight">
            <span>StockAI</span>
          </div>
          <p className="text-[11px] text-[#64748B] font-medium leading-none">Personal</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          let btnClass = 'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ';

          if (isActive) {
            btnClass += 'bg-[#E0F2FE] text-[#008FD3] shadow-xs';
          } else {
            btnClass += 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]';
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id as ActiveMenu)}
              className={btnClass}
            >
              <Icon className={`w-4 h-4 shrink-0 transition ${
                isActive 
                  ? 'text-[#008FD3]' 
                  : (item.isAi ? 'text-[#8B5CF6]' : 'text-[#64748B]')
              }`} />
              <span className="truncate">{item.label}</span>
              {item.isAi && !isActive && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EDE9FE] text-[#8B5CF6]">
                  AI
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
          <span className="font-bold text-[#172033]">Dữ liệu thị trường</span>
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
