'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  DollarSign,
  Calculator,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  HelpCircle,
  Activity,
  Check
} from 'lucide-react';
import { StockQuote } from '@/types';
import { ShortTermSignal, analyzeShortTermOpportunity } from '@/lib/stockai-engine';
import TechnicalChart, { Timeframe } from '@/components/TechnicalChart';
import { 
  CandleData, 
  TradeSetup, 
  generateTradeSetup, 
  calculatePositionRisk, 
  StrategyType 
} from '@/lib/chart-indicators';

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
  const [searchInput, setSearchInput] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('PULLBACK');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart_plan' | 'score' | 'financials' | 'risk_calc' | 'ai'>('chart_plan');
  const [copyPromptMessage, setCopyPromptMessage] = useState<string | null>(null);

  // Dữ liệu nến và trạng thái nạp từ API
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [unavailabilityNotice, setUnavailabilityNotice] = useState<string | undefined>(undefined);
  const [availableTimeframes, setAvailableTimeframes] = useState<Timeframe[]>(['1D', '1W']);
  const [providerInfo, setProviderInfo] = useState({
    code: 'MOCK_DEMO',
    name: 'StockAI Demo Simulation',
    dataMode: 'DEMO',
    lastUpdated: '15:00:00',
  });

  // Vốn danh mục để tính toán quản trị rủi ro 2% NAV
  const [navCapital, setNavCapital] = useState<number>(100000000); // 100 triệu VNĐ
  const [riskPercent, setRiskPercent] = useState<number>(2.0); // 2.0%

  // Lấy quote hiện tại của mã được chọn
  const stock = quotes.find(q => q.symbol.toUpperCase() === symbolInput.toUpperCase()) || quotes[0] || {
    symbol: 'FPT',
    companyName: 'CTCP FPT',
    exchange: 'HOSE' as const,
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
    source: 'StockAI Data Engine',
    updatedTime: '15:00:00',
  };

  // Đồng bộ khi selectedSymbol từ ngoài thay đổi
  useEffect(() => {
    if (selectedSymbol && selectedSymbol.toUpperCase() !== symbolInput.toUpperCase()) {
      setSymbolInput(selectedSymbol.toUpperCase());
    }
  }, [selectedSymbol]);

  // Tải dữ liệu nến từ API /api/market
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCandles(true);

    const fetchCandles = async () => {
      try {
        const res = await fetch(`/api/market?symbol=${symbolInput}&candles=true&timeframe=${timeframe}`);
        const json = await res.json();

        if (!isMounted) return;

        if (json.success && json.data) {
          setCandles(json.data.candles || []);
          setHasData(json.data.hasData !== false);
          setUnavailabilityNotice(json.data.message);
          if (json.data.availableTimeframes) {
            setAvailableTimeframes(json.data.availableTimeframes);
          }
          if (json.data.providerName) {
            setProviderInfo({
              code: json.data.providerCode || 'MOCK_DEMO',
              name: json.data.providerName,
              dataMode: json.data.dataMode || 'DEMO',
              lastUpdated: json.data.lastUpdated || new Date().toLocaleTimeString('vi-VN'),
            });
          }
        } else {
          setHasData(false);
          setUnavailabilityNotice(json.message || 'Chưa có dữ liệu thị trường cho mã này.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Lỗi tải dữ liệu nến:', err);
        setHasData(false);
        setUnavailabilityNotice('Lỗi kết nối máy chủ dữ liệu thị trường.');
      } finally {
        if (isMounted) {
          setIsLoadingCandles(false);
        }
      }
    };

    fetchCandles();

    return () => {
      isMounted = false;
    };
  }, [symbolInput, timeframe]);

  // Tính toán Trade Setup từ nến
  const tradeSetup: TradeSetup | null = useMemo(() => {
    if (!candles || candles.length < 5) return null;
    return generateTradeSetup(symbolInput, candles, selectedStrategy);
  }, [candles, symbolInput, selectedStrategy]);

  // Tính toán T+3 / T+5 Score từ stockai-engine
  const signal: ShortTermSignal = useMemo(() => {
    const sampleBars = candles.length >= 20 ? candles.map(c => ({
      date: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })) : Array.from({ length: 35 }).map((_, i) => {
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

    return analyzeShortTermOpportunity(
      stock.symbol,
      stock.companyName,
      stock.exchange,
      sampleBars
    );
  }, [stock, candles]);

  // Quản trị rủi ro vị thế 2% NAV
  const positionRisk = useMemo(() => {
    const entryP = tradeSetup?.entryPrice || stock.price;
    const stopP = tradeSetup?.stopLoss || Math.round(stock.price * 0.95);
    return calculatePositionRisk({
      portfolioCapital: navCapital,
      riskPercent,
      entryPrice: entryP,
      stopLossPrice: stopP,
    });
  }, [navCapital, riskPercent, tradeSetup, stock.price]);

  // Xuất Prompt Cấu Trúc Miễn Phí (AI-01 - DNSE Scanner v9.2 Parity)
  const handleCopyStructuredPrompt = () => {
    const barsSummary = candles.slice(-20).map(c => `${c.time}: Đóng ${c.close.toLocaleString()}, KL ${c.volume.toLocaleString()}`).join('\n');
    const setupInfo = tradeSetup 
      ? `Chiến lược: ${tradeSetup.strategyName}\n- Vùng thăm dò ①: ${tradeSetup.point1Entry?.toLocaleString() || tradeSetup.entryPrice.toLocaleString()} đ (Cắt lỗ thăm dò: ${tradeSetup.probeStopPrice?.toLocaleString() || tradeSetup.stopLoss.toLocaleString()} đ)\n- Vùng gia tăng ②: ${tradeSetup.point2Entry?.toLocaleString() || tradeSetup.entryZoneHigh.toLocaleString()} đ (Cắt lỗ vị thế: ${tradeSetup.positionStopPrice?.toLocaleString() || tradeSetup.stopLoss.toLocaleString()} đ)\n- Giá mua đuổi tối đa (ATR%): ${tradeSetup.maxChasePrice?.toLocaleString() || tradeSetup.entryZoneHigh.toLocaleString()} đ\n- Chốt lời 1 (TP1): ${tradeSetup.target1.toLocaleString()} đ (+${tradeSetup.target1Percent}%)\n- Chốt lời 2 (TP2): ${tradeSetup.target2.toLocaleString()} đ (+${tradeSetup.target2Percent}%)\n- Tỷ lệ Lợi nhuận/Rủi ro: ${tradeSetup.rewardRiskRatio}:1`
      : 'Chưa có setup cụ thể';

    const fullPrompt = `Bạn là Chuyên gia Phân tích Kỹ thuật & Quản trị Rủi ro Định lượng hàng đầu thị trường chứng khoán Việt Nam (HOSE, HNX, UPCoM).

Hãy phân tích toàn diện mã cổ phiếu ${stock.symbol} (${stock.companyName} - Sàn ${stock.exchange}, Ngành ${stock.industry}) dựa trên bộ dữ liệu thực tế sau:

1. THÔNG SỐ HIỆN TẠI:
- Giá khớp mới nhất: ${stock.price.toLocaleString('vi-VN')} đ (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
- Khối lượng giao dịch: ${stock.volume.toLocaleString('vi-VN')} cp
- RSI(14): ${stock.rsi || 55}
- P/E: ${stock.pe || 15}x | P/B: ${stock.pb || 1.8}x | ROE: ${stock.roe || 18}%

2. THIẾT LẬP KẾ HOẠCH GIAO DỊCH (TRADE SETUP T+5 - T+10):
${setupInfo}

3. LỊCH SỬ 20 PHIÊN GẦN NHẤT:
${barsSummary}

YÊU CẦU ĐÁNH GIÁ:
1. Xu hướng kỹ thuật chủ đạo và vị thế hiện tại của dòng tiền lớn (Smart Money).
2. Kiểm tra tín hiệu bứt phá (Breakout) hoặc kiểm định hỗ trợ (Pullback): Có đạt chuẩn khối lượng và vị trí đóng cửa nến không?
3. Đánh giá tính khả thi của Kế hoạch vào lệnh (Vùng mua ① Thăm dò, ② Gia tăng, Ngưỡng mua đuổi tối đa ATR, Điểm cắt lỗ kép).
4. Khuyến nghị hành động cụ thể cho phiên giao dịch kế tiếp (Mua mới / Mua thêm / Nắm giữ / Hạ tỷ trọng).`;

    navigator.clipboard.writeText(fullPrompt);
    setCopyPromptMessage('✅ Đã sao chép toàn bộ Prompt & dữ liệu vào Clipboard! Hãy dán (Ctrl+V) vào Claude/Gemini đang dùng.');
    setTimeout(() => setCopyPromptMessage(null), 4000);
  };

  // Xử lý gửi AI Copilot
  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiReport(null);

    const setupDetails = tradeSetup
      ? `Chiến lược: ${tradeSetup.strategyName}, Vùng mua: ${tradeSetup.entryZoneLow.toLocaleString()} - ${tradeSetup.entryZoneHigh.toLocaleString()} đ, Cắt lỗ: ${tradeSetup.stopLoss.toLocaleString()} đ (-${tradeSetup.stopLossPercent}%), TP1: ${tradeSetup.target1.toLocaleString()} đ, TP2: ${tradeSetup.target2.toLocaleString()} đ, R:R: ${tradeSetup.rewardRiskRatio}:1. Điểm kỹ thuật: ${signal.score.totalScore}/100.`
      : '';

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Phân tích chuyên sâu kỹ thuật và kế hoạch vào lệnh cho cổ phiếu ${stock.symbol} trong 5–10 phiên giao dịch tới. Dựa trên số liệu thực tế: Giá hiện tại ${stock.price.toLocaleString()} đ, RSI(14) = ${stock.rsi || 55}, ${setupDetails}. Đánh giá rủi ro thị trường và đưa ra khuyến nghị dứt khoát.`, 
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
      setAiReport('⚠️ Lỗi kết nối trợ lý StockAI Copilot.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const clean = searchInput.trim().toUpperCase();
      setSymbolInput(clean);
      onSelectSymbol(clean);
      setSearchInput('');
      setAiReport(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Tiêu đề + Tìm kiếm mã + Quick Stock Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] lg:text-[25px] font-bold text-[#172554] tracking-tight">
              Phân tích Kỹ thuật & Thiết lập Vào lệnh Ngắn hạn (5–10 phiên)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] text-xs font-semibold border border-[#DCE5FF]">
              HOSE • HNX • UPCoM
            </span>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Biểu đồ nến Nhật chuẩn TradingView, bộ nhận diện hỗ trợ kháng cự, tín hiệu điểm vào và quản trị rủi ro 2% NAV
          </p>
        </div>

        {/* Quick Search & Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Form tìm kiếm mã cổ phiếu */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Nhập mã (VND, SSI...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              className="w-36 lg:w-44 px-3 py-1.5 pl-8 rounded-xl bg-white border border-[#DCE5FF] text-xs font-bold text-[#172554] focus:outline-none focus:border-[#087CFF] uppercase"
            />
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Quick symbol chips */}
          <div className="flex items-center gap-1.5">
            {['FPT', 'HPG', 'TCB', 'VNM', 'MWG', 'SSI', 'SHS', 'BSR'].map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  setSymbolInput(sym);
                  onSelectSymbol(sym);
                  setAiReport(null);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  symbolInput.toUpperCase() === sym
                    ? 'bg-[#087CFF] text-white shadow-2xs'
                    : 'bg-white border border-[#DCE5FF] text-[#172554] hover:bg-[#F4F7FF]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Stock Banner Card: Giá, Trạng thái & Nguồn dữ liệu */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 lg:p-6 border border-[#DCE5FF] shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[28px] font-bold text-[#172554] tracking-tight">{stock.symbol}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-[#F4F7FF] text-[#475569] font-bold border border-[#DCE5FF]">
                {stock.exchange}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] font-semibold">
                {stock.industry}
              </span>

              {/* Trạng thái phân loại cơ hội */}
              {signal.status === 'BUY_CONFIRMED' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Cơ hội mua cần xác nhận
                </span>
              )}
              {signal.status === 'WATCHLIST' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Chờ theo dõi
                </span>
              )}
              {signal.status === 'UNSUITABLE' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA] flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Không phù hợp / Rủi ro cao
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#647293] mt-1 font-medium">{stock.companyName}</p>
          </div>

          <div className="h-8 w-px bg-[#DCE5FF] hidden sm:block"></div>

          {/* Nguồn dữ liệu & Trạng thái kết nối */}
          <div className="text-[12px] text-[#647293] space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>Nguồn: <strong>{providerInfo.name}</strong></span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#F4F7FF] font-mono font-bold text-[#172554]">
                {providerInfo.dataMode}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Trạng thái: Kết nối an toàn • Cập nhật lúc {providerInfo.lastUpdated}
            </p>
          </div>
        </div>

        {/* Khối giá thị trường & Nút bấm AI Copilot */}
        <div className="flex items-center gap-6">
          <div className="text-right sm:text-left">
            <p className="text-[11px] text-[#647293] font-medium">Giá thị trường</p>
            <h4 className="text-[26px] font-bold text-[#172554] font-mono tabular-nums leading-tight">
              {stock.price.toLocaleString('vi-VN')} đ
            </h4>
            <span className={`text-[13px] font-semibold font-mono tabular-nums ${stock.change >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('vi-VN')} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={isAiLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B36FF] to-[#EF4CBF] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#8B36FF]/25 transition disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
            <span>{isAiLoading ? 'AI đang phân tích...' : 'StockAI Copilot'}</span>
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE5FF] pb-2">
        <button
          onClick={() => setActiveTab('chart_plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'chart_plan'
              ? 'bg-gradient-to-r from-[#EBF3FF] to-white text-[#087CFF] border border-[#087CFF]/30 shadow-2xs'
              : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-[#7C3CFF] to-[#087CFF] opacity-80 shrink-0" />
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Đồ thị & Kế hoạch vào lệnh</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'financials'
              ? 'bg-gradient-to-r from-[#EBF3FF] to-white text-[#087CFF] border border-[#087CFF]/30 shadow-2xs'
              : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-[#087CFF] to-[#13C9D5] opacity-80 shrink-0" />
          <BarChart3 className="w-3.5 h-3.5" />
          <span>▤ BCTC & Tài chính 1 Trang</span>
        </button>

        <button
          onClick={() => setActiveTab('score')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'score'
              ? 'bg-gradient-to-r from-[#EBF3FF] to-white text-[#087CFF] border border-[#087CFF]/30 shadow-2xs'
              : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-[#8B36FF] to-[#EF4CBF] opacity-80 shrink-0" />
          <Target className="w-3.5 h-3.5" />
          <span>Bảng điểm định lượng ({signal.score.totalScore}/100)</span>
        </button>

        <button
          onClick={() => setActiveTab('risk_calc')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'risk_calc'
              ? 'bg-gradient-to-r from-[#EBF3FF] to-white text-[#087CFF] border border-[#087CFF]/30 shadow-2xs'
              : 'text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-[#13C9D5] to-[#087CFF] opacity-80 shrink-0" />
          <Calculator className="w-3.5 h-3.5" />
          <span>Quản trị rủi ro & Tính khối lượng mua (2% NAV)</span>
        </button>

        {aiReport && (
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-[#F3E8FF] to-white text-[#8B36FF] border border-[#8B36FF]/30 shadow-2xs'
                : 'text-[#647293] hover:text-[#8B36FF] hover:bg-[#F3E8FF]/50'
            }`}
          >
            <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-[#8B36FF] to-[#EF4CBF] opacity-80 shrink-0" />
            <Sparkles className="w-3.5 h-3.5 text-[#8B36FF]" />
            <span>Báo cáo AI Copilot</span>
          </button>
        )}
      </div>

      {/* 4. TAB 1: CHART + TRADE SETUP PANEL (CORE TRADINGVIEW EXPERIENCE) */}
      {activeTab === 'chart_plan' && (
        <div className="space-y-6">
          {/* Main Technical Chart Component */}
          <TechnicalChart
            symbol={stock.symbol}
            candles={candles}
            tradeSetup={tradeSetup}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
            availableTimeframes={availableTimeframes}
            providerName={providerInfo.name}
            dataMode={providerInfo.dataMode}
            lastUpdated={providerInfo.lastUpdated}
            hasData={hasData}
            unavailabilityNotice={unavailabilityNotice}
          />

          {/* Strategy Setup & Entry Assistance Card */}
          {tradeSetup && (
            <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-5">
              {/* Strategy Header & Strategy Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCE5FF]">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-[#172554]">
                      Kế hoạch Vào lệnh Ngắn hạn ({tradeSetup.strategyName})
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Nắm giữ {tradeSetup.holdingPeriod}
                    </span>
                  </div>
                  <p className="text-xs text-[#647293] mt-0.5">
                    Hệ thống tự động tính toán điểm vào, mục tiêu và điểm cắt lỗ dựa trên biên độ nến và ngưỡng hỗ trợ thực tế
                  </p>
                </div>

                {/* Chọn 4 Chiến lược kỹ thuật kiểm chứng */}
                <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#DCE5FF]">
                  <span className="text-[11px] text-[#647293] font-semibold px-2">Chiến lược:</span>
                  {(['PULLBACK', 'BREAKOUT', 'MOMENTUM', 'REVERSAL'] as StrategyType[]).map((strat) => {
                    const labels: Record<StrategyType, string> = {
                      PULLBACK: 'Pullback',
                      BREAKOUT: 'Breakout',
                      MOMENTUM: 'Momentum',
                      REVERSAL: 'Reversal',
                    };

                    return (
                      <button
                        key={strat}
                        onClick={() => setSelectedStrategy(strat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          selectedStrategy === strat
                            ? 'bg-[#087CFF] text-white shadow-2xs'
                            : 'text-[#647293] hover:text-[#172554] hover:bg-white'
                        }`}
                      >
                        {labels[strat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Ô Thông số vào lệnh trực quan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Vùng mua tham khảo */}
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#DCE5FF]">
                  <span className="text-[#0066D6] font-semibold flex items-center justify-between">
                    <span>VÙNG MUA THAM KHẢO:</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#087CFF]">
                      ENTRY
                    </span>
                  </span>
                  <p className="text-[20px] font-bold text-[#087CFF] font-mono mt-1">
                    {(tradeSetup.entryZoneLow / 1000).toFixed(1)} – {(tradeSetup.entryZoneHigh / 1000).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-[#0066D6] mt-0.5">
                    Giá kích hoạt: <strong>{tradeSetup.entryPrice.toLocaleString()} đ</strong>
                  </p>
                </div>

                {/* Mục tiêu 1 (T+5) */}
                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <span className="text-[#16A34A] font-semibold flex items-center justify-between">
                    <span>MỤC TIÊU 1 (T+5):</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#16A34A]">
                      +{tradeSetup.target1Percent}%
                    </span>
                  </span>
                  <p className="text-[20px] font-bold text-[#16A34A] font-mono mt-1">
                    {(tradeSetup.target1 / 1000).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-[#16A34A] mt-0.5">
                    Chủ động chốt lời 50% vị thế nắm giữ
                  </p>
                </div>

                {/* Mục tiêu 2 (T+10) */}
                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <span className="text-[#16A34A] font-semibold flex items-center justify-between">
                    <span>MỤC TIÊU 2 (T+10):</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#16A34A]">
                      +{tradeSetup.target2Percent}%
                    </span>
                  </span>
                  <p className="text-[20px] font-bold text-[#16A34A] font-mono mt-1">
                    {(tradeSetup.target2 / 1000).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-[#16A34A] mt-0.5">
                    Chốt phần còn lại hoặc trailing stop
                  </p>
                </div>

                {/* Cắt lỗ dứt khoát */}
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                  <span className="text-[#DC2626] font-semibold flex items-center justify-between">
                    <span>MỨC CẮT LỖ DỨT KHOÁT:</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#EF4444]">
                      -{tradeSetup.stopLossPercent}%
                    </span>
                  </span>
                  <p className="text-[20px] font-bold text-[#EF4444] font-mono mt-1">
                    {(tradeSetup.stopLoss / 1000).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-[#DC2626] mt-0.5">
                    Tỷ lệ Lợi nhuận / Rủi ro: <strong>R:R {tradeSetup.rewardRiskRatio} : 1</strong>
                  </p>
                </div>
              </div>

              {/* Rationale & Confirmation & Invalidation Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Luận điểm & Xác nhận */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE5FF] space-y-2">
                  <h5 className="font-bold text-[#172554] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#087CFF]" />
                    Luận điểm kỹ thuật & Điều kiện xác nhận:
                  </h5>
                  <p className="text-[#475569] leading-relaxed">
                    {tradeSetup.rationale}
                  </p>
                  <div className="pt-2 border-t border-[#DCE5FF]">
                    <span className="font-semibold text-[#087CFF]">Điều kiện vào lệnh: </span>
                    <span className="text-[#334155]">{tradeSetup.confirmationCondition}</span>
                  </div>
                </div>

                {/* Điều kiện vô hiệu hóa */}
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                  <h5 className="font-bold text-[#92400E] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                    Mức hủy tín hiệu & Quản trị rủi ro:
                  </h5>
                  <p className="text-[#B45309] leading-relaxed">
                    {tradeSetup.invalidationCondition}
                  </p>
                  <div className="pt-2 border-t border-[#FDE68A]">
                    <span className="font-semibold text-[#92400E]">Ngưỡng hủy kích hoạt: </span>
                    <span className="text-[#92400E] font-mono font-bold">
                      {tradeSetup.invalidationLevel.toLocaleString()} đ (Đóng nến phiên)
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Day Consecutive Gain Streak Banner & Pattern Status */}
              <div className="p-4 rounded-xl border bg-[#F8FAFC] border-[#DCE5FF] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DCE5FF]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087CFF]"></span>
                    <h5 className="font-bold text-xs text-[#172554] uppercase tracking-wider">
                      Nhận diện Xu hướng: Chuỗi Tăng 5 Phiên Liên Tiếp
                    </h5>
                  </div>
                  <span className="text-[11px] text-[#647293]">
                    Quy tắc: 5 phiên liên tiếp có Close[i] &gt; Close[i-1] (Dữ liệu EOD đã đóng nến)
                  </span>
                </div>

                {tradeSetup.latestFiveDayStreak ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-white border border-[#DCE5FF]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#EBF3FF] text-[#087CFF]">
                          TĂNG {tradeSetup.latestFiveDayStreak.streakCount} PHIÊN LIÊN TIẾP
                        </span>
                        <span className="text-xs font-semibold text-[#16A34A] font-mono">
                          (+{tradeSetup.latestFiveDayStreak.totalGainPct}%)
                        </span>
                        <span className="text-xs text-[#647293] font-mono">
                          {tradeSetup.latestFiveDayStreak.startDate} → {tradeSetup.latestFiveDayStreak.endDate}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569]">
                        Biên độ giá: <strong>{tradeSetup.latestFiveDayStreak.startPrice.toLocaleString()} đ</strong> lên{' '}
                        <strong>{tradeSetup.latestFiveDayStreak.endPrice.toLocaleString()} đ</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#647293] block">Đánh giá hành động:</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mt-0.5 bg-[#ECFDF5] text-[#15803D] border border-[#BBF7D0]">
                        ✓ {tradeSetup.latestFiveDayStreak.statusLabel}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-white border border-[#DCE5FF] text-xs text-[#647293] flex items-center justify-between">
                    <span>
                      Hiện cổ phiếu {stock.symbol} chưa ghi nhận chuỗi tăng 5 phiên liên tục gần nhất. Giá đang vận động kiểm định lại nền tích lũy.
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#F4F7FF] font-semibold text-[#647293]">
                      Không có tín hiệu tăng nóng
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-[#647293] italic">
                  * Lưu ý: Sự kiện tăng 5 phiên là chỉ báo nhận diện xu hướng, không tự động đồng nghĩa với lệnh mua hay bán. Mũi tên xanh chỉ xuất hiện khi bứt phá kèm khối lượng bùng nổ; mũi tên đỏ chỉ xuất hiện khi quá mua hoặc có tín hiệu suy yếu. Nếu chưa đủ điều kiện, hệ thống chỉ gắn nhãn theo dõi.
                </p>
              </div>

              {/* Walk-Forward Signal Backtest Card (Đã trừ phí 0.15%, thuế 0.10%, trượt giá 0.10%) */}
              {tradeSetup.backtestResult && (
                <div className="p-4 rounded-xl border bg-[#F0FDF4] border-[#BBF7D0] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#BBF7D0]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#16A34A]" />
                      <h5 className="font-bold text-xs text-[#166534] uppercase tracking-wider">
                        Kết quả Kiểm định Lịch sử Mũi tên Mua/Bán (Walk-Forward Backtest)
                      </h5>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-[#166534] font-semibold border border-[#BBF7D0]">
                      Không thiên lệch nhìn trước • Đã trừ thuế phí
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Số lệnh hoàn tất:</span>
                      <p className="text-base font-bold text-[#172554] font-mono mt-0.5">
                        {tradeSetup.backtestResult.totalTrades} vòng
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Tỷ lệ thắng (Win Rate):</span>
                      <p className="text-base font-bold text-[#16A34A] font-mono mt-0.5">
                        {tradeSetup.backtestResult.winRate}%
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Tổng lợi nhuận ròng:</span>
                      <p className={`text-base font-bold font-mono mt-0.5 ${
                        tradeSetup.backtestResult.totalReturnPercent >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'
                      }`}>
                        {tradeSetup.backtestResult.totalReturnPercent >= 0 ? '+' : ''}
                        {tradeSetup.backtestResult.totalReturnPercent}%
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Lãi TB mỗi lệnh:</span>
                      <p className="text-base font-bold text-[#16A34A] font-mono mt-0.5">
                        +{tradeSetup.backtestResult.avgReturnPerTrade}%
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Sụt giảm tối đa (MDD):</span>
                      <p className="text-base font-bold text-[#EF4444] font-mono mt-0.5">
                        -{tradeSetup.backtestResult.maxDrawdownPercent}%
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
                      <span className="text-[11px] text-[#647293]">Profit Factor:</span>
                      <p className="text-base font-bold text-[#087CFF] font-mono mt-0.5">
                        {tradeSetup.backtestResult.profitFactor}x
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#166534] pt-1">
                    <span>
                      Chi phí khấu trừ: <strong>0.15% phí giao dịch</strong> + <strong>0.10% thuế TNCN</strong> + <strong>0.10% trượt giá</strong> mỗi vòng
                    </span>
                    <span className="font-semibold text-[#DC2626]">
                      * Cảnh báo rủi ro: Kết quả quá khứ không cam kết lợi nhuận trong tương lai.
                    </span>
                  </div>
                </div>
              )}

              {/* Disclaimer an toàn & độc lập */}
              <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] flex items-start gap-2 text-[11px] text-[#647293]">
                <Info className="w-4 h-4 text-[#647293] shrink-0 mt-0.5" />
                <p>
                  <strong>Khuyến cáo độc lập:</strong> StockAI là nền tảng phân tích kỹ thuật độc lập, không tích hợp tài khoản môi giới và không đặt lệnh thay nhà đầu tư. Các mức giá mang tính chất tham khảo kỹ thuật thuần túy. Nhà đầu tư tự chịu trách nhiệm về quyết định giải ngân.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: WEIGHTED SCORING BREAKDOWN (100 ĐIỂM) */}
      {activeTab === 'score' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCE5FF]">
            <div>
              <h4 className="font-bold text-base text-[#172554]">Bảng điểm định lượng toán học (Thang 100 điểm)</h4>
              <p className="text-xs text-[#647293] mt-0.5">
                Tính toán dựa trên 6 nhóm tiêu chí: Xu hướng, Động lượng, Thanh khoản, Khối lượng bứt phá, Tỷ lệ R:R và Quản trị rủi ro
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-[#647293]">Tổng điểm định lượng:</span>
                <p className="text-3xl font-bold text-[#087CFF] font-mono leading-tight">{signal.score.totalScore}/100</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. Xu hướng (25đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">1. Xu hướng giá (Price Trend) — EMA20, EMA50 & Cấu trúc đỉnh đáy</span>
                <span className="font-bold font-mono text-[#087CFF]">{signal.score.trendScore} / 25 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#087CFF] rounded-full transition-all" style={{ width: `${(signal.score.trendScore / 25) * 100}%` }}></div>
              </div>
            </div>

            {/* 2. Động lượng (20đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">2. Động lượng (Momentum) — RSI(14) & MACD</span>
                <span className="font-bold font-mono text-[#16A34A]">{signal.score.momentumScore} / 20 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${(signal.score.momentumScore / 20) * 100}%` }}></div>
              </div>
            </div>

            {/* 3. Thanh khoản (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">3. Thanh khoản giao dịch (Liquidity) — Giá trị khớp lệnh trung bình 20 phiên</span>
                <span className="font-bold font-mono text-[#8B36FF]">{signal.score.liquidityScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#8B36FF] rounded-full transition-all" style={{ width: `${(signal.score.liquidityScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* 4. Khối lượng bùng nổ (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">4. Khối lượng bùng nổ (Volume Confirmation) — Không có áp lực xả hàng</span>
                <span className="font-bold font-mono text-[#D97706]">{signal.score.volumeScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#D97706] rounded-full transition-all" style={{ width: `${(signal.score.volumeScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* 5. Điểm vào & R:R (15đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">5. Điểm vào & Tỷ lệ Lợi nhuận / Rủi ro (R:R &gt;= 1.5)</span>
                <span className="font-bold font-mono text-[#087CFF]">{signal.score.entryRiskRewardScore} / 15 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#087CFF] rounded-full transition-all" style={{ width: `${(signal.score.entryRiskRewardScore / 15) * 100}%` }}></div>
              </div>
            </div>

            {/* 6. Tin tức & Rủi ro (10đ) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172554]">6. Quản trị rủi ro & Tin tức thị trường chung</span>
                <span className="font-bold font-mono text-[#16A34A]">{signal.score.newsRiskScore} / 10 điểm</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F4F7FF] overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${(signal.score.newsRiskScore / 10) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: POSITION RISK & 2% NAV SIZING CALCULATOR */}
      {activeTab === 'risk_calc' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5FF] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCE5FF]">
            <div>
              <h4 className="font-bold text-base text-[#172554] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#087CFF]" />
                Công cụ Quản trị Rủi ro & Định cỡ Vị thế (Quy tắc 2% NAV)
              </h4>
              <p className="text-xs text-[#647293] mt-0.5">
                Nguyên tắc quản trị vốn chuyên nghiệp: Nếu thị trường vi phạm Stop-Loss, tài khoản của bạn chỉ mất tối đa 2% tổng NAV
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              Tuân thủ chuẩn quản trị rủi ro
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: Nhập liệu thông số vốn */}
            <div className="space-y-4 p-5 rounded-xl bg-[#F8FAFC] border border-[#DCE5FF]">
              <h5 className="text-xs font-bold text-[#172554] uppercase tracking-wider">Thông số Danh mục Đầu tư</h5>

              <div>
                <label className="block text-xs font-medium text-[#647293] mb-1">
                  Tổng vốn NAV danh mục (VNĐ):
                </label>
                <input
                  type="number"
                  step="10000000"
                  value={navCapital}
                  onChange={(e) => setNavCapital(Math.max(1000000, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-sm font-mono font-bold text-[#172554] focus:outline-none focus:border-[#087CFF]"
                />
                {/* Quick NAV chips */}
                <div className="flex items-center gap-2 mt-2">
                  {[50000000, 100000000, 200000000, 500000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNavCapital(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        navCapital === amt
                          ? 'bg-[#087CFF] text-white'
                          : 'bg-white border border-[#DCE5FF] text-[#647293] hover:bg-[#F4F7FF]'
                      }`}
                    >
                      {(amt / 1000000).toFixed(0)} Tr
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#647293] mb-1">
                  Mức rủi ro tối đa cho 1 giao dịch (% NAV):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.5"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="flex-1 accent-[#087CFF]"
                  />
                  <span className="w-16 px-2.5 py-1 text-center bg-white rounded-lg border border-[#DCE5FF] font-mono font-bold text-xs text-[#087CFF]">
                    {riskPercent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-[#647293] mt-1">
                  Khuyến nghị: 1.5% đến 2.0% cho giao dịch ngắn hạn 5–10 phiên
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE5FF] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#647293]">Giá mua dự kiến:</span>
                  <p className="font-mono font-bold text-[#172554] text-sm mt-0.5">
                    {(tradeSetup?.entryPrice || stock.price).toLocaleString()} đ
                  </p>
                </div>
                <div>
                  <span className="text-[#647293]">Mức cắt lỗ dứt khoát:</span>
                  <p className="font-mono font-bold text-[#EF4444] text-sm mt-0.5">
                    {(tradeSetup?.stopLoss || Math.round(stock.price * 0.95)).toLocaleString()} đ
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 2: Kết quả tính toán giải ngân an toàn */}
            <div className="space-y-4 p-5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <h5 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                Kết Quả Tính Toán Khối Lượng Giải Ngân
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#BBF7D0]">
                  <span className="text-[11px] text-[#647293]">Lỗ tối đa cho phép:</span>
                  <p className="text-lg font-bold text-[#EF4444] font-mono mt-0.5">
                    {positionRisk.maxRiskAmount.toLocaleString()} đ
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">Đúng {riskPercent}% tổng vốn NAV</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#BBF7D0]">
                  <span className="text-[11px] text-[#647293]">Mức lỗ trên 1 cổ phiếu:</span>
                  <p className="text-lg font-bold text-[#172554] font-mono mt-0.5">
                    {positionRisk.riskPerShare.toLocaleString()} đ
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">Biên an toàn kỹ thuật</p>
                </div>
              </div>

              {/* Số lượng cổ phiếu khuyến nghị */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#16A34A] space-y-1">
                <span className="text-xs font-bold text-[#16A34A] uppercase">
                  Số lượng cổ phiếu được mua khuyến nghị:
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-[#16A34A] font-mono">
                    {positionRisk.recommendedShares.toLocaleString()}
                  </p>
                  <span className="text-xs font-bold text-[#647293]">cổ phiếu (Đã làm tròn lô 100)</span>
                </div>
                <p className="text-xs text-[#647293]">
                  Tổng giá trị giải ngân: <strong className="text-[#172554] font-mono">{positionRisk.totalTradeValue.toLocaleString()} đ</strong>
                  {' '}(Chiếm <strong className="text-[#087CFF] font-mono">{positionRisk.allocationPercent}%</strong> tổng NAV)
                </p>
              </div>

              {/* Cảnh báo phân bổ quá mức */}
              {positionRisk.isWarningAllocation && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Cảnh báo: Tỷ trọng vị thế vượt quá 35% NAV. Bạn nên hạ bớt mức rủi ro hoặc chia nhỏ đợt giải ngân.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: AI COPILOT REPORT */}
      {activeTab === 'ai' && aiReport && (
        <div className="bg-[#FFFFFF] text-[#172554] rounded-2xl p-6 border border-[#E9D5FF] shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-[#8B36FF] font-bold text-sm">
            <Sparkles className="w-5 h-5 text-[#8B36FF]" />
            <span>KẾT QUẢ ĐÁNH GIÁ CHUYÊN SÂU TỪ TRỢ LÝ STOCKAI COPILOT (5–10 PHIÊN)</span>
          </div>
          <div className="text-xs sm:text-sm text-[#172554] whitespace-pre-line leading-relaxed bg-[#FDF4FF]/40 p-4 rounded-xl border border-[#F5D0FE]">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
}
