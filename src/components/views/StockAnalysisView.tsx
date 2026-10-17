'use client';

import React, { useState } from 'react';
import { LineChart, Search, Sparkles, TrendingUp, ShieldAlert, BarChart3, RefreshCw } from 'lucide-react';
import { StockQuote } from '@/types';

interface StockAnalysisViewProps {
  quotes: StockQuote[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function StockAnalysisView({
  quotes,
  selectedSymbol,
  onSelectSymbol,
}: StockAnalysisViewProps) {
  const [symbolInput, setSymbolInput] = useState(selectedSymbol || 'FPT');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stock = quotes.find(q => q.symbol.toUpperCase() === symbolInput.toUpperCase()) || quotes[0] || {
    symbol: 'FPT',
    companyName: 'CTCP FPT',
    exchange: 'HOSE',
    price: 135600,
    change: 4600,
    changePercent: 3.51,
    industry: 'Công nghệ',
    pe: 26.0,
    pb: 5.8,
    roe: 28.5,
    eps: 5200,
    volume: 4850000,
    rsi: 64,
  };

  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiReport(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Phân tích chuyên sâu cổ phiếu ${stock.symbol}`, symbol: stock.symbol }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data.data.reply);
      } else {
        setAiReport(`⚠️ ${data.message}`);
      }
    } catch {
      setAiReport('⚠️ Lỗi kết nối trợ lý AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Phân tích cổ phiếu chuyên sâu</h2>
          <p className="text-xs text-slate-500 mt-0.5">Đánh giá cơ bản, kỹ thuật và kịch bản biến động giá theo định lượng</p>
        </div>

        {/* Stock Selector */}
        <div className="flex items-center gap-2">
          {['FPT', 'HPG', 'TCB', 'VNM', 'MWG'].map((sym) => (
            <button
              key={sym}
              onClick={() => {
                setSymbolInput(sym);
                onSelectSymbol(sym);
                setAiReport(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                symbolInput.toUpperCase() === sym
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-900">{stock.symbol}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{stock.exchange}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{stock.industry}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{stock.companyName}</p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-slate-400 font-medium">Giá thị trường</p>
            <h4 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{stock.price.toLocaleString('vi-VN')} đ</h4>
            <span className={`text-xs font-semibold ${stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('vi-VN')} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={isAiLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isAiLoading ? 'AI đang phân tích...' : 'StockAI Phân tích'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">P/E Hiện tại</p>
          <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{stock.pe || '-'}x</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">P/B Định giá</p>
          <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{stock.pb || '-'}x</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">ROE Sinh lời</p>
          <p className="text-base font-bold text-emerald-600 mt-0.5 font-mono">{stock.roe || '-'}%</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">EPS Cơ bản</p>
          <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{stock.eps?.toLocaleString() || '-'} đ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">RSI(14)</p>
          <p className="text-base font-bold text-blue-600 mt-0.5 font-mono">{stock.rsi || 50}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-medium">Khối lượng khớp</p>
          <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{stock.volume.toLocaleString()}</p>
        </div>
      </div>

      {/* AI Report Card */}
      {aiReport && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>KẾT QUẢ ĐÁNH GIÁ TỔNG HỢP CHO {stock.symbol}</span>
          </div>
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
}
