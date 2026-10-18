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
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">Thị trường & Bảng giá trực tuyến</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Dữ liệu giá khớp lệnh, chỉ số và thanh khoản HOSE, HNX, UPCoM</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-profit"></span>
          <span className="text-[#64748B] font-medium">Nguồn: <strong className="text-[#172033]">Vietstock API</strong></span>
          <span className="text-[#E2E8F0]">|</span>
          <span className="text-[#64748B] font-mono tabular-nums">14:35:22</span>
        </div>
      </div>

      {/* Indices Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map(idx => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-[#64748B]">{idx.name}</p>
                <h4 className="text-[18px] font-bold text-[#172033] mt-0.5 font-mono tabular-nums">{idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}</h4>
              </div>
              <span className={`text-[13px] font-bold font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <button
              key={ex}
              onClick={() => setExchangeFilter(ex as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                exchangeFilter === ex
                  ? 'bg-[#008FD3] text-white shadow-2xs'
                  : 'bg-[#F5F8FC] text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0]'
              }`}
            >
              {ex === 'ALL' ? 'Tất cả sàn' : ex}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên công ty..."
            className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
          />
        </div>
      </div>

      {/* Main Board Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
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
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition h-[42px]"
                  >
                    <td className="py-2.5 px-4 font-semibold text-[#008FD3]">
                      {stock.symbol}
                      <span className="block text-[11px] text-[#64748B] font-normal">{stock.industry}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] text-xs font-medium">{stock.exchange}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#172033] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                      {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#64748B] font-mono tabular-nums">{stock.open.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right text-[#10B981] font-mono tabular-nums">{stock.high.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right text-[#F43F5E] font-mono tabular-nums">{stock.low.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#172033] font-mono tabular-nums">{stock.volume.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-[#64748B] font-mono tabular-nums">{stock.pe ? stock.pe.toFixed(1) : '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono tabular-nums ${
                        (stock.rsi || 50) > 70 ? 'bg-[#FFE4E6] text-[#F43F5E]' :
                        (stock.rsi || 50) < 35 ? 'bg-[#E0F2FE] text-[#008FD3]' : 'bg-[#F5F8FC] border border-[#E2E8F0] text-[#172033]'
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
