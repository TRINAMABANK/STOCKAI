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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Danh sách theo dõi (Watchlist)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi sát diễn biến giá và khối lượng các mã cổ phiếu mục tiêu</p>
        </div>

        {/* Add Stock */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Nhập mã (VD: MBB)..."
            className="w-36 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mã</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-medium">
              {watchlistQuotes.map(stock => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-blue-600 cursor-pointer" onClick={() => onSelectStock(stock.symbol)}>
                      {stock.symbol}
                      <span className="block text-[10px] text-slate-400 font-normal">{stock.companyName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{stock.exchange}</td>
                    <td className="py-3 px-4 text-slate-600">{stock.industry}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{stock.price.toLocaleString('vi-VN')}</td>
                    <td className={`py-3 px-4 text-right font-semibold font-mono ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{stock.volume.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                        {stock.rsi || 50}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                        >
                          Phân tích
                        </button>
                        <button
                          onClick={() => handleRemove(stock.symbol)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
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
