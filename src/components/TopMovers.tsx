'use client';

import React from 'react';
import { StockQuote, MarketIndex } from '@/types';

interface TopMoversProps {
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  indices: MarketIndex[];
  onSelectStock: (symbol: string) => void;
  onViewAllStocks: () => void;
}

export default function TopMovers({
  topGainers,
  topLosers,
  indices,
  onSelectStock,
  onViewAllStocks,
}: TopMoversProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Top Cổ phiếu Tăng */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#172033]">Top cổ phiếu tăng</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-[#008FD3] hover:text-[#007bb8] font-semibold transition"
          >
            Xem tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                <th className="pb-2 font-semibold">Mã</th>
                <th className="pb-2 font-semibold text-right">Giá</th>
                <th className="pb-2 font-semibold text-right">+/-</th>
                <th className="pb-2 font-semibold text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {topGainers.map((stock) => (
                <tr 
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="hover:bg-[#F5F8FC] cursor-pointer transition"
                >
                  <td className="py-2.5 font-bold text-[#008FD3]">{stock.symbol}</td>
                  <td className="py-2.5 text-right font-semibold text-[#172033] font-mono">
                    {stock.price.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[#10B981] font-mono">
                    +{stock.change.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#10B981] font-mono">
                    +{stock.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Top Cổ phiếu Giảm */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#172033]">Top cổ phiếu giảm</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-[#008FD3] hover:text-[#007bb8] font-semibold transition"
          >
            Xem tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                <th className="pb-2 font-semibold">Mã</th>
                <th className="pb-2 font-semibold text-right">Giá</th>
                <th className="pb-2 font-semibold text-right">+/-</th>
                <th className="pb-2 font-semibold text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {topLosers.map((stock) => (
                <tr 
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="hover:bg-[#F5F8FC] cursor-pointer transition"
                >
                  <td className="py-2.5 font-bold text-[#008FD3]">{stock.symbol}</td>
                  <td className="py-2.5 text-right font-semibold text-[#172033] font-mono">
                    {stock.price.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[#F43F5E] font-mono">
                    {stock.change.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#F43F5E] font-mono">
                    {stock.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Chỉ số Thị trường */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#172033]">Chỉ số thị trường</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-[#008FD3] hover:text-[#007bb8] font-semibold transition"
          >
            Xem chi tiết
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                <th className="pb-2 font-semibold">Tên</th>
                <th className="pb-2 font-semibold text-right">Giá trị</th>
                <th className="pb-2 font-semibold text-right">+/-</th>
                <th className="pb-2 font-semibold text-center">Đồ thị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {indices.map((idx) => {
                const isUp = idx.change >= 0;
                return (
                  <tr key={idx.symbol} className="hover:bg-[#F5F8FC] transition">
                    <td className="py-2.5 font-bold text-[#172033]">{idx.symbol}</td>
                    <td className="py-2.5 text-right font-semibold text-[#172033] font-mono">
                      {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      <span className={`font-bold ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                        {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <svg className="w-16 h-5 inline-block" viewBox="0 0 60 20">
                        <polyline
                          fill="none"
                          stroke={isUp ? '#10B981' : '#F43F5E'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={isUp ? "2,15 15,12 30,14 45,7 58,4" : "2,5 15,9 30,7 45,14 58,18"}
                        />
                      </svg>
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
