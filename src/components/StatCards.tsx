'use client';

import React from 'react';
import { ShieldCheck, TrendingUp, Wallet, Target, ArrowUpRight } from 'lucide-react';
import { PortfolioSummary } from '@/types';

interface StatCardsProps {
  summary: PortfolioSummary;
}

export default function StatCards({ summary }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Tổng tài sản */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium mb-1">Tổng tài sản</p>
          <h3 className="text-xl lg:text-2xl font-bold text-[#172033] tracking-tight font-mono">
            {summary.totalAssets.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-[#10B981]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{summary.dailyChange.toLocaleString('vi-VN')} (+{summary.dailyChangePercent}%)</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#008FD3]" />
        </div>
      </div>

      {/* 2. Giá trị cổ phiếu */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium mb-1">Giá trị cổ phiếu</p>
          <h3 className="text-xl lg:text-2xl font-bold text-[#172033] tracking-tight font-mono">
            {summary.stockValue.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-[#10B981]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+28,450,000 (+2.97%)</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-[#008FD3]" />
        </div>
      </div>

      {/* 3. Tiền mặt */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium mb-1">Tiền mặt</p>
          <h3 className="text-xl lg:text-2xl font-bold text-[#172033] tracking-tight font-mono">
            {summary.cash.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#64748B]">
            <span>Khả dụng giao dịch BMSC</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-[#D97706]" />
        </div>
      </div>

      {/* 4. Lãi/Lỗ đã thực hiện */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium mb-1">Lãi/Lỗ đã thực hiện</p>
          <h3 className="text-xl lg:text-2xl font-bold text-[#10B981] tracking-tight font-mono">
            +{summary.realizedPnL.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#10B981] font-semibold">
            <span>Hiệu suất chốt lời danh mục</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-[#10B981]" />
        </div>
      </div>
    </div>
  );
}
