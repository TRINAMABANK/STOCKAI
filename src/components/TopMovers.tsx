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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Top Cổ phiếu Tăng */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4F7FF]">
            <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Top cổ phiếu tăng</h4>
            <button 
              onClick={onViewAllStocks}
              className="text-[12px] font-medium text-[#087CFF] hover:text-[#0066D6] transition flex items-center gap-1"
            >
              Xem tất cả
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[#647293] text-[12px] font-medium border-b border-[#DCE5FF]">
                  <th className="pb-2.5 font-medium text-left w-16">Mã</th>
                  <th className="pb-2.5 font-medium text-right">Giá</th>
                  <th className="pb-2.5 font-medium text-right">+/-</th>
                  <th className="pb-2.5 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF]">
                {topGainers.slice(0, 5).map((stock) => (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition h-[38px]"
                  >
                    <td className="py-2.5 font-semibold text-[#087CFF] text-left">
                      {stock.symbol}
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#172554] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#16A34A] font-mono tabular-nums">
                      +{stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#16A34A] font-mono tabular-nums">
                      +{stock.changePercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {topGainers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#647293] text-xs">
                      Không có dữ liệu cổ phiếu tăng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Top Cổ phiếu Giảm */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4F7FF]">
            <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Top cổ phiếu giảm</h4>
            <button 
              onClick={onViewAllStocks}
              className="text-[12px] font-medium text-[#087CFF] hover:text-[#0066D6] transition flex items-center gap-1"
            >
              Xem tất cả
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[#647293] text-[12px] font-medium border-b border-[#DCE5FF]">
                  <th className="pb-2.5 font-medium text-left w-16">Mã</th>
                  <th className="pb-2.5 font-medium text-right">Giá</th>
                  <th className="pb-2.5 font-medium text-right">+/-</th>
                  <th className="pb-2.5 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF]">
                {topLosers.slice(0, 5).map((stock) => (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition h-[38px]"
                  >
                    <td className="py-2.5 font-semibold text-[#087CFF] text-left">
                      {stock.symbol}
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#172554] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#EF4444] font-mono tabular-nums">
                      {stock.change.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#EF4444] font-mono tabular-nums">
                      {stock.changePercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {topLosers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#647293] text-xs">
                      Không có dữ liệu cổ phiếu giảm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Chỉ số Thị trường */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4F7FF]">
            <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Chỉ số thị trường</h4>
            <button 
              onClick={onViewAllStocks}
              className="text-[12px] font-medium text-[#087CFF] hover:text-[#0066D6] transition flex items-center gap-1"
            >
              Xem chi tiết
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[#647293] text-[12px] font-medium border-b border-[#DCE5FF]">
                  <th className="pb-2.5 font-medium text-left">Chỉ số</th>
                  <th className="pb-2.5 font-medium text-right">Điểm</th>
                  <th className="pb-2.5 font-medium text-right">+/-</th>
                  <th className="pb-2.5 font-medium text-right">%</th>
                  <th className="pb-2.5 font-medium text-center w-14">Đồ thị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF]">
                {indices.map((idx) => {
                  const isUp = idx.change >= 0;
                  return (
                    <tr key={idx.symbol} className="hover:bg-[#F8FAFC] transition h-[38px]">
                      <td className="py-2.5 font-semibold text-[#172554] text-left">
                        {idx.symbol}
                      </td>
                      <td className="py-2.5 text-right font-medium text-[#172554] font-mono tabular-nums">
                        {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 text-right font-semibold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{idx.change.toFixed(2)}
                      </td>
                      <td className={`py-2.5 text-right font-bold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-center">
                        <svg className="w-12 h-4 inline-block align-middle" viewBox="0 0 60 20">
                          <polyline
                            fill="none"
                            stroke={isUp ? '#16A34A' : '#EF4444'}
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
    </div>
  );
}

