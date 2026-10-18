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
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between h-[340px]">
      <h4 className="font-bold text-sm text-[#172033] mb-2">Phân bổ danh mục</h4>

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
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold text-[#172033] tracking-tight font-mono">1.27B</span>
            <span className="text-[10px] text-[#64748B] font-semibold">Tổng tài sản</span>
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
                <span className="text-[#64748B] text-[11px] truncate font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-[#172033] text-[11px] font-mono">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Cash Ratio */}
      <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
        <span className="font-medium">Tiền mặt khả dụng:</span>
        <span className="font-bold text-[#008FD3] font-mono">22.3% (283.1 triệu)</span>
      </div>
    </div>
  );
}
