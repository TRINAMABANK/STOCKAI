'use client';

import React from 'react';

interface SectorItem {
  name: string;
  percent: number;
  color: string;
}

export default function PortfolioDonut() {
  const sectors: SectorItem[] = [
    { name: 'Công nghệ', percent: 32.5, color: '#10b981' },
    { name: 'Ngân hàng', percent: 24.8, color: '#3b82f6' },
    { name: 'Thép', percent: 15.2, color: '#8b5cf6' },
    { name: 'Bất động sản', percent: 12.6, color: '#ec4899' },
    { name: 'Chứng khoán', percent: 8.3, color: '#f59e0b' },
    { name: 'Khác', percent: 6.6, color: '#06b6d4' },
  ];

  // SVG Donut calculation
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 text-white flex flex-col justify-between h-[340px]">
      <h4 className="font-semibold text-sm text-slate-100 mb-2">Phân bổ danh mục</h4>

      <div className="flex items-center justify-between gap-4 flex-1">
        {/* SVG Donut Circle */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {sectors.map((s, idx) => {
              const strokeDasharray = `${(s.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += s.percent;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold text-white tracking-tight">1.27B</span>
            <span className="text-[10px] text-slate-400 font-medium">Tổng tài sản</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 text-xs">
          {sectors.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-slate-300 text-[11px] truncate">{item.name}</span>
              </div>
              <span className="font-semibold text-slate-100 text-[11px] font-mono">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Cash Ratio */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Tiền mặt:</span>
        <span className="font-semibold text-amber-400 font-mono">22.3%</span>
      </div>
    </div>
  );
}
