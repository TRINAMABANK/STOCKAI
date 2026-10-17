'use client';

import React, { useState } from 'react';
import { Search, Bell, Settings, User, TrendingUp } from 'lucide-react';
import { MarketIndex, StockQuote } from '@/types';

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

  const filteredQuotes = searchTerm.trim()
    ? quotes.filter(q => 
        q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-80 lg:w-96">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            placeholder="Tìm mã cổ phiếu (VD: FPT, VNM, HPG...)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs lg:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchTerm.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
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
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{q.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{q.exchange}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{q.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-slate-900">{(q.price / 1000).toFixed(2)}k</p>
                      <p className={`text-xs font-medium ${q.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {q.change >= 0 ? '+' : ''}{q.changePercent}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Không tìm thấy mã nào phù hợp với &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indices Tickers */}
      <div className="hidden md:flex items-center gap-6">
        {indices.slice(0, 3).map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 tracking-wide">{idx.symbol}</span>
              <span className="font-semibold text-slate-800">{idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}</span>
              <span className={`font-medium flex items-center ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isUp ? '+' : ''}{idx.change.toFixed(2)} ({isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Right Controls: Notifications, Settings, Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button 
          title="Thông báo cảnh báo"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Settings Gear */}
        <button 
          onClick={onOpenSettings}
          title="Cài đặt hệ thống"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
            AT
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Anh Trí</span>
        </div>
      </div>
    </header>
  );
}
