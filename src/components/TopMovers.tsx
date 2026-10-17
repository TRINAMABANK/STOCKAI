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
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-slate-800">Top cổ phiếu tăng</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Mã</th>
                <th className="pb-2 font-medium text-right">Giá</th>
                <th className="pb-2 font-medium text-right">+/-</th>
                <th className="pb-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {topGainers.map((stock) => (
                <tr 
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-2.5 font-bold text-blue-600">{stock.symbol}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">
                    {stock.price.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-medium text-emerald-600">
                    +{stock.change.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-bold text-emerald-600">
                    +{stock.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Top Cổ phiếu Giảm */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-slate-800">Top cổ phiếu giảm</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Mã</th>
                <th className="pb-2 font-medium text-right">Giá</th>
                <th className="pb-2 font-medium text-right">+/-</th>
                <th className="pb-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {topLosers.map((stock) => (
                <tr 
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-2.5 font-bold text-blue-600">{stock.symbol}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">
                    {stock.price.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-medium text-rose-600">
                    {stock.change.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right font-bold text-rose-600">
                    {stock.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Chỉ số Thị trường */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-slate-800">Chỉ số thị trường</h4>
          <button 
            onClick={onViewAllStocks}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem chi tiết
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Tên</th>
                <th className="pb-2 font-medium text-right">Giá trị</th>
                <th className="pb-2 font-medium text-right">+/-</th>
                <th className="pb-2 font-medium text-center">Đồ thị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {indices.map((idx) => {
                const isUp = idx.change >= 0;
                return (
                  <tr key={idx.symbol} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 font-bold text-slate-800">{idx.symbol}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {/* Mini sparkline SVG */}
                      <svg className="w-16 h-5 inline-block" viewBox="0 0 60 20">
                        <polyline
                          fill="none"
                          stroke={isUp ? '#10b981' : '#ef4444'}
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
