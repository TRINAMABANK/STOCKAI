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
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Thị trường & Bảng giá trực tuyến</h2>
          <p className="text-[13px] text-[#647293] mt-0.5">Dữ liệu giá khớp lệnh, chỉ số và thanh khoản HOSE, HNX, UPCoM</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse-profit"></span>
          <span className="text-[#647293] font-medium">Nguồn: <strong className="text-[#172554]">Vietstock API</strong></span>
          <span className="text-[#DCE5FF]">|</span>
          <span className="text-[#647293] font-mono tabular-nums">14:35:22</span>
        </div>
      </div>

      {/* Indices Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map(idx => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCE5FF] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-[#647293]">{idx.name}</p>
                <h4 className="text-[18px] font-bold text-[#172554] mt-0.5 font-mono tabular-nums">{idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}</h4>
              </div>
              <span className={`text-[13px] font-bold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCE5FF] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <button
              key={ex}
              onClick={() => setExchangeFilter(ex as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                exchangeFilter === ex
                  ? 'bg-[#087CFF] text-white shadow-2xs'
                  : 'bg-[#F4F7FF] text-[#647293] hover:text-[#172554] hover:bg-[#DCE5FF]'
              }`}
            >
              {ex === 'ALL' ? 'Tất cả sàn' : ex}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-[#647293] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên công ty..."
            className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#172554] placeholder-[#647293] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
          />
        </div>
      </div>

      {/* Main Board Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] text-[12px] font-medium border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-medium text-left">Mã CP</th>
                <th className="py-3 px-3 font-medium text-left">Sàn</th>
                <th className="py-3 px-4 font-medium text-right">Giá khớp</th>
                <th className="py-3 px-3 font-medium text-right">+/-</th>
                <th className="py-3 px-3 font-medium text-right">%</th>
                <th className="py-3 px-3 font-medium text-right">Mở cửa</th>
                <th className="py-3 px-3 font-medium text-right">Cao nhất</th>
                <th className="py-3 px-3 font-medium text-right">Thấp nhất</th>
                <th className="py-3 px-4 font-medium text-right">Khối lượng</th>
                <th className="py-3 px-3 font-medium text-right">P/E</th>
                <th className="py-3 px-3 font-medium text-center">RSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF]">
              {filtered.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition h-[42px]"
                  >
                    <td className="py-2.5 px-4 font-semibold text-[#087CFF]">
                      {stock.symbol}
                      <span className="block text-[11px] text-[#647293] font-normal">{stock.industry}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#647293] text-xs font-medium">{stock.exchange}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#172554] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                      {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#647293] font-mono tabular-nums">{stock.open.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right text-[#16A34A] font-mono tabular-nums">{stock.high.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right text-[#EF4444] font-mono tabular-nums">{stock.low.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#172554] font-mono tabular-nums">{stock.volume.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-[#647293] font-mono tabular-nums">{stock.pe ? stock.pe.toFixed(1) : '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono tabular-nums ${
                        (stock.rsi || 50) > 70 ? 'bg-[#FEE2E2] text-[#EF4444]' :
                        (stock.rsi || 50) < 35 ? 'bg-[#EBF3FF] text-[#087CFF]' : 'bg-[#F4F7FF] border border-[#DCE5FF] text-[#172554]'
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
