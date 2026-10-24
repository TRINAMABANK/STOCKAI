'use client';

import React from 'react';

interface SectorItem {
  name: string;
  percent: number;
  color: string;
}

export default function PortfolioDonut() {
  const sectors: SectorItem[] = [
    { name: 'Công nghệ', percent: 32.5, color: '#087CFF' },
    { name: 'Ngân hàng', percent: 24.8, color: '#16A34A' },
    { name: 'Thép', percent: 15.2, color: '#8B36FF' },
    { name: 'Bất động sản', percent: 12.6, color: '#EC4899' },
    { name: 'Chứng khoán', percent: 8.3, color: '#F59E0B' },
    { name: 'Khác', percent: 6.6, color: '#06B6D4' },
  ];

  // SVG Donut calculation
  const radius = 50;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between h-[340px] overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Phân bổ danh mục</h4>
        <span className="text-[12px] font-medium text-[#647293]">6 nhóm ngành</span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
        {/* SVG Donut Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
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
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[20px] font-bold text-[#172554] tracking-tight font-mono tabular-nums leading-none">
              1.27B
            </span>
            <span className="text-[11px] text-[#647293] font-medium mt-1">
              Tổng tài sản
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 min-w-0 space-y-1.5 text-[12px]">
          {sectors.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#647293] font-medium truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <span className="font-semibold text-[#172554] font-mono tabular-nums shrink-0">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Cash Ratio */}
      <div className="pt-3 border-t border-[#F4F7FF] flex items-center justify-between text-[12px] text-[#647293]">
        <span className="font-medium truncate">Tiền mặt khả dụng:</span>
        <span className="font-semibold text-[#087CFF] font-mono tabular-nums shrink-0 ml-1">
          22.3% (283.1 triệu)
        </span>
      </div>
    </div>
  );
}

