'use client';

import React, { useState } from 'react';
import { TrendingUp, Search, Filter, Activity } from 'lucide-react';
import { StockQuote, MarketIndex, Exchange } from '@/types';

interface MarketBoardViewProps {
  quotes: StockQuote[];
  indices: MarketIndex[];
  onSelectStock: (symbol: string) => void;
}

export default function MarketBoardView({
  quotes,
  indices,
  onSelectStock,
}: MarketBoardViewProps) {
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | Exchange>('ALL');
  const [search, setSearch] = useState('');

  const filtered = quotes.filter(q => {
    const matchExchange = exchangeFilter === 'ALL' || q.exchange === exchangeFilter;
    const matchSearch = q.symbol.toLowerCase().includes(search.toLowerCase()) || 
                        q.companyName.toLowerCase().includes(search.toLowerCase());
    return matchExchange && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thị trường & Bảng giá trực tuyến</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dữ liệu giá khớp lệnh, chỉ số và thanh khoản HOSE, HNX, UPCoM</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-green"></span>
          <span className="text-slate-600 font-medium">Nguồn: <strong className="text-slate-800">Vietstock API</strong></span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-mono">14:35:22</span>
        </div>
      </div>

      {/* Indices Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map(idx => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">{idx.name}</p>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}</h4>
              </div>
              <span className={`text-xs font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <button
              key={ex}
              onClick={() => setExchangeFilter(ex as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                exchangeFilter === ex
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ex === 'ALL' ? 'Tất cả sàn' : ex}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên công ty..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Board Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold">Sàn</th>
                <th className="py-3 px-4 font-semibold text-right">Giá khớp</th>
                <th className="py-3 px-4 font-semibold text-right">+/-</th>
                <th className="py-3 px-4 font-semibold text-right">%</th>
                <th className="py-3 px-4 font-semibold text-right">Mở cửa</th>
                <th className="py-3 px-4 font-semibold text-right">Cao nhất</th>
                <th className="py-3 px-4 font-semibold text-right">Thấp nhất</th>
                <th className="py-3 px-4 font-semibold text-right">Khối lượng</th>
                <th className="py-3 px-4 font-semibold text-right">P/E</th>
                <th className="py-3 px-4 font-semibold text-center">RSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {stock.symbol}
                      <span className="block text-[10px] text-slate-400 font-normal">{stock.industry}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{stock.exchange}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {stock.price.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold font-mono ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">{stock.open.toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-mono">{stock.high.toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-mono">{stock.low.toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 font-mono">{stock.volume.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-mono">{stock.pe ? stock.pe.toFixed(1) : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (stock.rsi || 50) > 70 ? 'bg-amber-100 text-amber-800' :
                        (stock.rsi || 50) < 35 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {stock.rsi || 50}
                      </span>
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
