'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Radio, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Bookmark, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { MarketIndex, StockQuote, T3Signal } from '@/types';

interface MarketDashboardViewProps {
  indices: MarketIndex[];
  quotes: StockQuote[];
  t3Signals?: T3Signal[];
  onSelectStock: (symbol: string) => void;
  onViewScreener: () => void;
  onViewWatchlist: () => void;
  onViewT3Radar: () => void;
  dataSource?: string;
  lastUpdated?: string;
}

export default function MarketDashboardView({
  indices = [],
  quotes = [],
  t3Signals = [],
  onSelectStock,
  onViewScreener,
  onViewWatchlist,
  onViewT3Radar,
  dataSource = 'Vietstock Financial API & SSI FastConnect',
  lastUpdated = '14:35:22',
}: MarketDashboardViewProps) {
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');

  // Tính toán độ rộng thị trường (Market Breadth)
  const breadth = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;
    let totalLiquidityVnd = 0;
    let totalVolumeShares = 0;

    quotes.forEach((q) => {
      totalLiquidityVnd += q.value || (q.price * q.volume);
      totalVolumeShares += q.volume || 0;
      if (q.change > 0) gainers++;
      else if (q.change < 0) losers++;
      else unchanged++;
    });

    const total = gainers + losers + unchanged || 1;
    const gainerPercent = Math.round((gainers / total) * 100);
    const loserPercent = Math.round((losers / total) * 100);
    const unchangedPercent = 100 - gainerPercent - loserPercent;

    return {
      gainers,
      losers,
      unchanged,
      total,
      gainerPercent,
      loserPercent,
      unchangedPercent,
      totalLiquidityBillion: (totalLiquidityVnd / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }),
      totalVolumeMillion: (totalVolumeShares / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }),
    };
  }, [quotes]);

  // Top gainers and losers
  const topGainers = useMemo(() => {
    return [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  }, [quotes]);

  const topLosers = useMemo(() => {
    return [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  }, [quotes]);

  // Cổ phiếu tiêu biểu trong Watchlist
  const featuredWatchlist = useMemo(() => {
    return quotes.slice(0, 5);
  }, [quotes]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Data Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE5FF] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
              Dashboard thị trường Việt Nam
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#00A991] border border-[#99F6E4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A991] animate-pulse"></span>
              REALTIME
            </span>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Diễn biến chỉ số sàn HOSE, HNX, UPCoM, độ rộng cung cầu và dòng tiền ngắn hạn
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[#647293]">
            <Radio className="w-3.5 h-3.5 text-[#087CFF]" />
            <span>Nguồn: <strong className="text-[#172554]">{dataSource}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[#647293]">
            <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="font-mono tabular-nums">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Major Market Indices Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx, index) => {
          const isUp = idx.change >= 0;
          const gradientClass = [
            'from-[#7C3CFF] to-[#087CFF]',
            'from-[#8B36FF] to-[#EF4CBF]',
            'from-[#F59E0B] to-[#EF4444]',
            'from-[#13C9D5] to-[#087CFF]',
          ][index % 4];
          return (
            <div
              key={idx.symbol}
              className="bg-[#FFFFFF] p-4 lg:p-5 pl-5 lg:pl-6 rounded-2xl border border-[#DCE5FF] shadow-xs hover:border-[#087CFF]/40 card-hover-smooth group relative overflow-hidden"
            >
              <div className={`absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b ${gradientClass}`} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#647293] tracking-wide">{idx.name || idx.symbol}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono tabular-nums ${
                    isUp ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[22px] lg:text-[24px] font-bold text-[#172554] font-mono tabular-nums">
                  {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-semibold mt-0.5 font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                  {isUp ? '+' : ''}{idx.change.toFixed(2)} điểm
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="mt-3 w-full bg-[#F4F7FF] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isUp ? 'bg-[#16A34A]' : 'bg-[#EF4444]'}`}
                  style={{ width: `${Math.min(100, Math.max(15, Math.abs(idx.changePercent) * 25))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Market Breadth & Total Liquidity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Breadth Card (Col 7) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] p-5 pl-6 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#7C3CFF] to-[#087CFF]" />
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE5FF]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#7C3CFF] to-[#087CFF] shrink-0" />
              <BarChart3 className="w-4 h-4 text-[#087CFF]" />
              <h3 className="text-sm font-bold text-[#172554]">Độ rộng thị trường (Market Breadth)</h3>
            </div>
            <span className="text-xs text-[#647293] font-mono">
              Tổng {breadth.total} mã khảo sát
            </span>
          </div>

          {/* 3-colored Segmented Bar */}
          <div className="space-y-2">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#F4F7FF] gap-0.5">
              <div 
                className="bg-[#16A34A] transition-all"
                style={{ width: `${breadth.gainerPercent}%` }}
                title={`Tăng: ${breadth.gainers} mã (${breadth.gainerPercent}%)`}
              />
              <div 
                className="bg-[#F59E0B] transition-all"
                style={{ width: `${breadth.unchangedPercent}%` }}
                title={`Không đổi: ${breadth.unchanged} mã (${breadth.unchangedPercent}%)`}
              />
              <div 
                className="bg-[#EF4444] transition-all"
                style={{ width: `${breadth.loserPercent}%` }}
                title={`Giảm: ${breadth.losers} mã (${breadth.loserPercent}%)`}
              />
            </div>

            {/* Labels and values */}
            <div className="grid grid-cols-3 text-center text-xs pt-1">
              <div className="bg-[#DCFCE7]/40 p-2.5 rounded-xl border border-[#BBF7D0]/50">
                <span className="text-[#16A34A] font-bold block text-sm font-mono">{breadth.gainers} mã</span>
                <span className="text-[#647293] text-[11px]">Tăng giá ({breadth.gainerPercent}%)</span>
              </div>
              <div className="bg-[#FEF3C7]/40 p-2.5 rounded-xl border border-[#FDE68A]/50">
                <span className="text-[#D97706] font-bold block text-sm font-mono">{breadth.unchanged} mã</span>
                <span className="text-[#647293] text-[11px]">Không đổi ({breadth.unchangedPercent}%)</span>
              </div>
              <div className="bg-[#FEE2E2]/40 p-2.5 rounded-xl border border-[#FEE2E2]/50">
                <span className="text-[#EF4444] font-bold block text-sm font-mono">{breadth.losers} mã</span>
                <span className="text-[#647293] text-[11px]">Giảm giá ({breadth.loserPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Liquidity & Turnover Card (Col 5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] p-5 pl-6 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#13C9D5] to-[#087CFF]" />
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5FF]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#13C9D5] to-[#087CFF] shrink-0" />
                <Activity className="w-4 h-4 text-[#A855F7]" />
                <h3 className="text-sm font-bold text-[#172554]">Thanh khoản toàn thị trường</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                Sôi động
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <span className="text-[11px] text-[#647293] block">Tổng giá trị giao dịch</span>
                <span className="text-lg lg:text-xl font-bold text-[#172554] font-mono tabular-nums mt-0.5 block">
                  {breadth.totalLiquidityBillion} <span className="text-xs font-normal text-[#647293]">tỷ VNĐ</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF]">
                <span className="text-[11px] text-[#647293] block">Khối lượng khớp lệnh</span>
                <span className="text-lg lg:text-xl font-bold text-[#172554] font-mono tabular-nums mt-0.5 block">
                  {breadth.totalVolumeMillion} <span className="text-xs font-normal text-[#647293]">triệu cp</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#EBF3FF]/50 border border-[#DCE5FF] text-xs text-[#087CFF] flex items-center justify-between">
            <span>Dòng tiền tập trung: <strong>Ngân hàng, Thép, Bán lẻ</strong></span>
            <button onClick={onViewScreener} className="font-bold underline hover:opacity-80">Quét ngay &rarr;</button>
          </div>
        </div>
      </div>

      {/* 4. Top Movers & Quick Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Movers (Col 7) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden relative">
          <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#F59E0B] to-[#EF4444] z-10" />
          <div className="p-4 pl-6 border-b border-[#DCE5FF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#F59E0B] to-[#EF4444] shrink-0" />
              <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMoversTab('gainers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  moversTab === 'gainers'
                    ? 'bg-[#DCFCE7] text-[#16A34A] shadow-2xs'
                    : 'text-[#647293] hover:text-[#172554]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Top Tăng mạnh</span>
              </button>
              <button
                onClick={() => setMoversTab('losers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  moversTab === 'losers'
                    ? 'bg-[#FEE2E2] text-[#EF4444] shadow-2xs'
                    : 'text-[#647293] hover:text-[#172554]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Top Giảm sâu</span>
              </button>
            </div>
            </div>

            <button
              onClick={onViewScreener}
              className="text-xs font-semibold text-[#087CFF] hover:text-[#0066D6] transition-colors duration-200 ease-out flex items-center gap-0.5"
            >
              <span>Xem bộ lọc</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F4F7FF]">
            {(moversTab === 'gainers' ? topGainers : topLosers).map((stock) => {
              const isUp = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="p-3.5 px-4 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition-colors duration-200 ease-out"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] flex items-center justify-center font-bold text-sm text-[#172554]">
                      {stock.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#172554]">{stock.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F4F7FF] text-[#647293] font-semibold border border-[#DCE5FF]">
                          {stock.exchange}
                        </span>
                      </div>
                      <p className="text-xs text-[#647293] truncate max-w-[180px] sm:max-w-xs">{stock.companyName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-[#172554] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </p>
                    <p className={`text-xs font-bold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}% ({isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Watchlist preview (Col 5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden flex flex-col justify-between relative">
          <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A991] to-[#13C9D5] z-10" />
          <div>
            <div className="p-4 pl-6 border-b border-[#DCE5FF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#00A991] to-[#13C9D5] shrink-0" />
                <Bookmark className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-sm font-bold text-[#172554]">Theo dõi nhanh (Watchlist)</h3>
              </div>
              <button
                onClick={onViewWatchlist}
                className="text-xs font-semibold text-[#087CFF] hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#F4F7FF]">
              {featuredWatchlist.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="p-3 px-4 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition-colors duration-200 ease-out"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#087CFF] hover:underline">{stock.symbol}</span>
                      <span className="text-[11px] text-[#647293] block truncate max-w-[150px]">{stock.industry || 'Bluechips'}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-[#172554] font-mono tabular-nums block">
                        {stock.price.toLocaleString('vi-VN')}
                      </span>
                      <span className={`text-xs font-semibold font-mono tabular-nums ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#F4F7FF] border-t border-[#DCE5FF]">
            <button
              onClick={onViewWatchlist}
              className="w-full py-2 bg-white border border-[#DCE5FF] rounded-xl text-xs font-bold text-[#087CFF] hover:bg-[#EBF3FF] transition text-center shadow-2xs"
            >
              + Thêm mã vào danh sách theo dõi cá nhân
            </button>
          </div>
        </div>
      </div>

      {/* 5. Short-term Opportunities Preview (T+3 Radar highlight) */}
      {t3Signals.length > 0 && (
        <div className="bg-[#FFFFFF] p-5 pl-6 rounded-2xl border border-[#DCE5FF] shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#7C3CFF] to-[#087CFF]" />
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE5FF]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#7C3CFF] to-[#087CFF] shrink-0" />
              <Zap className="w-4 h-4 text-[#087CFF]" />
              <h3 className="text-sm font-bold text-[#172554]">
                Cơ hội ngắn hạn định lượng (T+1 đến T+5)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF]">
                Thuật toán StockAI
              </span>
            </div>

            <button
              onClick={onViewT3Radar}
              className="text-xs font-semibold text-[#087CFF] hover:underline flex items-center gap-0.5"
            >
              <span>Xem toàn bộ radar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t3Signals.slice(0, 3).map((sig) => (
              <div
                key={sig.id}
                onClick={() => onSelectStock(sig.symbol)}
                className="p-4 rounded-xl border border-[#DCE5FF] bg-[#F4F7FF]/50 hover:bg-[#FFFFFF] hover:border-[#087CFF] transition cursor-pointer space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-[#172554]">{sig.symbol}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                    Điểm: {sig.t3Score}/100
                  </span>
                </div>
                <p className="text-xs text-[#647293] line-clamp-1">{sig.rationale}</p>
                <div className="grid grid-cols-2 text-xs pt-1 border-t border-[#DCE5FF] font-mono">
                  <div>
                    <span className="text-[10px] text-[#647293] block">Vùng mua</span>
                    <span className="font-bold text-[#172554]">{sig.buyZone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#647293] block">Mục tiêu</span>
                    <span className="font-bold text-[#16A34A]">{sig.targetPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Transparent disclaimer banner */}
          <div className="p-3 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] text-[11px] text-[#92400E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              <strong>Lưu ý minh bạch:</strong> Các mức giá mục tiêu và cắt lỗ là tín hiệu tham khảo được tính toán từ mô hình kỹ thuật. Nền tảng không cam kết lợi nhuận cố định. Hãy luôn tuân thủ kỷ luật quản trị rủi ro 2% NAV cho mỗi giao dịch.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
