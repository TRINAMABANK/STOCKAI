'use client';

import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { StockQuote } from '@/types';

interface WatchlistViewProps {
  quotes: StockQuote[];
  onSelectStock: (symbol: string) => void;
}

export default function WatchlistView({
  quotes,
  onSelectStock,
}: WatchlistViewProps) {
  const [watchlist, setWatchlist] = useState<string[]>(['FPT', 'HPG', 'TCB', 'VNM', 'MWG', 'SSI', 'DGC', 'GVR']);
  const [newSymbol, setNewSymbol] = useState('');

  const watchlistQuotes = quotes.filter(q => watchlist.includes(q.symbol));

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (sym && !watchlist.includes(sym)) {
      setWatchlist(prev => [...prev, sym]);
      setNewSymbol('');
    }
  };

  const handleRemove = (sym: string) => {
    setWatchlist(prev => prev.filter(s => s !== sym));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Danh sách theo dõi (Watchlist)</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Theo dõi sát diễn biến giá và khối lượng các mã cổ phiếu mục tiêu</p>
        </div>

        {/* Add Stock */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Nhập mã (VD: MBB)..."
            className="w-36 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#172033] uppercase font-bold focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
          />
          <button
            onClick={handleAdd}
            className="px-3.5 py-1.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mã</span>
          </button>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold">Sàn</th>
                <th className="py-3 px-4 font-semibold">Ngành</th>
                <th className="py-3 px-4 font-semibold text-right">Giá</th>
                <th className="py-3 px-4 font-semibold text-right">+/-</th>
                <th className="py-3 px-4 font-semibold text-right">%</th>
                <th className="py-3 px-4 font-semibold text-right">Khối lượng</th>
                <th className="py-3 px-4 font-semibold text-center">RSI</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {watchlistQuotes.map(stock => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-[#F5F8FC] transition">
                    <td className="py-3 px-4 font-bold text-[#008FD3] cursor-pointer" onClick={() => onSelectStock(stock.symbol)}>
                      {stock.symbol}
                      <span className="block text-[10px] text-[#64748B] font-normal">{stock.companyName}</span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{stock.exchange}</td>
                    <td className="py-3 px-4 text-[#64748B]">{stock.industry}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#172033] font-mono">{stock.price.toLocaleString('vi-VN')}</td>
                    <td className={`py-3 px-4 text-right font-semibold font-mono ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                      {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold font-mono ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">{stock.volume.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F8FC] border border-[#E2E8F0] font-bold text-[#172033] text-[11px]">
                        {stock.rsi || 50}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#008FD3] font-semibold text-[11px] transition"
                        >
                          Phân tích
                        </button>
                        <button
                          onClick={() => handleRemove(stock.symbol)}
                          className="p-1 text-[#CBD5E1] hover:text-[#F43F5E] transition"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
