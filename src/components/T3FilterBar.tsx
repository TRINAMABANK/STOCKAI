'use client';

import React from 'react';
import { Search, X, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
import { STOCKAI_SECTORS } from '@/types';

export type T3SortOption = 'score' | 'liquidity' | 'changePercent' | 'rewardRisk';

export interface T3FilterState {
  search: string;
  industry: string;
  exchange: string;
  signalType: string;
  riskLevel: string;
  sortBy: T3SortOption;
}

export interface T3FilterBarProps {
  filterState: T3FilterState;
  onChangeFilter: <K extends keyof T3FilterState>(key: K, value: T3FilterState[K]) => void;
  onResetFilter: () => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

export default function T3FilterBar({
  filterState,
  onChangeFilter,
  onResetFilter,
  totalCount,
  filteredCount,
  hasActiveFilters,
}: T3FilterBarProps) {
  return (
    <div className="bg-[#F8FAFC] border border-[#DCE5FF] rounded-xl p-3.5 space-y-3">
      {/* Row 1: Search & Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Search Box */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#94A3B8]" />
          </div>
          <input
            type="text"
            value={filterState.search}
            onChange={(e) => onChangeFilter('search', e.target.value)}
            placeholder="Tìm theo mã CP hoặc tên công ty..."
            className="w-full pl-8 pr-7 py-2 bg-white text-xs text-[#172554] placeholder-[#94A3B8] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition font-medium"
          />
          {filterState.search && (
            <button
              onClick={() => onChangeFilter('search', '')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#94A3B8] hover:text-[#172554]"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2. Chọn Ngành (13 ngành chuẩn + Tất cả) */}
        <div>
          <select
            value={filterState.industry}
            onChange={(e) => onChangeFilter('industry', e.target.value)}
            className="w-full px-2.5 py-2 bg-white text-xs text-[#172554] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition font-medium cursor-pointer"
          >
            {STOCKAI_SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector === 'Tất cả ngành' ? 'Tất cả ngành' : sector}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Chọn Sàn */}
        <div>
          <select
            value={filterState.exchange}
            onChange={(e) => onChangeFilter('exchange', e.target.value)}
            className="w-full px-2.5 py-2 bg-white text-xs text-[#172554] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả sàn</option>
            <option value="HOSE">Sàn HOSE</option>
            <option value="HNX">Sàn HNX</option>
            <option value="UPCOM">Sàn UPCoM</option>
          </select>
        </div>

        {/* 4. Chọn Loại Tín Hiệu */}
        <div>
          <select
            value={filterState.signalType}
            onChange={(e) => onChangeFilter('signalType', e.target.value)}
            className="w-full px-2.5 py-2 bg-white text-xs text-[#172554] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả tín hiệu</option>
            <option value="BUY">🟢 Tín hiệu Mua</option>
            <option value="SELL">🔴 Tín hiệu Bán</option>
            <option value="WATCHLIST">⏳ Chờ xác nhận</option>
          </select>
        </div>

        {/* 5. Chọn Mức Rủi Ro */}
        <div>
          <select
            value={filterState.riskLevel}
            onChange={(e) => onChangeFilter('riskLevel', e.target.value)}
            className="w-full px-2.5 py-2 bg-white text-xs text-[#172554] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả mức rủi ro</option>
            <option value="Thấp">Rủi ro: Thấp</option>
            <option value="Trung bình">Rủi ro: Trung bình</option>
            <option value="Cao">Rủi ro: Cao</option>
          </select>
        </div>
      </div>

      {/* Row 2: Sort, Results Match Counter & Reset Action */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[#DCE5FF]/70 text-xs">
        {/* Left: Sort By selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[#647293] font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#087CFF]" />
            <span>Sắp xếp theo:</span>
          </div>
          <select
            value={filterState.sortBy}
            onChange={(e) => onChangeFilter('sortBy', e.target.value as T3SortOption)}
            className="px-2.5 py-1 bg-white text-xs text-[#172554] font-semibold border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#087CFF] focus:border-[#087CFF] transition cursor-pointer"
          >
            <option value="score">Điểm tín hiệu (Cao → Thấp)</option>
            <option value="liquidity">Thanh khoản (Cao → Thấp)</option>
            <option value="changePercent">Mức tăng giá (% Cao → Thấp)</option>
            <option value="rewardRisk">Tỷ lệ Lợi nhuận/Rủi ro (R:R)</option>
          </select>
        </div>

        {/* Right: Matches counter & Reset button */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Match counter badge */}
          <div className="px-2.5 py-1 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF] font-semibold text-xs flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-[#087CFF]" />
            <span>
              Tìm thấy <strong className="font-bold text-[#0070A8] font-mono tabular-nums">{filteredCount}</strong> / {totalCount} cổ phiếu phù hợp
            </span>
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilter}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] text-[#647293] text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
              title="Đặt lại toàn bộ tiêu chí lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
