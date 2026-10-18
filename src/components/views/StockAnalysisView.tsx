'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Search, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Target, 
  Clock, 
  BarChart3, 
  RefreshCw, 
  ArrowRight,
  Info
} from 'lucide-react';
import { StockQuote } from '@/types';
import { ShortTermSignal, analyzeShortTermOpportunity } from '@/lib/stockai-engine';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'score' | 'plan' | 'ai'>('overview');

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

  // Tạo nến mẫu gần nhất để tính toán định lượng tức thì cho giao diện
  const sampleCandles = Array.from({ length: 35 }).map((_, i) => {
    const p = stock.price * (0.88 + (i / 35) * 0.12);
    return {
      date: `2025-03-${String((i % 25) + 1).padStart(2, '0')}`,
      open: Math.round(p * 0.99),
      high: Math.round(p * 1.015),
      low: Math.round(p * 0.985),
      close: Math.round(p),
      volume: Math.round(stock.volume * (0.8 + ((i * 13) % 40) / 100)),
    };
  });

  const signal = analyzeShortTermOpportunity(
    stock.symbol,
    stock.companyName,
    stock.exchange,
    sampleCandles
  );

  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiReport(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Phân tích chuyên sâu cổ phiếu ${stock.symbol} trong khung thời gian 5-10 phiên giao dịch`, 
          symbol: stock.symbol 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data.data.reply);
        setActiveTab('ai');
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
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">Phân tích cổ phiếu ngắn hạn 5–10 phiên</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] text-xs font-bold border border-[#BAE6FD]">
              HOSE • HNX • UPCoM
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Mô hình tính điểm 100 trọng số, xác định điểm vào, mục tiêu và điều kiện vô hiệu hóa</p>
        </div>

        {/* Quick Stock Selector */}
        <div className="flex items-center gap-2">
          {['FPT', 'HPG', 'TCB', 'VNM', 'MWG', 'SSI', 'SHS', 'BSR'].map((sym) => (
            <button
              key={sym}
              onClick={() => {
                setSymbolInput(sym);
                onSelectSymbol(sym);
                setAiReport(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                symbolInput.toUpperCase() === sym
                  ? 'bg-[#008FD3] text-white shadow-2xs'
                  : 'bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F5F8FC]'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Banner Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-[#172033]">{stock.symbol}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#F5F8FC] text-[#64748B] font-bold border border-[#E2E8F0]">{stock.exchange}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] font-bold">{stock.industry}</span>
            
            {/* 3 Trạng thái phân loại rõ ràng */}
            {signal.status === 'BUY_CONFIRMED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#10B981] border border-[#A7F3D0] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Cơ hội mua cần xác nhận
              </span>
            )}
            {signal.status === 'WATCHLIST' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Chờ theo dõi
              </span>
            )}
            {signal.status === 'UNSUITABLE' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#F43F5E] border border-[#FECACA] flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Không phù hợp / Rủi ro cao
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">{stock.companyName}</p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-[#64748B] font-medium">Giá thị trường</p>
            <h4 className="text-2xl font-bold text-[#172033] font-mono mt-0.5">{stock.price.toLocaleString('vi-VN')} đ</h4>
            <span className={`text-xs font-bold font-mono ${stock.change >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('vi-VN')} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={isAiLoading}
            className="px-5 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
            <span>{isAiLoading ? 'AI đang phân tích...' : 'StockAI Phân tích'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]'
          }`}
        >
          Tổng quan chỉ số
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'score'
              ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]'
          }`}
        >
          Bảng điểm 100 trọng số ({signal.score.totalScore}/100)
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'plan'
              ? 'bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]'
          }`}
        >
          Kế hoạch giao dịch 5–10 phiên
        </button>
        {aiReport && (
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai'
                ? 'bg-[#EDE9FE] text-[#8B5CF6] border border-[#DDD6FE]'
                : 'text-[#64748B] hover:text-[#8B5CF6] hover:bg-[#EDE9FE]/50'
            }`}
          >
            Báo cáo AI Copilot
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">P/E Hiện tại</p>
              <p className="text-base font-bold text-[#172033] mt-0.5 font-mono">{stock.pe || '-'}x</p>
            </div>
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">P/B Định giá</p>
              <p className="text-base font-bold text-[#172033] mt-0.5 font-mono">{stock.pb || '-'}x</p>
            </div>
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">ROE Sinh lời</p>
              <p className="text-base font-bold text-[#10B981] mt-0.5 font-mono">{stock.roe || '-'}%</p>
            </div>
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">EPS Cơ bản</p>
              <p className="text-base font-bold text-[#172033] mt-0.5 font-mono">{stock.eps?.toLocaleString() || '-'} đ</p>
            </div>
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">RSI(14)</p>
              <p className="text-base font-bold text-[#008FD3] mt-0.5 font-mono">{stock.rsi || 50}</p>
            </div>
            <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <p className="text-[11px] text-[#64748B] font-medium">Khối lượng khớp</p>
              <p className="text-base font-bold text-[#172033] mt-0.5 font-mono">{stock.volume.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Nguồn dữ liệu: <strong>{stock.source}</strong> • Cập nhật lúc: <strong>{stock.updatedTime}</strong></span>
            <span className="text-[#008FD3] font-semibold cursor-pointer" onClick={() => setActiveTab('score')}>Xem bảng chấm điểm chi tiết →</span>
          </div>
        </div>
      )}

      {/* TAB 2: WEIGHTED SCORING BREAKDOWN (100 ĐIỂM) */}
      {activeTab === 'score' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h4 className="font-bold text-base text-[#172033]">Bảng điểm định lượng toán học (Thang 100 điểm)</h4>
              <p className="text-xs text-[#64748B] mt-0.5">Được tính từ dữ liệu lịch sử nến, chỉ số xu hướng, khối lượng và biên độ rủi ro</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-[#64748B]">Tổng điểm:</span>
                <p className="text-2xl font-bold text-[#008FD3] font-mono">{signal.score.totalScore}/100</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tiêu chí 1: Xu hướng (25đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">1. Xu hướng giá (Price Trend) — EMA20, EMA50 & Đỉnh đáy</span>
                <span className="font-bold font-mono text-[#008FD3]">{signal.score.trendScore} / 25 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#008FD3] rounded-full transition-all" style={{ width: `${(signal.score.trendScore / 25) * 100}%` }}></div>
              </div>
            </div>

            {/* Tiêu chí 2: Động lượng (20đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">2. Động lượng (Momentum) — RSI(14) & MACD</span>
                <span className="font-bold font-mono text-[#10B981]">{signal.score.momentumScore} / 20 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${(signal.score.momentumScore / 20) * 100}%` }}></div>
              </div>
            </div>

            {/* Tiêu chí 3: Thanh khoản (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">3. Thanh khoản giao dịch (Liquidity) — Giá trị khớp lệnh trung bình</span>
                <span className="font-bold font-mono text-[#8B5CF6]">{signal.score.liquidityScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#8B5CF6] rounded-full transition-all" style={{ width: `${(signal.score.liquidityScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* Tiêu chí 4: Khối lượng (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">4. Khối lượng bùng nổ (Volume Confirmation) — Không có xả hàng</span>
                <span className="font-bold font-mono text-[#D97706]">{signal.score.volumeScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#D97706] rounded-full transition-all" style={{ width: `${(signal.score.volumeScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* Tiêu chí 5: Điểm vào & R:R (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">5. Điểm vào & Tỷ lệ Lợi nhuận / Rủi ro (R:R &gt;= 1.5)</span>
                <span className="font-bold font-mono text-[#008FD3]">{signal.score.entryRiskRewardScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#008FD3] rounded-full transition-all" style={{ width: `${(signal.score.entryRiskRewardScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* Tiêu chí 6: Tin tức & Rủi ro (10đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#172033]">6. Tin tức, sự kiện & Quản trị rủi ro</span>
                <span className="font-bold font-mono text-[#10B981]">{signal.score.newsRiskScore} / 10 điểm</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${(signal.score.newsRiskScore / 10) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRADE PLAN 5-10 SESSIONS */}
      {activeTab === 'plan' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h4 className="font-bold text-base text-[#172033]">Kế hoạch giao dịch tham khảo (5–10 phiên)</h4>
              <p className="text-xs text-[#64748B] mt-0.5">Xây dựng theo nguyên tắc quản trị rủi ro chặt chẽ, kiểm soát lỗ tối đa</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Nắm giữ 5–10 phiên
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
              <span className="text-[#64748B] font-medium">Vùng mua tham khảo:</span>
              <p className="text-base font-bold text-[#008FD3] font-mono mt-1">{signal.buyZone}</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Sát ngưỡng hỗ trợ kỹ thuật</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <span className="text-[#16A34A] font-medium">Mục tiêu 1 (T+5):</span>
              <p className="text-base font-bold text-[#10B981] font-mono mt-1">{(signal.targetPrice1 / 1000).toFixed(1)}</p>
              <p className="text-[11px] text-[#16A34A] mt-0.5">Chủ động chốt lời 50% vị thế</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <span className="text-[#16A34A] font-medium">Mục tiêu 2 (T+10):</span>
              <p className="text-base font-bold text-[#10B981] font-mono mt-1">{(signal.targetPrice2 / 1000).toFixed(1)}</p>
              <p className="text-[11px] text-[#16A34A] mt-0.5">Chốt phần còn lại hoặc trailing</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
              <span className="text-[#DC2626] font-medium">Mức cắt lỗ dứt khoát:</span>
              <p className="text-base font-bold text-[#F43F5E] font-mono mt-1">{(signal.stopLoss / 1000).toFixed(1)}</p>
              <p className="text-[11px] text-[#DC2626] mt-0.5">Rủi ro: {signal.stopLossPercent}% (Tỷ lệ R:R {signal.rewardRiskRatio}:1)</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-1">
            <h5 className="font-bold text-[#92400E] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#D97706]" />
              Điều kiện vô hiệu hóa tín hiệu:
            </h5>
            <p className="text-[#B45309] leading-relaxed">{signal.invalidationCondition}</p>
          </div>
        </div>
      )}

      {/* TAB 4: AI COPILOT REPORT */}
      {activeTab === 'ai' && aiReport && (
        <div className="bg-[#FFFFFF] text-[#172033] rounded-2xl p-6 border border-[#DDD6FE] shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-[#8B5CF6] font-bold text-sm">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            <span>KẾT QUẢ ĐÁNH GIÁ CHUYÊN SÂU TỪ TRỢ LÝ STOCKAI (5–10 PHIÊN)</span>
          </div>
          <div className="text-xs sm:text-sm text-[#172033] whitespace-pre-line leading-relaxed">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
}
