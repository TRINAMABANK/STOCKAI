'use client';

import React from 'react';

interface SectorItem {
  name: string;
  percent: number;
  color: string;
}

export default function PortfolioDonut() {
  const sectors: SectorItem[] = [
    { name: 'Công nghệ', percent: 32.5, color: '#008FD3' },
    { name: 'Ngân hàng', percent: 24.8, color: '#10B981' },
    { name: 'Thép', percent: 15.2, color: '#8B5CF6' },
    { name: 'Bất động sản', percent: 12.6, color: '#EC4899' },
    { name: 'Chứng khoán', percent: 8.3, color: '#F59E0B' },
    { name: 'Khác', percent: 6.6, color: '#06B6D4' },
  ];

  // SVG Donut calculation
  const radius = 52;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between h-[340px] overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm text-[#172033]">Phân bổ danh mục</h4>
        <span className="text-[11px] font-semibold text-[#64748B]">6 ngành</span>
      </div>

      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-1 min-w-0">
        {/* SVG Donut Circle */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            {sectors.map((s, idx) => {
              const strokeDasharray = `${(s.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += s.percent;

              return (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-bold text-[#172033] tracking-tight font-mono">1.27B</span>
            <span className="text-[9px] text-[#64748B] font-semibold leading-tight">Tổng tài sản</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 min-w-0 space-y-1.5 text-xs">
          {sectors.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#64748B] text-[11px] truncate font-medium" title={item.name}>
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-[#172033] text-[11px] font-mono shrink-0">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Cash Ratio */}
      <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
        <span className="font-medium truncate">Tiền mặt khả dụng:</span>
        <span className="font-bold text-[#008FD3] font-mono shrink-0 ml-1">22.3% (283.1 triệu)</span>
      </div>
    </div>
  );
}
