'use client';

import React, { useState } from 'react';
import { Filter, Star, CheckCircle, Search, Sliders, ArrowUpDown, Bookmark } from 'lucide-react';
import { StockQuote } from '@/types';

interface ScreenerViewProps {
  quotes: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
}

export default function ScreenerView({
  quotes,
  onSelectStock,
  onAddToWatchlist,
}: ScreenerViewProps) {
  const [selectedExchange, setSelectedExchange] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [minRoe, setMinRoe] = useState('12');
  const [maxPe, setMaxPe] = useState('30');
  const [minRsi, setMinRsi] = useState('45');
  const [maxRsi, setMaxRsi] = useState('70');
  const [minVolume, setMinVolume] = useState('3000000');

  const industries = ['ALL', 'Công nghệ', 'Ngân hàng', 'Thép', 'Bất động sản', 'Chứng khoán', 'Bán lẻ', 'Hóa chất'];

  // Lọc theo đa tiêu chí
  const filtered = quotes.filter(q => {
    if (selectedExchange !== 'ALL' && q.exchange !== selectedExchange) return false;
    if (selectedIndustry !== 'ALL' && !q.industry.toLowerCase().includes(selectedIndustry.toLowerCase())) return false;
    if (q.roe && q.roe < Number(minRoe)) return false;
    if (q.pe && q.pe > Number(maxPe)) return false;
    if (q.rsi && (q.rsi < Number(minRsi) || q.rsi > Number(maxRsi))) return false;
    if (q.volume < Number(minVolume)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bộ lọc cổ phiếu tiềm năng (Stock Screener)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sàng lọc đa chiều kết hợp Cơ bản (P/E, ROE) và Kỹ thuật (RSI, Khối lượng)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {filtered.length} mã thỏa điều kiện
          </span>
        </div>
      </div>

      {/* Filter Criteria Cards */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>Tiêu chí sàng lọc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Sàn giao dịch</label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả sàn</option>
              <option value="HOSE">HOSE</option>
              <option value="HNX">HNX</option>
              <option value="UPCOM">UPCoM</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Nhóm ngành</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
            >
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind === 'ALL' ? 'Tất cả ngành' : ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">ROE tối thiểu (%): {minRoe}%</label>
            <input 
              type="range" 
              min="5" 
              max="25" 
              value={minRoe} 
              onChange={(e) => setMinRoe(e.target.value)} 
              className="w-full accent-emerald-600" 
            />
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">P/E tối đa: {maxPe}x</label>
            <input 
              type="range" 
              min="10" 
              max="40" 
              value={maxPe} 
              onChange={(e) => setMaxPe(e.target.value)} 
              className="w-full accent-emerald-600" 
            />
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">RSI(14) từ: {minRsi} - {maxRsi}</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={minRsi} 
                onChange={(e) => setMinRsi(e.target.value)} 
                className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold" 
              />
              <span>đến</span>
              <input 
                type="number" 
                value={maxRsi} 
                onChange={(e) => setMaxRsi(e.target.value)} 
                className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold" 
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Khối lượng tối thiểu</label>
            <select
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
            >
              <option value="1000000">&gt; 1 triệu cp/phiên</option>
              <option value="3000000">&gt; 3 triệu cp/phiên</option>
              <option value="5000000">&gt; 5 triệu cp/phiên</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold">Ngành</th>
                <th className="py-3 px-4 font-semibold text-right">Giá</th>
                <th className="py-3 px-4 font-semibold text-right">%</th>
                <th className="py-3 px-4 font-semibold text-right">Khối lượng</th>
                <th className="py-3 px-4 font-semibold text-right">ROE (%)</th>
                <th className="py-3 px-4 font-semibold text-right">P/E (x)</th>
                <th className="py-3 px-4 font-semibold text-center">RSI</th>
                <th className="py-3 px-4 font-semibold text-center">Đánh giá</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-blue-600 cursor-pointer" onClick={() => onSelectStock(stock.symbol)}>
                    {stock.symbol}
                    <span className="block text-[10px] text-slate-400 font-normal">{stock.companyName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{stock.industry}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{stock.price.toLocaleString('vi-VN')}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{stock.volume.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">{stock.roe || '-'}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">{stock.pe || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                      {stock.rsi || 50}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ĐẠT TIÊU CHUẨN
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onAddToWatchlist(stock.symbol)}
                      className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200 transition"
                    >
                      Theo dõi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
