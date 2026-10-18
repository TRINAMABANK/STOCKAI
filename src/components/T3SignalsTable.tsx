'use client';

import React, { useState, useMemo } from 'react';
import { Star, Zap, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, Info } from 'lucide-react';
import { T3Signal, T3Strategy, T3Period, T3SignalType } from '@/types';
import T3FilterBar, { T3FilterState, T3SortOption } from './T3FilterBar';
import { enrichT3Signal, normalizeIndustry } from '@/lib/t3-industry-helper';

interface T3SignalsTableProps {
  signals: T3Signal[];
  onSelectSignal: (signal: T3Signal) => void;
  onToggleFavorite: (signalId: string) => void;
  onViewAllSignals?: () => void;
  initialPeriod?: 'all' | T3Period;
  title?: string;
}

export default function T3SignalsTable({
  signals,
  onSelectSignal,
  onToggleFavorite,
  onViewAllSignals,
  initialPeriod = 'all',
  title = 'Giao dịch T+3 — Cơ hội ngắn hạn',
}: T3SignalsTableProps) {
  // Kỳ hạn giao dịch (Tất cả, T+1, T+3, T+5)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | T3Period>(initialPeriod);

  // Tab chiến lược kỹ thuật
  const [activeStrategyTab, setActiveStrategyTab] = useState<'all' | T3Strategy>('all');

  // Trạng thái bộ lọc
  const [filterState, setFilterState] = useState<T3FilterState>({
    search: '',
    industry: 'Tất cả ngành',
    exchange: 'ALL',
    signalType: 'ALL',
    riskLevel: 'ALL',
    sortBy: 'score',
  });

  const periodTabs: Array<{ id: 'all' | T3Period; label: string; badge: string }> = [
    { id: 'all', label: 'Tất cả kỳ hạn', badge: 'T+1 đến T+5' },
    { id: 'T+1', label: 'T+1', badge: 'Siêu ngắn hạn' },
    { id: 'T+3', label: 'T+3', badge: 'Tiêu chuẩn 3 phiên' },
    { id: 'T+5', label: 'T+5', badge: 'Mở rộng 5 phiên' },
  ];

  const strategyTabs: Array<{ id: 'all' | T3Strategy; label: string }> = [
    { id: 'all', label: 'Tất cả chiến lược' },
    { id: 'Breakout', label: 'Breakout' },
    { id: 'Pullback', label: 'Pullback' },
    { id: 'Momentum', label: 'Momentum' },
    { id: 'Reversal', label: 'Reversal' },
  ];

  // Làm giàu dữ liệu toàn bộ tín hiệu đầu vào
  const enrichedSignals = useMemo(() => {
    return (signals || []).map(enrichT3Signal);
  }, [signals]);

  // Bộ lọc toàn diện trên toàn bộ dữ liệu (không chỉ các dòng đang hiển thị)
  const filteredSignals = useMemo(() => {
    let result = enrichedSignals;

    // 1. Lọc theo kỳ hạn (T+1, T+3, T+5)
    if (selectedPeriod !== 'all') {
      result = result.filter(s => s.period === selectedPeriod);
    }

    // 2. Lọc theo chiến lược tab
    if (activeStrategyTab !== 'all') {
      result = result.filter(s => s.strategy.toLowerCase() === activeStrategyTab.toLowerCase());
    }

    // 3. Lọc theo tìm kiếm (Mã hoặc Tên doanh nghiệp)
    if (filterState.search.trim()) {
      const q = filterState.search.trim().toLowerCase();
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        s.companyName.toLowerCase().includes(q)
      );
    }

    // 4. Lọc theo ngành (13 ngành chuẩn mực)
    if (filterState.industry !== 'Tất cả ngành') {
      const targetSector = normalizeIndustry(filterState.industry);
      result = result.filter(s => normalizeIndustry(s.industry) === targetSector);
    }

    // 5. Lọc theo sàn (HOSE, HNX, UPCoM)
    if (filterState.exchange !== 'ALL') {
      result = result.filter(s => s.exchange.toUpperCase() === filterState.exchange.toUpperCase());
    }

    // 6. Lọc theo loại tín hiệu (BUY, SELL, WATCHLIST)
    if (filterState.signalType !== 'ALL') {
      result = result.filter(s => s.signalType === filterState.signalType);
    }

    // 7. Lọc theo mức rủi ro (Thấp, Trung bình, Cao)
    if (filterState.riskLevel !== 'ALL') {
      result = result.filter(s => s.riskLevel === filterState.riskLevel);
    }

    // 8. Sắp xếp theo lựa chọn
    return [...result].sort((a, b) => {
      if (filterState.sortBy === 'liquidity') {
        const valA = a.liquidityValue || (a.liquidity.includes('Rất cao') ? 3 : a.liquidity.includes('Cao') ? 2 : 1);
        const valB = b.liquidityValue || (b.liquidity.includes('Rất cao') ? 3 : b.liquidity.includes('Cao') ? 2 : 1);
        return valB - valA;
      }
      if (filterState.sortBy === 'changePercent') {
        return (b.changePercent || 0) - (a.changePercent || 0);
      }
      if (filterState.sortBy === 'rewardRisk') {
        return (b.rewardRiskRatio || 0) - (a.rewardRiskRatio || 0);
      }
      // Mặc định: Điểm tín hiệu (Cao xuống Thấp)
      return b.t3Score - a.t3Score;
    });
  }, [enrichedSignals, selectedPeriod, activeStrategyTab, filterState]);

  // Kiểm tra xem có bộ lọc nào đang khác mặc định không
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(filterState.search.trim()) ||
      filterState.industry !== 'Tất cả ngành' ||
      filterState.exchange !== 'ALL' ||
      filterState.signalType !== 'ALL' ||
      filterState.riskLevel !== 'ALL' ||
      filterState.sortBy !== 'score'
    );
  }, [filterState]);

  // Cập nhật bộ lọc
  const handleFilterChange = <K extends keyof T3FilterState>(key: K, value: T3FilterState[K]) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  // Đặt lại bộ lọc (nhưng giữ nguyên kỳ hạn và chiến lược hiện tại)
  const handleResetFilter = () => {
    setFilterState({
      search: '',
      industry: 'Tất cả ngành',
      exchange: 'ALL',
      signalType: 'ALL',
      riskLevel: 'ALL',
      sortBy: 'score',
    });
  };

  // Xử lý chuyển đổi kỳ hạn: giữ nguyên ngành đã chọn nếu còn hợp lệ
  const handleSelectPeriod = (newPeriod: 'all' | T3Period) => {
    setSelectedPeriod(newPeriod);
    // Lưu ý: filterState.industry được giữ nguyên theo đúng yêu cầu:
    // "Khi người dùng chuyển đổi giữa T+1, T+3 và T+5, ngành đã chọn (nếu có) vẫn được giữ nguyên nếu ngành đó còn phù hợp."
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
    return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  };

  const getStrategyColor = (strategy: T3Strategy) => {
    switch (strategy) {
      case 'Breakout': return 'text-[#10B981] font-bold';
      case 'Pullback': return 'text-[#008FD3] font-bold';
      case 'Momentum': return 'text-[#D97706] font-bold';
      case 'Reversal': return 'text-[#8B5CF6] font-bold';
      default: return 'text-[#172033] font-medium';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Thấp': return 'text-[#10B981] font-semibold';
      case 'Trung bình': return 'text-[#D97706] font-semibold';
      case 'Cao': return 'text-[#F43F5E] font-semibold';
      default: return 'text-[#64748B] font-medium';
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
      {/* 1. Header Bar: Tiêu đề & Chuyển đổi kỳ hạn (T+1, T+3, T+5) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-base text-[#172033] tracking-tight">
            {title}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
            {selectedPeriod === 'all' ? 'T+1 đến T+5' : `Kỳ hạn ${selectedPeriod}`}
          </span>
        </div>

        {/* Period Selector Tabs (T+1, T+3, T+5) */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
          {periodTabs.map((p) => {
            const isSelected = selectedPeriod === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPeriod(p.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#008FD3] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>{p.label}</span>
                {isSelected && (
                  <span className="text-[10px] opacity-80 hidden sm:inline">({p.badge})</span>
                )}
              </button>
            );
          })}
        </div>

        {onViewAllSignals && (
          <button 
            onClick={onViewAllSignals}
            className="text-xs text-[#008FD3] hover:text-[#007bb8] font-semibold transition"
          >
            Xem toàn bộ radar
          </button>
        )}
      </div>

      {/* 2. Tabs Chiến Lược (Breakout, Pullback, Momentum, Reversal) */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        {strategyTabs.map((tab) => {
          const isActive = activeStrategyTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStrategyTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] shadow-2xs'
                  : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172033]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Thanh Bộ Lọc (Đặt ngay dưới các tab chiến lược và phía trên bảng cổ phiếu) */}
      <T3FilterBar
        filterState={filterState}
        onChangeFilter={handleFilterChange}
        onResetFilter={handleResetFilter}
        totalCount={enrichedSignals.length}
        filteredCount={filteredSignals.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Bảng Dữ Liệu Tín Hiệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[#64748B] border-b border-[#E2E8F0] text-[12px] font-medium">
              <th className="pb-3 pt-1 font-medium text-left px-3">Mã CP</th>
              <th className="pb-3 pt-1 font-medium text-center px-2">Kỳ hạn</th>
              <th className="pb-3 pt-1 font-medium text-center px-2">Tín hiệu</th>
              <th className="pb-3 pt-1 font-medium text-right px-3">Giá & Biến động</th>
              <th className="pb-3 pt-1 font-medium text-center px-3">Điểm số</th>
              <th className="pb-3 pt-1 font-medium text-left px-3">Chiến lược</th>
              <th className="pb-3 pt-1 font-medium text-right px-3">Vùng mua</th>
              <th className="pb-3 pt-1 font-medium text-right px-3">
                <span className="inline-flex items-center gap-1" title="Mục tiêu giá kỹ thuật (không cam kết lợi nhuận)">
                  Mục tiêu
                  <Info className="w-3 h-3 text-[#94A3B8]" />
                </span>
              </th>
              <th className="pb-3 pt-1 font-medium text-right px-3">Cắt lỗ</th>
              <th className="pb-3 pt-1 font-medium text-center px-3">R:R</th>
              <th className="pb-3 pt-1 font-medium text-center px-3">Rủi ro</th>
              <th className="pb-3 pt-1 font-medium text-right px-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredSignals.length > 0 ? (
              filteredSignals.map((s) => {
                const isBuy = s.signalType === 'BUY';
                const isSell = s.signalType === 'SELL';
                const isWatch = s.signalType === 'WATCHLIST';

                return (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition group h-[52px]">
                    {/* Mã CP & Tên công ty/Ngành */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#008FD3] text-[14px] hover:underline cursor-pointer" onClick={() => onSelectSignal(s)}>
                            {s.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-semibold">
                            {s.exchange}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] truncate max-w-[140px]" title={`${s.companyName} • ${s.industry || 'Chưa phân ngành'}`}>
                          {s.industry || s.companyName}
                        </span>
                      </div>
                    </td>

                    {/* Kỳ hạn */}
                    <td className="py-3 px-2 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] font-mono">
                        {s.period || 'T+3'}
                      </span>
                    </td>

                    {/* Loại Tín hiệu (Màu sắc nhận diện rõ ràng: Xanh lá cho Mua, Đỏ cho Bán) */}
                    <td className="py-3 px-2 text-center">
                      {isBuy && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>MUA</span>
                        </span>
                      )}
                      {isSell && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]">
                          <ArrowDownRight className="w-3.5 h-3.5 text-[#F43F5E]" />
                          <span>BÁN</span>
                        </span>
                      )}
                      {isWatch && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          <Clock className="w-3 h-3 text-[#D97706]" />
                          <span>CHỜ</span>
                        </span>
                      )}
                    </td>

                    {/* Giá hiện tại & % Biến động */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-[#172033] font-mono tabular-nums text-[13.5px]">
                        {s.currentPrice.toLocaleString('vi-VN')}
                      </div>
                      {s.changePercent !== undefined && (
                        <div className={`text-[11px] font-medium font-mono tabular-nums ${
                          s.changePercent > 0 ? 'text-[#10B981]' : s.changePercent < 0 ? 'text-[#F43F5E]' : 'text-[#D97706]'
                        }`}>
                          {s.changePercent > 0 ? `+${s.changePercent}%` : `${s.changePercent}%`}
                        </div>
                      )}
                    </td>

                    {/* Điểm số */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono tabular-nums ${getScoreBadgeClass(s.t3Score)}`}>
                        {s.t3Score}
                      </span>
                    </td>

                    {/* Chiến lược */}
                    <td className={`py-3 px-3 ${getStrategyColor(s.strategy)}`}>
                      {s.strategy}
                    </td>

                    {/* Vùng mua */}
                    <td className="py-3 px-3 text-right text-[#172033] font-mono tabular-nums font-medium text-xs">
                      {s.buyZone}
                    </td>

                    {/* Mục tiêu (kèm cảnh báo không cam kết lợi nhuận) */}
                    <td className="py-3 px-3 text-right text-[#172033] font-bold font-mono tabular-nums text-xs" title="Giá mục tiêu kỹ thuật, không cam kết lợi nhuận tài chính">
                      {s.targetPrice}
                    </td>

                    {/* Cắt lỗ */}
                    <td className="py-3 px-3 text-right text-[#F43F5E] font-bold font-mono tabular-nums text-xs">
                      {s.stopLoss < 1000 ? s.stopLoss.toFixed(1) : (s.stopLoss / 1000).toFixed(1)}
                    </td>

                    {/* Tỷ lệ R:R */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-xs text-[#008FD3]">
                      {s.rewardRiskRatio ? `${s.rewardRiskRatio}x` : '—'}
                    </td>

                    {/* Rủi ro */}
                    <td className={`py-3 px-3 text-center text-xs ${getRiskColor(s.riskLevel)}`}>
                      {s.riskLevel}
                    </td>

                    {/* Thao tác: Xem chi tiết & Bookmark Star */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectSignal(s)}
                          className="px-3 py-1 rounded-lg bg-white border border-[#BAE6FD] hover:bg-[#E0F2FE] text-[#008FD3] font-semibold text-xs transition shadow-2xs"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(s.id);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            s.isFavorite
                              ? 'text-[#F59E0B] bg-[#FEF3C7] hover:bg-[#FDE68A]'
                              : 'text-[#94A3B8] hover:text-[#F59E0B] hover:bg-[#F5F8FC]'
                          }`}
                          title={s.isFavorite ? 'Bỏ theo dõi' : 'Thêm vào yêu thích'}
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              s.isFavorite ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'
                            }`} 
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Trạng thái 0 kết quả: Hiển thị thông báo rõ ràng kèm nút xóa/đặt lại bộ lọc
              <tr>
                <td colSpan={12} className="py-12 text-center text-[#64748B]">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-[#D97706]" />
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-[#172033]">
                        Không có cổ phiếu phù hợp với bộ lọc hiện tại
                      </p>
                      <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
                        Không tìm thấy mã nào đạt đồng thời các tiêu chí lọc đã chọn. Hãy thử nới lỏng ngành, sàn, hoặc đặt lại bộ lọc để quét toàn bộ thị trường.
                      </p>
                    </div>
                    <button
                      onClick={handleResetFilter}
                      className="px-4 py-2 rounded-xl bg-[#008FD3] text-white hover:bg-[#007bb8] text-xs font-semibold transition shadow-2xs mt-1"
                    >
                      Xóa bộ lọc & Hiển thị lại tất cả
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Cảnh Báo Miễn Trừ Trách Nhiệm Bắt Buộc */}
      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-start gap-2.5 text-[11.5px] text-[#64748B]">
        <Info className="w-4 h-4 text-[#008FD3] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#172033]">Lưu ý quan trọng:</strong> Tín hiệu T+1–T+5, giá mục tiêu, vùng mua và mức cắt lỗ được tính toán độc lập bằng mô hình toán định lượng ATR và phân tích kỹ thuật khách quan. Đây là dữ liệu tham khảo, <strong className="text-[#DC2626]">không phải cam kết lợi nhuận tài chính</strong>. Nhà đầu tư tự chịu trách nhiệm về quyết định vào lệnh.
        </p>
      </div>
    </div>
  );
}
