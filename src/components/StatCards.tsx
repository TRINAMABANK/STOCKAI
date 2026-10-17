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
      <div className="bg-white rounded-xl p-4.5 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Tổng tài sản</p>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            {summary.totalAssets.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{summary.dailyChange.toLocaleString('vi-VN')} (+{summary.dailyChangePercent}%)</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      {/* 2. Giá trị cổ phiếu */}
      <div className="bg-white rounded-xl p-4.5 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Giá trị cổ phiếu</p>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            {summary.stockValue.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+28,450,000 (+2.97%)</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* 3. Tiền mặt */}
      <div className="bg-white rounded-xl p-4.5 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Tiền mặt</p>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            {summary.cash.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <span>Khả dụng giao dịch BMSC</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
          <Wallet className="w-6 h-6 text-amber-600" />
        </div>
      </div>

      {/* 4. Lãi/Lỗ đã thực hiện */}
      <div className="bg-white rounded-xl p-4.5 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Lãi/Lỗ đã thực hiện</p>
          <h3 className="text-xl lg:text-2xl font-bold text-emerald-600 tracking-tight">
            +{summary.realizedPnL.toLocaleString('vi-VN')} đ
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
            <span>Hiệu suất chốt lời danh mục</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <Target className="w-6 h-6 text-rose-500" />
        </div>
      </div>
    </div>
  );
}
