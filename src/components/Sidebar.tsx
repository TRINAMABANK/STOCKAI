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
  | 'bmsc'
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
    { id: 'bmsc', label: 'Tài khoản chứng khoán', icon: Wallet },
    { id: 'portfolio', label: 'Danh mục đầu tư', icon: PieChart },
    { id: 'transactions', label: 'Giao dịch & Sổ lệnh', icon: ArrowLeftRight },
    { id: 'market', label: 'Thị trường & Bảng giá', icon: TrendingUp },
    { id: 'screener', label: 'Bộ lọc cổ phiếu', icon: Filter },
    { id: 't3', label: 'Giao dịch T+3', icon: Zap, isHighlight: true },
    { id: 'analysis', label: 'Phân tích cổ phiếu', icon: LineChart },
    { id: 'ai', label: 'Trợ lý AI', icon: Bot },
    { id: 'watchlist', label: 'Danh sách theo dõi', icon: Bookmark },
    { id: 'alerts', label: 'Cảnh báo', icon: Bell },
    { id: 'api-center', label: 'Trung tâm API', icon: Radio },
    { id: 'backtest', label: 'Kiểm định chiến lược', icon: History },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a1120] text-slate-300 flex flex-col h-screen select-none border-r border-slate-800 shrink-0">
      {/* Logo Header */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-lg text-white tracking-tight">
            <span>StockAI</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Personal</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          const isT3Highlight = item.isHighlight;

          let btnClass = 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ';

          if (isActive) {
            if (isT3Highlight) {
              btnClass += 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30';
            } else {
              btnClass += 'bg-[#0f2e29] text-emerald-400 border border-emerald-500/40 font-semibold shadow-sm';
            }
          } else {
            if (isT3Highlight) {
              btnClass += 'text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200';
            } else {
              btnClass += 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60';
            }
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id as ActiveMenu)}
              className={btnClass}
            >
              <Icon className={`w-4 h-4 shrink-0 ${
                isActive 
                  ? (isT3Highlight ? 'text-white' : 'text-emerald-400') 
                  : (isT3Highlight ? 'text-indigo-400' : 'text-slate-400')
              }`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Market Data Status Box at Sidebar Bottom */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-green"></span>
          <span className="font-semibold text-slate-200">Dữ liệu thị trường</span>
        </div>
        <p className="text-slate-400 pl-4.5 mb-1.5 flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Đang cập nhật</span>
        </p>
        <div className="text-[11px] text-slate-400 pl-4.5 space-y-0.5 mb-2.5">
          <p>Cập nhật: <span className="text-slate-300 font-mono">14:35:22</span></p>
          <p>Nguồn: <span className="text-slate-300 font-medium">API</span></p>
        </div>
        <button
          onClick={onCheckConnection}
          disabled={isCheckingConn}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConn ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isCheckingConn ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
        </button>
      </div>
    </aside>
  );
}
