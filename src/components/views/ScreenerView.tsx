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
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Bộ lọc cổ phiếu tiềm năng (Stock Screener)</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Sàng lọc đa chiều kết hợp Cơ bản (P/E, ROE) và Kỹ thuật (RSI, Khối lượng)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] font-bold">
            {filtered.length} mã thỏa điều kiện
          </span>
        </div>
      </div>

      {/* Filter Criteria Cards */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
          <Sliders className="w-4 h-4 text-[#008FD3]" />
          <span>Tiêu chí sàng lọc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[#64748B] font-medium block mb-1">Sàn giao dịch</label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]"
            >
              <option value="ALL">Tất cả sàn</option>
              <option value="HOSE">HOSE</option>
              <option value="HNX">HNX</option>
              <option value="UPCOM">UPCoM</option>
            </select>
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">Nhóm ngành</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]"
            >
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind === 'ALL' ? 'Tất cả ngành' : ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">ROE tối thiểu (%): <strong className="text-[#10B981]">{minRoe}%</strong></label>
            <input 
              type="range" 
              min="5" 
              max="25" 
              value={minRoe} 
              onChange={(e) => setMinRoe(e.target.value)} 
              className="w-full accent-[#008FD3]" 
            />
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">P/E tối đa: <strong className="text-[#008FD3]">{maxPe}x</strong></label>
            <input 
              type="range" 
              min="10" 
              max="40" 
              value={maxPe} 
              onChange={(e) => setMaxPe(e.target.value)} 
              className="w-full accent-[#008FD3]" 
            />
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">RSI(14) từ: {minRsi} - {maxRsi}</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={minRsi} 
                onChange={(e) => setMinRsi(e.target.value)} 
                className="w-16 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg p-1 text-center font-bold text-[#172033]" 
              />
              <span className="text-[#64748B]">đến</span>
              <input 
                type="number" 
                value={maxRsi} 
                onChange={(e) => setMaxRsi(e.target.value)} 
                className="w-16 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg p-1 text-center font-bold text-[#172033]" 
              />
            </div>
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">Khối lượng tối thiểu</label>
            <select
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033]"
            >
              <option value="1000000">&gt; 1 triệu cp/phiên</option>
              <option value="3000000">&gt; 3 triệu cp/phiên</option>
              <option value="5000000">&gt; 5 triệu cp/phiên</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
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
            <tbody className="divide-y divide-[#F1F5F9] font-medium">
              {filtered.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-[#F5F8FC] transition">
                  <td className="py-3 px-4 font-bold text-[#008FD3] cursor-pointer" onClick={() => onSelectStock(stock.symbol)}>
                    {stock.symbol}
                    <span className="block text-[10px] text-[#64748B] font-normal">{stock.companyName}</span>
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">{stock.industry}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#172033] font-mono">{stock.price.toLocaleString('vi-VN')}</td>
                  <td className={`py-3 px-4 text-right font-bold font-mono ${stock.change >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#64748B]">{stock.volume.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#10B981] font-mono">{stock.roe || '-'}%</td>
                  <td className="py-3 px-4 text-right font-mono text-[#172033]">{stock.pe || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F8FC] border border-[#E2E8F0] font-bold text-[#172033] text-[11px]">
                      {stock.rsi || 50}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-[10px]">
                      ĐẠT TIÊU CHUẨN
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onAddToWatchlist(stock.symbol)}
                      className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#008FD3] hover:bg-[#BAE6FD] font-semibold text-[11px] transition"
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
