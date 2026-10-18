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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">
              Dashboard thị trường Việt Nam
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
              REALTIME
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Diễn biến chỉ số sàn HOSE, HNX, UPCoM, độ rộng cung cầu và dòng tiền ngắn hạn
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B]">
            <Radio className="w-3.5 h-3.5 text-[#008FD3]" />
            <span>Nguồn: <strong className="text-[#172033]">{dataSource}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B]">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-mono tabular-nums">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Major Market Indices Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              className="bg-[#FFFFFF] p-4 lg:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#008FD3]/30 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B] tracking-wide">{idx.name || idx.symbol}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono tabular-nums ${
                    isUp ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FFE4E6] text-[#F43F5E]'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[22px] lg:text-[24px] font-bold text-[#172033] font-mono tabular-nums">
                  {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-semibold mt-0.5 font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                  {isUp ? '+' : ''}{idx.change.toFixed(2)} điểm
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="mt-3 w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isUp ? 'bg-[#10B981]' : 'bg-[#F43F5E]'}`}
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
        <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#008FD3]" />
              <h3 className="text-sm font-bold text-[#172033]">Độ rộng thị trường (Market Breadth)</h3>
            </div>
            <span className="text-xs text-[#64748B] font-mono">
              Tổng {breadth.total} mã khảo sát
            </span>
          </div>

          {/* 3-colored Segmented Bar */}
          <div className="space-y-2">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#F1F5F9] gap-0.5">
              <div 
                className="bg-[#10B981] transition-all"
                style={{ width: `${breadth.gainerPercent}%` }}
                title={`Tăng: ${breadth.gainers} mã (${breadth.gainerPercent}%)`}
              />
              <div 
                className="bg-[#F59E0B] transition-all"
                style={{ width: `${breadth.unchangedPercent}%` }}
                title={`Không đổi: ${breadth.unchanged} mã (${breadth.unchangedPercent}%)`}
              />
              <div 
                className="bg-[#F43F5E] transition-all"
                style={{ width: `${breadth.loserPercent}%` }}
                title={`Giảm: ${breadth.losers} mã (${breadth.loserPercent}%)`}
              />
            </div>

            {/* Labels and values */}
            <div className="grid grid-cols-3 text-center text-xs pt-1">
              <div className="bg-[#D1FAE5]/40 p-2.5 rounded-xl border border-[#A7F3D0]/50">
                <span className="text-[#10B981] font-bold block text-sm font-mono">{breadth.gainers} mã</span>
                <span className="text-[#64748B] text-[11px]">Tăng giá ({breadth.gainerPercent}%)</span>
              </div>
              <div className="bg-[#FEF3C7]/40 p-2.5 rounded-xl border border-[#FDE68A]/50">
                <span className="text-[#D97706] font-bold block text-sm font-mono">{breadth.unchanged} mã</span>
                <span className="text-[#64748B] text-[11px]">Không đổi ({breadth.unchangedPercent}%)</span>
              </div>
              <div className="bg-[#FFE4E6]/40 p-2.5 rounded-xl border border-[#FECDD3]/50">
                <span className="text-[#F43F5E] font-bold block text-sm font-mono">{breadth.losers} mã</span>
                <span className="text-[#64748B] text-[11px]">Giảm giá ({breadth.loserPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Liquidity & Turnover Card (Col 5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-sm font-bold text-[#172033]">Thanh khoản toàn thị trường</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#10B981] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                Sôi động
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block">Tổng giá trị giao dịch</span>
                <span className="text-lg lg:text-xl font-bold text-[#172033] font-mono tabular-nums mt-0.5 block">
                  {breadth.totalLiquidityBillion} <span className="text-xs font-normal text-[#64748B]">tỷ VNĐ</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block">Khối lượng khớp lệnh</span>
                <span className="text-lg lg:text-xl font-bold text-[#172033] font-mono tabular-nums mt-0.5 block">
                  {breadth.totalVolumeMillion} <span className="text-xs font-normal text-[#64748B]">triệu cp</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#E0F2FE]/50 border border-[#BAE6FD] text-xs text-[#008FD3] flex items-center justify-between">
            <span>Dòng tiền tập trung: <strong>Ngân hàng, Thép, Bán lẻ</strong></span>
            <button onClick={onViewScreener} className="font-bold underline hover:opacity-80">Quét ngay &rarr;</button>
          </div>
        </div>
      </div>

      {/* 4. Top Movers & Quick Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Movers (Col 7) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMoversTab('gainers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  moversTab === 'gainers'
                    ? 'bg-[#D1FAE5] text-[#10B981] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Top Tăng mạnh</span>
              </button>
              <button
                onClick={() => setMoversTab('losers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  moversTab === 'losers'
                    ? 'bg-[#FFE4E6] text-[#F43F5E] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Top Giảm sâu</span>
              </button>
            </div>

            <button
              onClick={onViewScreener}
              className="text-xs font-semibold text-[#008FD3] hover:underline flex items-center gap-0.5"
            >
              <span>Xem bộ lọc</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {(moversTab === 'gainers' ? topGainers : topLosers).map((stock) => {
              const isUp = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="p-3.5 px-4 flex items-center justify-between hover:bg-[#F5F8FC] cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] flex items-center justify-center font-bold text-sm text-[#172033]">
                      {stock.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#172033]">{stock.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-semibold border border-[#E2E8F0]">
                          {stock.exchange}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate max-w-[180px] sm:max-w-xs">{stock.companyName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-[#172033] font-mono tabular-nums">
                      {stock.price.toLocaleString('vi-VN')}
                    </p>
                    <p className={`text-xs font-bold font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}% ({isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Watchlist preview (Col 5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#008FD3]" />
                <h3 className="text-sm font-bold text-[#172033]">Theo dõi nhanh (Watchlist)</h3>
              </div>
              <button
                onClick={onViewWatchlist}
                className="text-xs font-semibold text-[#008FD3] hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {featuredWatchlist.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="p-3 px-4 flex items-center justify-between hover:bg-[#F5F8FC] cursor-pointer transition"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#008FD3] hover:underline">{stock.symbol}</span>
                      <span className="text-[11px] text-[#64748B] block truncate max-w-[150px]">{stock.industry || 'Bluechips'}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-[#172033] font-mono tabular-nums block">
                        {stock.price.toLocaleString('vi-VN')}
                      </span>
                      <span className={`text-xs font-semibold font-mono tabular-nums ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#F5F8FC] border-t border-[#E2E8F0]">
            <button
              onClick={onViewWatchlist}
              className="w-full py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#008FD3] hover:bg-[#E0F2FE] transition text-center shadow-2xs"
            >
              + Thêm mã vào danh sách theo dõi cá nhân
            </button>
          </div>
        </div>
      </div>

      {/* 5. Short-term Opportunities Preview (T+3 Radar highlight) */}
      {t3Signals.length > 0 && (
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#008FD3]" />
              <h3 className="text-sm font-bold text-[#172033]">
                Cơ hội ngắn hạn định lượng (T+1 đến T+5)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3]">
                Thuật toán StockAI
              </span>
            </div>

            <button
              onClick={onViewT3Radar}
              className="text-xs font-semibold text-[#008FD3] hover:underline flex items-center gap-0.5"
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
                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC]/50 hover:bg-[#FFFFFF] hover:border-[#008FD3] transition cursor-pointer space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-[#172033]">{sig.symbol}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981]">
                    Điểm: {sig.t3Score}/100
                  </span>
                </div>
                <p className="text-xs text-[#64748B] line-clamp-1">{sig.rationale}</p>
                <div className="grid grid-cols-2 text-xs pt-1 border-t border-[#E2E8F0] font-mono">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Vùng mua</span>
                    <span className="font-bold text-[#172033]">{sig.buyZone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#64748B] block">Mục tiêu</span>
                    <span className="font-bold text-[#10B981]">{sig.targetPrice}</span>
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
