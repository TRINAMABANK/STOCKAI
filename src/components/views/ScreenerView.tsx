'use client';

import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Star, 
  Search, 
  Sliders, 
  TrendingUp, 
  Sparkles,
  Flame,
  Zap,
  Anchor,
  Layers,
  ArrowRight,
  TrendingDown,
  BarChart2,
  Compass,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { StockQuote, SubscriptionTier } from '@/types';

interface ScreenerViewProps {
  quotes: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
  userTier?: SubscriptionTier;
  onOpenSubscription?: () => void;
}

export type ScreenerPreset = 
  | 'ALL' 
  | 'SUPER_STOCKS' 
  | 'MARKET_LEADERS' 
  | 'MONEY_FLOW' 
  | 'GROWTH_FUND' 
  | 'VOL_SQUEEZE' 
  | 'DIVERGENCE' 
  | 'BOTTOM_FISHING' 
  | 'TIGHT_BASE';

export default function ScreenerView({
  quotes,
  onSelectStock,
  onAddToWatchlist,
  userTier = 'PRO',
  onOpenSubscription,
}: ScreenerViewProps) {
  const [selectedPreset, setSelectedPreset] = useState<ScreenerPreset>('SUPER_STOCKS');
  const [selectedExchange, setSelectedExchange] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [minRoe, setMinRoe] = useState('10');
  const [maxPe, setMaxPe] = useState('35');
  const [minRsi, setMinRsi] = useState('30');
  const [maxRsi, setMaxRsi] = useState('80');
  const [minVolume, setMinVolume] = useState('500000');
  const [searchTerm, setSearchTerm] = useState('');

  const industries = [
    'ALL',
    'Ngân hàng',
    'Chứng khoán',
    'Bất động sản',
    'Thép & Vật liệu',
    'Công nghệ',
    'Bán lẻ',
    'Dầu khí',
    'Hóa chất',
    'Thực phẩm'
  ];

  // Tính toán các chỉ số định lượng mở rộng và gắn thẻ chiến lược
  const enhancedQuotes = useMemo(() => {
    return quotes.map((q) => {
      let score = 50;
      const tags: { label: string; color: string }[] = [];
      const reasons: string[] = [];

      // 1. Đà tăng giá & thanh khoản
      if (q.changePercent >= 3.0) {
        score += 18;
        reasons.push('Bứt phá mạnh >3%');
      } else if (q.changePercent > 0.5) {
        score += 8;
        reasons.push('Tăng giá tích cực');
      } else if (q.changePercent < -3.0) {
        score -= 10;
      }

      if (q.volume >= 3000000) {
        score += 15;
        reasons.push('Dòng tiền lớn (>3M cp)');
      } else if (q.volume >= 1000000) {
        score += 8;
      }

      // 2. Điểm RS ước tính (0-99)
      const rsi = q.rsi || 50;
      const rsScore = Math.min(99, Math.max(10, Math.round(rsi * 0.9 + (q.changePercent > 0 ? q.changePercent * 3 : 0))));

      // 3. Phân loại chiến lược DNSE v9.28 Parity
      // A. Siêu cổ phiếu (Super Stock): RS >= 80, tăng giá, thanh khoản tốt
      const isSuperStock = rsScore >= 78 && q.changePercent >= 0.5 && q.volume >= 1000000;
      if (isSuperStock) {
        tags.push({ label: 'Siêu Cổ', color: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' });
      }

      // B. Dẫn dắt thị trường (Market Leader): Siêu cổ + tăng vượt trội > 2.5%
      const isLeader = isSuperStock && q.changePercent >= 2.5;
      if (isLeader) {
        tags.push({ label: 'Dẫn Dắt', color: 'bg-[#EBF3FF] text-[#087CFF] border-[#DCE5FF]' });
      }

      // C. Dòng tiền gom (Money Flow): RSI 50-65, vol lớn, nến xanh
      const isMoneyFlow = rsi >= 50 && rsi <= 65 && q.volume >= 2000000 && q.changePercent > 0;
      if (isMoneyFlow) {
        tags.push({ label: 'Dòng Tiền', color: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' });
      }

      // D. Cơ bản tăng trưởng (CANSLIM): ROE >= 16% + PE <= 22
      const isGrowthFund = (q.roe || 0) >= 16 && (q.pe || 99) <= 22;
      if (isGrowthFund) {
        tags.push({ label: 'Tăng Trưởng', color: 'bg-[#F3E8FF] text-[#8B36FF] border-[#E9D5FF]' });
      }

      // E. Nén biến động (Volatility Squeeze): biên độ hẹp -1.2% -> +1.2%, RSI cân bằng
      const isSqueeze = Math.abs(q.changePercent) <= 1.2 && rsi >= 48 && rsi <= 56;
      if (isSqueeze) {
        tags.push({ label: 'Nén Biến Động', color: 'bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4]' });
      }

      // F. Phân kỳ / Đảo chiều (Divergence / Reversal)
      const isDivergence = rsi <= 35 || rsi >= 72;
      if (isDivergence) {
        tags.push({ label: rsi <= 35 ? 'Phân Kỳ Dương' : 'Cảnh Báo Đỉnh', color: rsi <= 35 ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' });
      }

      // G. Bắt đáy (Bottom Fishing): RSI <= 36, nến hôm nay xanh hồi phục
      const isBottomFishing = rsi <= 36 && q.changePercent >= 1.0;
      if (isBottomFishing) {
        tags.push({ label: 'Bắt Đáy', color: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]' });
      }

      // H. Nền chặt gần đỉnh (Tight Base)
      const isTightBase = Math.abs(q.changePercent) <= 1.5 && rsScore >= 70;
      if (isTightBase) {
        tags.push({ label: 'Nền Chặt', color: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]' });
      }

      // Điểm vào lệnh & Cắt lỗ / Chốt lời tham khảo
      const entryPoint1 = Math.round(q.price * 0.985);
      const entryPoint2 = Math.round(q.price * 1.01);
      const stopLoss = Math.round(q.price * 0.93);
      const target1 = Math.round(q.price * 1.08);

      const finalScore = Math.min(98, Math.max(45, score));

      return {
        ...q,
        quantScore: finalScore,
        rsScore,
        tags,
        isSuperStock,
        isLeader,
        isMoneyFlow,
        isGrowthFund,
        isSqueeze,
        isDivergence,
        isBottomFishing,
        isTightBase,
        entryPoint1,
        entryPoint2,
        stopLoss,
        target1,
        selectionReason: reasons.slice(0, 2).join(' • ') || 'Đạt tiêu chuẩn kỹ thuật',
      };
    });
  }, [quotes]);

  // Đếm số lượng mã cho từng preset tab
  const presetCounts = useMemo(() => {
    return {
      ALL: enhancedQuotes.length,
      SUPER_STOCKS: enhancedQuotes.filter(q => q.isSuperStock).length,
      MARKET_LEADERS: enhancedQuotes.filter(q => q.isLeader).length,
      MONEY_FLOW: enhancedQuotes.filter(q => q.isMoneyFlow).length,
      GROWTH_FUND: enhancedQuotes.filter(q => q.isGrowthFund).length,
      VOL_SQUEEZE: enhancedQuotes.filter(q => q.isSqueeze).length,
      DIVERGENCE: enhancedQuotes.filter(q => q.isDivergence).length,
      BOTTOM_FISHING: enhancedQuotes.filter(q => q.isBottomFishing).length,
      TIGHT_BASE: enhancedQuotes.filter(q => q.isTightBase).length,
    };
  }, [enhancedQuotes]);

  // Bộ lọc kết hợp preset và manual criteria
  const filtered = useMemo(() => {
    return enhancedQuotes
      .filter((q) => {
        // Lọc theo preset
        if (selectedPreset === 'SUPER_STOCKS' && !q.isSuperStock) return false;
        if (selectedPreset === 'MARKET_LEADERS' && !q.isLeader) return false;
        if (selectedPreset === 'MONEY_FLOW' && !q.isMoneyFlow) return false;
        if (selectedPreset === 'GROWTH_FUND' && !q.isGrowthFund) return false;
        if (selectedPreset === 'VOL_SQUEEZE' && !q.isSqueeze) return false;
        if (selectedPreset === 'DIVERGENCE' && !q.isDivergence) return false;
        if (selectedPreset === 'BOTTOM_FISHING' && !q.isBottomFishing) return false;
        if (selectedPreset === 'TIGHT_BASE' && !q.isTightBase) return false;

        // Lọc theo sàn và ngành
        if (selectedExchange !== 'ALL' && q.exchange !== selectedExchange) return false;
        if (selectedIndustry !== 'ALL' && !q.industry.toLowerCase().includes(selectedIndustry.toLowerCase())) return false;

        // Lọc theo chỉ số
        if (q.roe && q.roe < Number(minRoe)) return false;
        if (q.pe && q.pe > Number(maxPe)) return false;
        if (q.rsi && (q.rsi < Number(minRsi) || q.rsi > Number(maxRsi))) return false;
        if (q.volume < Number(minVolume)) return false;

        // Lọc tìm kiếm
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          if (!q.symbol.toLowerCase().includes(s) && !q.companyName.toLowerCase().includes(s)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.quantScore - a.quantScore);
  }, [enhancedQuotes, selectedPreset, selectedExchange, selectedIndustry, minRoe, maxPe, minRsi, maxRsi, minVolume, searchTerm]);

  const isFreeTier = userTier === 'FREE';
  const displayedQuotes = isFreeTier ? filtered.slice(0, 5) : filtered;

  const presetTabs: { id: ScreenerPreset; label: string; icon: any }[] = [
    { id: 'SUPER_STOCKS', label: 'Siêu Cổ Phiếu', icon: Flame },
    { id: 'MARKET_LEADERS', label: 'Dẫn Dắt Thị Trường', icon: TrendingUp },
    { id: 'MONEY_FLOW', label: 'Dòng Tiền Vào', icon: Zap },
    { id: 'GROWTH_FUND', label: 'LN Tăng Tốc', icon: Sparkles },
    { id: 'VOL_SQUEEZE', label: 'Nén Biến Động', icon: Layers },
    { id: 'DIVERGENCE', label: 'Phân Kỳ Đảo Chiều', icon: Compass },
    { id: 'BOTTOM_FISHING', label: 'Bắt Đáy Chuẩn', icon: Anchor },
    { id: 'TIGHT_BASE', label: 'Nền Chặt Gần Đỉnh', icon: BarChart2 },
    { id: 'ALL', label: 'Tất Cả', icon: Filter },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
              Bộ Quét Cổ Phiếu Định Lượng & Chiến Lược
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF]">
              DNSE v9.28 Parity
            </span>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Sàng lọc đa chiều theo Siêu cổ phiếu, Điểm mua Thăm dò ① / Gia tăng ②, Nén biến động và Bắt đáy chuẩn mực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DCE5FF] text-[#172554] font-bold shadow-2xs font-mono">
            {filtered.length} mã thỏa mãn điều kiện
          </span>
        </div>
      </div>

      {/* Preset Strategy Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presetTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedPreset === tab.id;
          const count = presetCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedPreset(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#101B4B] text-white border-[#101B4B] shadow-sm'
                  : 'bg-[#FFFFFF] text-[#647293] border-[#DCE5FF] hover:border-[#087CFF] hover:text-[#087CFF]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#087CFF]' : 'text-[#647293]'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-[#087CFF] text-white'
                    : count > 0
                    ? 'bg-[#EBF3FF] text-[#087CFF]'
                    : 'bg-[#F4F7FF] text-[#647293]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Control Box */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172554] uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#087CFF]" />
            <span>Tiêu chí tinh chỉnh bộ lọc</span>
          </div>

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
              <option value="300000">&gt; 300.000 cp/phiên</option>
              <option value="500000">&gt; 500.000 cp/phiên</option>
              <option value="1000000">&gt; 1.000.000 cp/phiên</option>
              <option value="3000000">&gt; 3.000.000 cp/phiên</option>
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

      {/* Free Tier Upgrade Banner */}
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
                Tài khoản Miễn Phí đang hiển thị top 5 mã. Nâng cấp Pro để xem đầy đủ kèm điểm vào lệnh chi tiết và AI phân tích.
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
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] font-semibold border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã CP / Sàn</th>
                <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Chiến lược / Tag</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">RS / Quant</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Giá khớp</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">%</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Vùng mua gợi ý</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Cắt lỗ / Mục tiêu</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF]">
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#647293]">
                    Không có cổ phiếu nào thỏa mãn tiêu chí bộ lọc này. Hãy chọn tab "Tất Cả" hoặc nới lỏng các tham số.
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((stock, idx) => {
                  const isUp = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#F8FAFC] transition h-[48px]">
                      {/* Symbol & Exchange */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onAddToWatchlist(stock.symbol)}
                            className="text-[#647293] hover:text-[#D97706] transition"
                            title="Thêm vào danh sách theo dõi"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <button
                              onClick={() => onSelectStock(stock.symbol)}
                              className="font-bold text-sm text-[#087CFF] hover:underline"
                            >
                              {stock.symbol}
                            </button>
                            <span className="text-[10px] text-[#647293] ml-1.5 px-1.5 py-0.2 rounded bg-[#F4F7FF]">
                              {stock.exchange}
                            </span>
                            <div className="text-[10px] text-[#647293] truncate max-w-[130px]">
                              {stock.companyName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Strategy Tags */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {stock.tags.length > 0 ? (
                            stock.tags.map((t, ti) => (
                              <span
                                key={ti}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${t.color}`}
                              >
                                {t.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#647293] px-1.5 py-0.5 rounded bg-[#F4F7FF]">
                              Theo dõi
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RS / Quant Score */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-[#172554] font-mono">
                            RS {stock.rsScore}
                          </span>
                          <span className="text-[10px] text-[#087CFF] font-medium">
                            Score {stock.quantScore}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono font-bold text-sm ${isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {(stock.price / 1000).toFixed(2)}k
                        </span>
                      </td>

                      {/* % Change */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          isUp ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                        }`}>
                          {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap font-mono text-xs text-[#172554]">
                        {stock.volume.toLocaleString('vi-VN')}
                      </td>

                      {/* Suggested Buy Zone */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                        <span className="text-[#087CFF] font-bold">
                          ① {(stock.entryPoint1 / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[#647293] mx-1">·</span>
                        <span className="text-[#8B36FF] font-bold">
                          ② {(stock.entryPoint2 / 1000).toFixed(1)}k
                        </span>
                      </td>

                      {/* Stop Loss / Target */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                        <span className="text-[#DC2626]">
                          -{(stock.stopLoss / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[#647293] mx-1">/</span>
                        <span className="text-[#16A34A] font-bold">
                          +{(stock.target1 / 1000).toFixed(1)}k
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectStock(stock.symbol)}
                            className="px-2.5 py-1 text-xs font-bold text-[#087CFF] hover:bg-[#EBF3FF] rounded-lg transition"
                          >
                            Chi tiết
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
