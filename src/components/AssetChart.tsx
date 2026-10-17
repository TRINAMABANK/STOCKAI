'use client';

import React, { useState } from 'react';

export default function AssetChart() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(5);

  const dates = ['01/03', '05/03', '10/03', '15/03', '20/03', '25/03'];
  const yLabels = ['1.4B', '1.2B', '1.0B', '800M', '600M', '400M'];

  // Points for 3 curves: [Asset (green), VN-Index (gold), PnL (cyan/rose)]
  // Normalized 0 (bottom: 400M) to 200 (top: 1.4B)
  const assetPoints = [
    { x: 30, y: 155, val: '1,180,000,000 đ', date: '01/03/2025', vnindex: '1,265.10 (+0.45%)', pnl: '+12,500,000 (+1.07%)' },
    { x: 110, y: 148, val: '1,195,000,000 đ', date: '05/03/2025', vnindex: '1,270.30 (+0.62%)', pnl: '+18,200,000 (+1.54%)' },
    { x: 190, y: 135, val: '1,215,000,000 đ', date: '10/03/2025', vnindex: '1,274.50 (+0.81%)', pnl: '+24,600,000 (+2.06%)' },
    { x: 270, y: 122, val: '1,230,000,000 đ', date: '15/03/2025', vnindex: '1,279.80 (+0.95%)', pnl: '+28,400,000 (+2.36%)' },
    { x: 350, y: 105, val: '1,245,000,000 đ', date: '20/03/2025', vnindex: '1,282.10 (+1.10%)', pnl: '+31,200,000 (+2.56%)' },
    { x: 430, y: 88, val: '1,268,450,000 đ', date: '26/03/2025', vnindex: '1,286.24 (+1.24%)', pnl: '+35,620,000 (+2.89%)' },
  ];

  const vnindexPoints = [
    { x: 30, y: 175 },
    { x: 110, y: 168 },
    { x: 190, y: 162 },
    { x: 270, y: 155 },
    { x: 350, y: 148 },
    { x: 430, y: 140 },
  ];

  const pnlPoints = [
    { x: 30, y: 185 },
    { x: 110, y: 180 },
    { x: 190, y: 172 },
    { x: 270, y: 165 },
    { x: 350, y: 158 },
    { x: 430, y: 150 },
  ];

  // Helper to make smooth path
  const makePath = (pts: { x: number; y: number }[]) => {
    return pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  };

  const selectedPt = hoveredPoint !== null ? assetPoints[hoveredPoint] : assetPoints[5];

  return (
    <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 text-white flex flex-col justify-between h-[340px]">
      {/* Title & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h4 className="font-semibold text-sm text-slate-100">Biểu đồ tài sản theo thời gian</h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Tổng tài sản</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>VN-Index (so sánh)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Lãi/Lỗ</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas with Tooltip */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* Hover Tooltip Box */}
        {selectedPt && (
          <div 
            className="absolute top-1 z-10 bg-slate-900/95 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 shadow-xl text-xs backdrop-blur-sm pointer-events-none transition-all duration-150"
            style={{ left: `${Math.min(Math.max(selectedPt.x - 70, 20), 280)}px` }}
          >
            <p className="font-semibold text-slate-300 mb-1 text-[11px]">{selectedPt.date}</p>
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="text-slate-400">Tổng tài sản:</span>
                <span className="font-bold text-white">{selectedPt.val}</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <span className="text-slate-400">VN-Index:</span>
                <span className="font-medium text-amber-300">{selectedPt.vnindex}</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                <span className="text-slate-400">Lãi/Lỗ:</span>
                <span className="font-medium text-emerald-400">{selectedPt.pnl}</span>
              </p>
            </div>
          </div>
        )}

        {/* Chart SVG */}
        <div className="w-full h-full flex">
          {/* Y Axis Labels */}
          <div className="flex flex-col justify-between py-2 pr-3 text-[10px] text-slate-400 font-mono select-none">
            {yLabels.map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>

          {/* Lines & Grids */}
          <div className="flex-1 relative h-full">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 460 210" 
              preserveAspectRatio="none"
            >
              {/* Horizontal grid lines */}
              {[30, 65, 100, 135, 170, 200].map((y) => (
                <line 
                  key={y} 
                  x1="0" 
                  y1={y} 
                  x2="460" 
                  y2={y} 
                  stroke="#1e293b" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
              ))}

              {/* Area gradient for Total Asset */}
              <defs>
                <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path 
                d={`${makePath(assetPoints)} L 430 200 L 30 200 Z`} 
                fill="url(#assetGradient)" 
              />

              {/* VN-Index Line */}
              <path 
                d={makePath(vnindexPoints)} 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="2" 
                strokeDasharray="2 2"
              />

              {/* PnL Line */}
              <path 
                d={makePath(pnlPoints)} 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="2" 
              />

              {/* Total Asset Main Line */}
              <path 
                d={makePath(assetPoints)} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
              />

              {/* Data points */}
              {assetPoints.map((pt, i) => (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(i)}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={hoveredPoint === i ? 6 : 4} 
                    fill="#10b981" 
                    stroke="#0f172a" 
                    strokeWidth="2" 
                  />
                  {hoveredPoint === i && (
                    <line 
                      x1={pt.x} 
                      y1={0} 
                      x2={pt.x} 
                      y2={200} 
                      stroke="#10b981" 
                      strokeWidth="1" 
                      strokeDasharray="3 3" 
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* X Axis Dates */}
      <div className="flex justify-between pl-10 pr-2 pt-1 text-[11px] text-slate-400 select-none">
        {dates.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}
