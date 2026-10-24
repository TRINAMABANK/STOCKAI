'use client';

import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Star, 
  CheckCircle, 
  Search, 
  Sliders, 
  ArrowUpDown, 
  Bookmark, 
  Zap, 
  TrendingUp, 
  LineChart, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StockQuote, SubscriptionTier } from '@/types';

interface ScreenerViewProps {
  quotes: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
  userTier?: SubscriptionTier;
  onOpenSubscription?: () => void;
}

export default function ScreenerView({
  quotes,
  onSelectStock,
  onAddToWatchlist,
  userTier = 'PRO',
  onOpenSubscription,
}: ScreenerViewProps) {
  const [selectedExchange, setSelectedExchange] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState<'ALL' | 'UPTREND' | 'SIDEWAY' | 'PULLBACK'>('ALL');
  const [macdFilter, setMacdFilter] = useState<'ALL' | 'BULLISH' | 'CROSS_UP'>('ALL');
  const [minRoe, setMinRoe] = useState('10');
  const [maxPe, setMaxPe] = useState('35');
  const [minRsi, setMinRsi] = useState('40');
  const [maxRsi, setMaxRsi] = useState('75');
  const [minVolume, setMinVolume] = useState('1000000');
  const [searchTerm, setSearchTerm] = useState('');

  const industries = [
    'ALL',
    'Công nghệ',
    'Ngân hàng',
    'Thép',
    'Bất động sản',
    'Chứng khoán',
    'Bán lẻ',
    'Dầu khí',
    'Hóa chất',
    'Thực phẩm'
  ];

  // Thuật toán chấm điểm định lượng (Quant Score 0-100) và lý do lựa chọn
  const scoredQuotes = useMemo(() => {
    return quotes.map((q) => {
      let score = 50; // base score
      const reasons: string[] = [];

      // 1. Xu hướng và giá
      if (q.changePercent > 3.0) {
        score += 15;
        reasons.push('Đà tăng giá bứt phá mạnh mẽ (>3%)');
      } else if (q.changePercent > 0.5) {
        score += 8;
        reasons.push('Duy trì sắc xanh tích cực');
      }

      // 2. Thanh khoản
      if (q.volume > 5000000) {
        score += 15;
        reasons.push('Dòng tiền lớn (>5M cp/phiên)');
      } else if (q.volume > 2000000) {
        score += 8;
        reasons.push('Thanh khoản dồi dào');
      }

      // 3. RSI
      const rsi = q.rsi || 50;
      if (rsi >= 50 && rsi <= 65) {
        score += 12;
        reasons.push('RSI vùng tích lũy tăng trưởng (50-65)');
      } else if (rsi < 35) {
        score += 10;
        reasons.push('RSI chạm vùng quá bán phục hồi');
      }

      // 4. Cơ bản
      if ((q.roe || 0) >= 18) {
        score += 10;
        reasons.push('ROE chất lượng cao (>18%)');
      }

      score = Math.min(98, Math.max(45, score));

      return {
        ...q,
        quantScore: score,
        selectionReason: reasons.slice(0, 2).join(' • ') || 'Đạt tiêu chuẩn kỹ thuật',
        trendStatus: q.changePercent > 0 ? 'Uptrend' : 'Sideway',
      };
    });
  }, [quotes]);

  // Bộ lọc
  const filtered = useMemo(() => {
    return scoredQuotes
      .filter((q) => {
        if (selectedExchange !== 'ALL' && q.exchange !== selectedExchange) return false;
        if (selectedIndustry !== 'ALL' && !q.industry.toLowerCase().includes(selectedIndustry.toLowerCase())) return false;
        if (q.roe && q.roe < Number(minRoe)) return false;
        if (q.pe && q.pe > Number(maxPe)) return false;
        if (q.rsi && (q.rsi < Number(minRsi) || q.rsi > Number(maxRsi))) return false;
        if (q.volume < Number(minVolume)) return false;
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          if (!q.symbol.toLowerCase().includes(s) && !q.companyName.toLowerCase().includes(s)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.quantScore - a.quantScore);
  }, [scoredQuotes, selectedExchange, selectedIndustry, minRoe, maxPe, minRsi, maxRsi, minVolume, searchTerm]);

  // Giới hạn hiển thị nếu gói Free
  const isFreeTier = userTier === 'FREE';
  const displayedQuotes = isFreeTier ? filtered.slice(0, 5) : filtered;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
              Bộ quét cổ phiếu định lượng (Quant Screener)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF]">
              Multi-Factor Engine
            </span>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Sàng lọc đa chiều kết hợp Xu hướng, Thanh khoản, RSI, MACD và Xếp hạng điểm định lượng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DCE5FF] text-[#172554] font-bold shadow-2xs font-mono">
            {filtered.length} mã thỏa mãn điều kiện
          </span>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172554] uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#087CFF]" />
            <span>Tiêu chí sàng lọc nâng cao</span>
          </div>

          {/* Quick search input inside screener */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#647293] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã hoặc tên công ty..."
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#172554] placeholder-[#647293] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Exchange */}
          <div>
            <label className="text-[#647293] font-medium block mb-1">Sàn niêm yết</label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554] focus:outline-none"
            >
              <option value="ALL">Tất cả sàn (HOSE, HNX, UPCoM)</option>
              <option value="HOSE">HOSE (TP. Hồ Chí Minh)</option>
              <option value="HNX">HNX (Hà Nội)</option>
              <option value="UPCOM">UPCoM</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="text-[#647293] font-medium block mb-1">Nhóm ngành nghề</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554] focus:outline-none"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind === 'ALL' ? 'Tất cả nhóm ngành' : ind}
                </option>
              ))}
            </select>
          </div>

          {/* Liquidity */}
          <div>
            <label className="text-[#647293] font-medium block mb-1">Thanh khoản tối thiểu</label>
            <select
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2 font-bold text-[#172554] focus:outline-none"
            >
              <option value="500000">&gt; 500.000 cp/phiên</option>
              <option value="1000000">&gt; 1.000.000 cp/phiên</option>
              <option value="3000000">&gt; 3.000.000 cp/phiên</option>
              <option value="5000000">&gt; 5.000.000 cp/phiên</option>
            </select>
          </div>

          {/* RSI Range */}
          <div>
            <label className="text-[#647293] font-medium block mb-1">Dải RSI(14): {minRsi} - {maxRsi}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minRsi}
                onChange={(e) => setMinRsi(e.target.value)}
                className="w-16 bg-[#F4F7FF] border border-[#DCE5FF] rounded-lg p-1 text-center font-bold text-[#172554]"
              />
              <span className="text-[#647293]">đến</span>
              <input
                type="number"
                value={maxRsi}
                onChange={(e) => setMaxRsi(e.target.value)}
                className="w-16 bg-[#F4F7FF] border border-[#DCE5FF] rounded-lg p-1 text-center font-bold text-[#172554]"
              />
            </div>
          </div>
        </div>

        {/* Secondary Row: Fundamentals ROE and PE sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#DCE5FF] text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#647293] font-medium">ROE tối thiểu (%):</span>
              <strong className="text-[#16A34A] font-mono">{minRoe}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={minRoe}
              onChange={(e) => setMinRoe(e.target.value)}
              className="w-full accent-[#087CFF]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#647293] font-medium">P/E tối đa:</span>
              <strong className="text-[#087CFF] font-mono">{maxPe}x</strong>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              value={maxPe}
              onChange={(e) => setMaxPe(e.target.value)}
              className="w-full accent-[#087CFF]"
            />
          </div>
        </div>
      </div>

      {/* Free Tier Upgrade Banner if filtered has more than 5 results */}
      {isFreeTier && filtered.length > 5 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#087CFF]/10 to-[#8B36FF]/10 border border-[#DCE5FF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#087CFF] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#172554]">
                Khám phá toàn bộ {filtered.length} cổ phiếu tiềm năng với gói Pro
              </h4>
              <p className="text-xs text-[#647293]">
                Tài khoản Miễn Phí đang hiển thị top 5 mã xếp hạng cao nhất. Nâng cấp Pro để xem đầy đủ kèm điểm vào lệnh chi tiết.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSubscription}
            className="px-4 py-2 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Nâng cấp Pro ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11pt]">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] text-[11pt] font-semibold border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Hạng / Mã CP</th>
                <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Ngành</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Điểm Quant</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Giá khớp</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">%</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">RSI</th>
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Lý do chọn cổ phiếu</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF] text-[11pt]">
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#647293] text-[11pt]">
                    Không có cổ phiếu nào thỏa mãn toàn bộ tiêu chí lọc hiện tại. Hãy nới rộng khoảng lọc RSI hoặc khối lượng.
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((stock, idx) => {
                  const isUp = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#F8FAFC] transition h-[44px]">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 
                              ? 'bg-[#FEF3C7] text-[#D97706]' 
                              : idx === 1 
                              ? 'bg-[#F4F7FF] text-[#647293]' 
                              : idx === 2 
                              ? 'bg-[#FFEDD5] text-[#C2410C]' 
                              : 'text-[#94A3B8]'
                          }`}>
                            {idx + 1}
                          </span>
                          <div 
                            className="cursor-pointer hover:underline"
                            onClick={() => onSelectStock(stock.symbol)}
                          >
                            <span className="font-bold text-[#087CFF] text-[11pt]">{stock.symbol}</span>
                            <span className="text-[11pt] ml-1.5 px-1.5 py-0.2 rounded bg-[#F4F7FF] text-[#647293] font-semibold border border-[#DCE5FF]">
                              {stock.exchange}
                            </span>
                            <span className="block text-[11pt] text-[#647293] font-normal truncate max-w-[150px]">
                              {stock.companyName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[#647293] text-[11pt] font-medium whitespace-nowrap">{stock.industry}</td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] font-bold text-[11pt] font-mono tabular-nums">
                          {stock.quantScore}/100
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-bold text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">
                        {stock.price.toLocaleString('vi-VN')}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-bold font-mono tabular-nums text-[11pt] whitespace-nowrap ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#647293] text-[11pt] whitespace-nowrap">
                        {stock.volume.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[11pt] font-mono tabular-nums border ${
                          (stock.rsi || 50) > 70 
                            ? 'bg-[#FEE2E2] text-[#EF4444] border-[#FEE2E2]'
                            : (stock.rsi || 50) < 35 
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#F4F7FF] text-[#172554] border-[#DCE5FF]'
                        }`}>
                          {stock.rsi || 50}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-left whitespace-nowrap">
                        <span className="text-[11pt] font-medium text-[#172554] line-clamp-1">
                          {stock.selectionReason}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectStock(stock.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-[#EBF3FF] hover:bg-[#DCE5FF] text-[#087CFF] font-semibold text-[11pt] transition shadow-2xs"
                          >
                            Phân tích
                          </button>
                          <button
                            onClick={() => onAddToWatchlist(stock.symbol)}
                            className="p-1 rounded-lg text-[#647293] hover:text-[#087CFF] hover:bg-[#F4F7FF] transition"
                            title="Thêm vào danh sách theo dõi"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
