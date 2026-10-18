'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  ColorType,
  LineStyle,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import {
  CandleData,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVolumeSeries,
  TradeSetup,
  RichChartMarker,
} from '@/lib/chart-indicators';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Activity,
  Sliders,
  TrendingUp,
  Info,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D' | '1W';

interface TechnicalChartProps {
  symbol: string;
  candles: CandleData[];
  tradeSetup?: TradeSetup | null;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  availableTimeframes?: Timeframe[];
  providerName?: string;
  dataMode?: string;
  lastUpdated?: string;
  hasData?: boolean;
  unavailabilityNotice?: string;
}

export default function TechnicalChart({
  symbol,
  candles,
  tradeSetup,
  timeframe,
  onTimeframeChange,
  availableTimeframes = ['1D', '1W'],
  providerName = 'StockAI Data Engine',
  dataMode = 'EOD',
  lastUpdated,
  hasData = true,
  unavailabilityNotice,
}: TechnicalChartProps) {
  // Container refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  // Chart & Series instances
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  // Indicator Visibility States
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showMA200, setShowMA200] = useState(false);
  const [showEMA20, setShowEMA20] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showTradeLevels, setShowTradeLevels] = useState(true);
  const [showSignals, setShowSignals] = useState(true); // Bật/Tắt lớp mũi tên Mua/Bán

  // Hover Crosshair Legend State
  const [hoverLegend, setHoverLegend] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    changePct: number;
    ma20?: number;
    ma50?: number;
    rsi?: number;
  } | null>(null);

  // Hovered Signal Marker State (cho tooltip chi tiết khi rê chuột vào nến có mũi tên)
  const [hoveredSignalMarker, setHoveredSignalMarker] = useState<RichChartMarker | null>(null);

  // Compute calculated indicator series
  const indicatorsData = useMemo(() => {
    if (!candles || candles.length === 0) {
      return {
        ma20: [],
        ma50: [],
        ma200: [],
        ema20: [],
        bb: { upper: [], middle: [], lower: [] },
        rsi: [],
        macd: { macd: [], signal: [], histogram: [] },
        volume: [],
      };
    }

    return {
      ma20: calculateSMA(candles, 20),
      ma50: calculateSMA(candles, 50),
      ma200: calculateSMA(candles, 200),
      ema20: calculateEMA(candles, 20),
      bb: calculateBollingerBands(candles, 20, 2),
      rsi: calculateRSI(candles, 14),
      macd: calculateMACD(candles, 12, 26, 9),
      volume: calculateVolumeSeries(candles),
    };
  }, [candles]);

  // Latest candle for fallback legend
  const latestCandle = candles && candles.length > 0 ? candles[candles.length - 1] : null;
  const prevCandle = candles && candles.length > 1 ? candles[candles.length - 2] : null;
  const defaultChangePct =
    latestCandle && prevCandle
      ? Math.round(((latestCandle.close - prevCandle.close) / prevCandle.close) * 1000) / 10
      : 0;

  // Initialize and update Main Chart
  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    // Clear previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#F1F5F9', style: LineStyle.Dotted },
        horzLines: { color: '#F1F5F9', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#94A3B8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          color: '#94A3B8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.22 : 0.08,
        },
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: timeframe !== '1D' && timeframe !== '1W',
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series (Chuẩn màu chứng khoán VN: Xanh tăng, Đỏ giảm)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: true,
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const candleChartData = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candlestickSeries.setData(candleChartData);

    // 2. Volume Series (Khối lượng khớp lệnh)
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#94A3B8',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale',
      });

      chart.priceScale('volume_scale').applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      });

      volumeSeries.setData(
        indicatorsData.volume.map((v) => ({
          time: v.time as any,
          value: v.value,
          color: v.color,
        }))
      );
    }

    // 3. Indicator Lines
    if (showMA20 && indicatorsData.ma20.length > 0) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: '#F59E0B', // Hổ phách/Vàng
        lineWidth: 2,
        title: 'MA20',
        crosshairMarkerVisible: true,
      });
      ma20Series.setData(indicatorsData.ma20.map((d) => ({ time: d.time as any, value: d.value })));
    }

    if (showMA50 && indicatorsData.ma50.length > 0) {
      const ma50Series = chart.addSeries(LineSeries, {
        color: '#008FD3', // Xanh dương chuẩn StockAI
        lineWidth: 2,
        title: 'MA50',
        crosshairMarkerVisible: true,
      });
      ma50Series.setData(indicatorsData.ma50.map((d) => ({ time: d.time as any, value: d.value })));
    }

    if (showMA200 && indicatorsData.ma200.length > 0) {
      const ma200Series = chart.addSeries(LineSeries, {
        color: '#8B5CF6', // Tím
        lineWidth: 2,
        title: 'MA200',
        crosshairMarkerVisible: true,
      });
      ma200Series.setData(indicatorsData.ma200.map((d) => ({ time: d.time as any, value: d.value })));
    }

    if (showEMA20 && indicatorsData.ema20.length > 0) {
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#06B6D4', // Cyan
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'EMA20',
        crosshairMarkerVisible: true,
      });
      ema20Series.setData(indicatorsData.ema20.map((d) => ({ time: d.time as any, value: d.value })));
    }

    // Bollinger Bands
    if (showBollinger && indicatorsData.bb.upper.length > 0) {
      const upperSeries = chart.addSeries(LineSeries, {
        color: '#6366F1',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: 'BB Upper',
      });
      upperSeries.setData(indicatorsData.bb.upper.map((d) => ({ time: d.time as any, value: d.value })));

      const midSeries = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 1,
        title: 'BB Mid',
      });
      midSeries.setData(indicatorsData.bb.middle.map((d) => ({ time: d.time as any, value: d.value })));

      const lowerSeries = chart.addSeries(LineSeries, {
        color: '#6366F1',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: 'BB Lower',
      });
      lowerSeries.setData(indicatorsData.bb.lower.map((d) => ({ time: d.time as any, value: d.value })));
    }

    // 4. Trade Setup Price Lines (Vùng Mua, Cắt Lỗ, TP1, TP2, Kháng Cự/Hỗ Trợ)
    priceLinesRef.current = [];
    if (showTradeLevels && tradeSetup) {
      // Vùng mua tham khảo
      const buyLine = candlestickSeries.createPriceLine({
        price: tradeSetup.entryPrice,
        color: '#008FD3',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `VÙNG MUA (${tradeSetup.entryPrice.toLocaleString()} đ)`,
      });
      priceLinesRef.current.push(buyLine);

      // Cắt lỗ dứt khoát
      const stopLine = candlestickSeries.createPriceLine({
        price: tradeSetup.stopLoss,
        color: '#F43F5E',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `CẮT LỖ (${tradeSetup.stopLoss.toLocaleString()} đ -${tradeSetup.stopLossPercent}%)`,
      });
      priceLinesRef.current.push(stopLine);

      // Mục tiêu 1 (T+5)
      const tp1Line = candlestickSeries.createPriceLine({
        price: tradeSetup.target1,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `TP1 T+5 (${tradeSetup.target1.toLocaleString()} đ +${tradeSetup.target1Percent}%)`,
      });
      priceLinesRef.current.push(tp1Line);

      // Mục tiêu 2 (T+10)
      const tp2Line = candlestickSeries.createPriceLine({
        price: tradeSetup.target2,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP2 T+10 (${tradeSetup.target2.toLocaleString()} đ +${tradeSetup.target2Percent}%)`,
      });
      priceLinesRef.current.push(tp2Line);

      // Hỗ trợ then chốt
      if (tradeSetup.supportLevels && tradeSetup.supportLevels.length > 0) {
        const supLvl = tradeSetup.supportLevels[tradeSetup.supportLevels.length - 1];
        const supLine = candlestickSeries.createPriceLine({
          price: supLvl,
          color: '#059669',
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          axisLabelVisible: true,
          title: `HỖ TRỢ (${supLvl.toLocaleString()})`,
        });
        priceLinesRef.current.push(supLine);
      }

      // Kháng cự then chốt
      if (tradeSetup.resistanceLevels && tradeSetup.resistanceLevels.length > 0) {
        const resLvl = tradeSetup.resistanceLevels[0];
        const resLine = candlestickSeries.createPriceLine({
          price: resLvl,
          color: '#D97706',
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          axisLabelVisible: true,
          title: `KHÁNG CỰ (${resLvl.toLocaleString()})`,
        });
        priceLinesRef.current.push(resLine);
      }
    }

    // 5. Signal Markers trên nến Nhật (Buy/Sell Arrow Signals & 5-Day Consecutive Gain Events)
    if (showSignals && tradeSetup) {
      const markersSource = (tradeSetup.richMarkers && tradeSetup.richMarkers.length > 0)
        ? tradeSetup.richMarkers
        : tradeSetup.markers || [];

      if (markersSource.length > 0) {
        try {
          const formattedMarkers = markersSource.map((m) => ({
            time: m.time as any,
            position: m.position,
            color: m.color,
            shape: m.shape,
            text: m.text,
            size: m.size || 2,
          }));
          createSeriesMarkers(candlestickSeries, formattedMarkers);
        } catch (err) {
          console.warn('Lỗi hiển thị Markers trên Lightweight Charts:', err);
        }
      }
    }

    // 6. Crosshair Move Handler để cập nhật Legend động & Tooltip Mũi tên Mua/Bán
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverLegend(null);
        setHoveredSignalMarker(null);
        return;
      }

      const candleVal: any = param.seriesData.get(candlestickSeries);
      if (candleVal) {
        const timeStr = typeof param.time === 'string' ? param.time : JSON.stringify(param.time);
        const candleMatch = candles.find((c) => c.time === timeStr);
        const volVal = candleMatch ? candleMatch.volume : 0;
        const changePct = candleMatch && prevCandle
          ? Math.round(((candleVal.close - prevCandle.close) / prevCandle.close) * 1000) / 10
          : 0;

        // Tìm MA20 & RSI tương ứng nếu có
        const ma20Item = indicatorsData.ma20.find((d) => d.time === timeStr);
        const ma50Item = indicatorsData.ma50.find((d) => d.time === timeStr);
        const rsiItem = indicatorsData.rsi.find((d) => d.time === timeStr);

        setHoverLegend({
          time: timeStr,
          open: candleVal.open,
          high: candleVal.high,
          low: candleVal.low,
          close: candleVal.close,
          volume: volVal,
          changePct,
          ma20: ma20Item?.value,
          ma50: ma50Item?.value,
          rsi: rsiItem?.value,
        });

        // Tìm xem cây nến này có phát sinh Tín hiệu Mua/Bán hoặc Sự kiện không
        if (showSignals && tradeSetup?.richMarkers) {
          const matchMarker = tradeSetup.richMarkers.find((m) => m.time === timeStr);
          setHoveredSignalMarker(matchMarker || null);
        } else {
          setHoveredSignalMarker(null);
        }
      } else {
        setHoveredSignalMarker(null);
      }
    });

    // 7. Auto Resize via ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && chartInstanceRef.current) {
        const { width } = entries[0].contentRect;
        chartInstanceRef.current.applyOptions({ width });
      }
    });
    resizeObserver.observe(container);

    // Fit content
    chart.timeScale().fitContent();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [
    candles,
    timeframe,
    showMA20,
    showMA50,
    showMA200,
    showEMA20,
    showBollinger,
    showVolume,
    showTradeLevels,
    tradeSetup,
  ]);

  // Sub-Chart: RSI(14)
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || indicatorsData.rsi.length === 0) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const container = rsiContainerRef.current;
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
    }

    const rsiChart = createChart(container, {
      width: container.clientWidth,
      height: 140,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F8FAFC', style: LineStyle.Dotted },
        horzLines: { color: '#F1F5F9', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#E2E8F0',
        visible: false, // Ẩn trục thời gian vì đã có ở chart chính
      },
    });
    rsiChartRef.current = rsiChart;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#008FD3',
      lineWidth: 2,
      title: 'RSI(14)',
    });
    rsiSeries.setData(indicatorsData.rsi.map((d) => ({ time: d.time as any, value: d.value })));

    // Các ngưỡng Quá mua 70, Quá bán 30, Trung tính 50
    rsiSeries.createPriceLine({
      price: 70,
      color: '#F43F5E',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'QUÁ MUA (70)',
    });
    rsiSeries.createPriceLine({
      price: 50,
      color: '#94A3B8',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: '#10B981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'QUÁ BÁN (30)',
    });

    rsiChart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: entries[0].contentRect.width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      rsiChart.remove();
      rsiChartRef.current = null;
    };
  }, [showRSI, indicatorsData.rsi]);

  // Sub-Chart: MACD(12, 26, 9)
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current || indicatorsData.macd.macd.length === 0) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const container = macdContainerRef.current;
    if (macdChartRef.current) {
      macdChartRef.current.remove();
    }

    const macdChart = createChart(container, {
      width: container.clientWidth,
      height: 140,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F8FAFC', style: LineStyle.Dotted },
        horzLines: { color: '#F1F5F9', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: '#E2E8F0',
        visible: false,
      },
    });
    macdChartRef.current = macdChart;

    // MACD Histogram
    const histSeries = macdChart.addSeries(HistogramSeries, {
      title: 'MACD Hist',
    });
    histSeries.setData(
      indicatorsData.macd.histogram.map((h) => ({
        time: h.time as any,
        value: h.value,
        color: h.color,
      }))
    );

    // MACD Line (12, 26)
    const macdLineSeries = macdChart.addSeries(LineSeries, {
      color: '#008FD3',
      lineWidth: 2,
      title: 'MACD',
    });
    macdLineSeries.setData(indicatorsData.macd.macd.map((m) => ({ time: m.time as any, value: m.value })));

    // Signal Line (9)
    const signalLineSeries = macdChart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'Signal',
    });
    signalLineSeries.setData(indicatorsData.macd.signal.map((s) => ({ time: s.time as any, value: s.value })));

    macdChart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: entries[0].contentRect.width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      macdChart.remove();
      macdChartRef.current = null;
    };
  }, [showMACD, indicatorsData.macd]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (factor: number) => {
    if (!chartInstanceRef.current) return;
    const timeScale = chartInstanceRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const span = range.to - range.from;
    const center = (range.from + range.to) / 2;
    const newSpan = span * factor;
    timeScale.setVisibleLogicalRange({
      from: center - newSpan / 2,
      to: center + newSpan / 2,
    });
  };

  const handleResetView = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  // Helper cho timeframe availability
  const isTfAvailable = (tf: Timeframe) => availableTimeframes.includes(tf);

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
      {/* 1. TOP TOOLBAR: Timeframes + Indicators Toggle + Actions */}
      <div className="p-3 lg:p-4 border-b border-[#E2E8F0] bg-[#FAFAFC] flex flex-wrap items-center justify-between gap-3">
        {/* Timeframe selector (Chỉ cho phép chọn khung có dữ liệu thực tế) */}
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] p-1 rounded-xl border border-[#E2E8F0]">
          {(['1m', '5m', '15m', '1h', '1D', '1W'] as Timeframe[]).map((tf) => {
            const available = isTfAvailable(tf);
            const isSelected = timeframe === tf;

            return (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                title={available ? `Khung ${tf}` : `Khung ${tf} (Chưa có kết nối Intraday Feed)`}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#008FD3] text-white shadow-2xs'
                    : available
                    ? 'text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9]'
                    : 'text-[#94A3B8] opacity-60 hover:opacity-100 hover:bg-[#FEE2E2]/40'
                }`}
              >
                <span>{tf}</span>
                {!available && <span className="text-[9px] text-[#F43F5E]">•</span>}
              </button>
            );
          })}
        </div>

        {/* Indicators Toolbar Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowMA20(!showMA20)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showMA20
                ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span>MA20</span>
          </button>

          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showMA50
                ? 'bg-[#E0F2FE] text-[#008FD3] border-[#BAE6FD]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#008FD3]"></span>
            <span>MA50</span>
          </button>

          <button
            onClick={() => setShowMA200(!showMA200)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showMA200
                ? 'bg-[#EDE9FE] text-[#8B5CF6] border-[#DDD6FE]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
            <span>MA200</span>
          </button>

          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showEMA20
                ? 'bg-[#CFFAFE] text-[#0891B2] border-[#A5F3FC]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span>
            <span>EMA20</span>
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showBollinger
                ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#6366F1]"></span>
            <span>BB(20,2)</span>
          </button>

          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showRSI
                ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <Activity className="w-3 h-3 text-[#0284C7]" />
            <span>RSI(14)</span>
          </button>

          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showMACD
                ? 'bg-[#FDF4FF] text-[#C026D3] border-[#F5D0FE]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-[#C026D3]" />
            <span>MACD</span>
          </button>

          <button
            onClick={() => setShowTradeLevels(!showTradeLevels)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showTradeLevels
                ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
            title="Bật/Tắt hiển thị Vùng Mua, Cắt Lỗ, TP1, TP2 trên biểu đồ"
          >
            {showTradeLevels ? <Eye className="w-3 h-3 text-[#059669]" /> : <EyeOff className="w-3 h-3 text-[#94A3B8]" />}
            <span>Mức Kỹ Thuật</span>
          </button>

          {/* Nút bật/tắt Lớp Mũi tên Mua/Bán */}
          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showSignals
                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
            title="Bật/Tắt hiển thị mũi tên Mua (Xanh ↑) và Bán (Đỏ ↓) trên biểu đồ"
          >
            <span className="font-extrabold text-[12px] text-[#10B981]">↑</span>
            <span className="font-extrabold text-[12px] text-[#F43F5E]">↓</span>
            <span>Mũi Tên Mua/Bán</span>
          </button>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition"
            title="Phóng to nến (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition"
            title="Thu nhỏ nến (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition"
            title="Căn chỉnh toàn bộ (Fit)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. REALTIME / STATUS BAR & DYNAMIC HOVER LEGEND */}
      <div className="px-4 py-2 bg-[#FFFFFF] border-b border-[#F1F5F9] flex flex-wrap items-center justify-between text-xs gap-2">
        {/* Dynamic Candlestick Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-bold text-[#172033]">{symbol}</span>
          <span className="text-[#64748B] font-mono">
            {hoverLegend ? hoverLegend.time : latestCandle?.time || '—'}
          </span>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>
              Mở: <strong className="text-[#172033]">{(hoverLegend ? hoverLegend.open : latestCandle?.open || 0).toLocaleString()}</strong>
            </span>
            <span>
              Cao: <strong className="text-[#10B981]">{(hoverLegend ? hoverLegend.high : latestCandle?.high || 0).toLocaleString()}</strong>
            </span>
            <span>
              Thấp: <strong className="text-[#F43F5E]">{(hoverLegend ? hoverLegend.low : latestCandle?.low || 0).toLocaleString()}</strong>
            </span>
            <span>
              Đóng: <strong className={(hoverLegend ? hoverLegend.changePct : defaultChangePct) >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}>
                {(hoverLegend ? hoverLegend.close : latestCandle?.close || 0).toLocaleString()}
              </strong>
            </span>
            <span className={`font-semibold ${(hoverLegend ? hoverLegend.changePct : defaultChangePct) >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
              ({(hoverLegend ? hoverLegend.changePct : defaultChangePct) >= 0 ? '+' : ''}
              {(hoverLegend ? hoverLegend.changePct : defaultChangePct)}%)
            </span>
            <span>
              KL: <strong className="text-[#172033]">{(hoverLegend ? hoverLegend.volume : latestCandle?.volume || 0).toLocaleString()}</strong>
            </span>
          </div>

          {/* Indicator values on hover */}
          {showMA20 && hoverLegend?.ma20 && (
            <span className="text-[#B45309] font-mono text-[11px]">
              MA20: <strong>{hoverLegend.ma20.toLocaleString()}</strong>
            </span>
          )}
          {showMA50 && hoverLegend?.ma50 && (
            <span className="text-[#008FD3] font-mono text-[11px]">
              MA50: <strong>{hoverLegend.ma50.toLocaleString()}</strong>
            </span>
          )}
          {showRSI && hoverLegend?.rsi && (
            <span className="text-[#0284C7] font-mono text-[11px]">
              RSI: <strong>{hoverLegend.rsi}</strong>
            </span>
          )}
        </div>

        {/* Data Source & Integrity Badge (Trung thực, không giả lập thời gian thực) */}
        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0]">
            <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}></span>
            <span>{providerName}</span>
            <span className="font-bold text-[#172033]">({dataMode})</span>
          </span>
          {lastUpdated && <span>Cập nhật: {lastUpdated}</span>}
        </div>
      </div>

      {/* 2.1 INTERACTIVE SIGNAL TOOLTIP BANNER (Khi rê chuột vào nến có Mũi tên Mua/Bán) */}
      {showSignals && hoveredSignalMarker && (
        <div className={`mx-3 sm:mx-4 my-2 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in transition ${
          hoveredSignalMarker.action === 'BUY'
            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
            : hoveredSignalMarker.action === 'SELL'
            ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center shrink-0 ${
              hoveredSignalMarker.action === 'BUY'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : hoveredSignalMarker.action === 'SELL'
                ? 'bg-[#F43F5E] text-white shadow-2xs'
                : 'bg-[#F59E0B] text-white shadow-2xs'
            }`}>
              {hoveredSignalMarker.action === 'BUY' ? '↑' : hoveredSignalMarker.action === 'SELL' ? '↓' : '●'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold uppercase tracking-wide text-[11px]">
                  {hoveredSignalMarker.action === 'BUY' ? 'TÍN HIỆU MUA' : hoveredSignalMarker.action === 'SELL' ? 'TÍN HIỆU BÁN' : 'SỰ KIỆN KỸ THUẬT'}
                </span>
                <span className="font-bold font-mono px-1.5 py-0.2 rounded bg-white/80 border border-current">
                  {hoveredSignalMarker.symbol} • {hoveredSignalMarker.time}
                </span>
                <span className="font-bold font-mono">
                  Giá đóng cửa: {hoveredSignalMarker.price.toLocaleString()} đ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 border border-current">
                  {hoveredSignalMarker.confirmationStatus}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed opacity-95">
                <strong>Lý do phát tín hiệu:</strong> {hoveredSignalMarker.rationale}
              </p>
            </div>
          </div>
          {hoveredSignalMarker.metrics && (
            <div className="flex items-center gap-2 font-mono text-[11px] bg-white/80 px-2.5 py-1 rounded-lg border border-current">
              {hoveredSignalMarker.metrics.rsi !== undefined && <span>RSI: {hoveredSignalMarker.metrics.rsi}</span>}
              {hoveredSignalMarker.metrics.volRatio !== undefined && <span>Vol: {hoveredSignalMarker.metrics.volRatio}x</span>}
              {hoveredSignalMarker.metrics.consecutiveGains !== undefined && (
                <span>Chuỗi tăng: {hoveredSignalMarker.metrics.consecutiveGains} phiên</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN CANDLESTICK CHART CONTAINER */}
      <div className="relative w-full flex-1 min-h-[460px] bg-white">
        {/* Notice banner if current timeframe has no data (Intraday without feed) */}
        {!hasData && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#172033] mb-1">
              Chưa có dữ liệu thị trường cho khung {timeframe}
            </h4>
            <p className="text-xs text-[#64748B] max-w-md leading-relaxed mb-4">
              {unavailabilityNotice ||
                `Hệ thống phân tích StockAI hiện đang cung cấp đầy đủ dữ liệu nến ngày (1D) và nến tuần (1W) từ nguồn chính thức ${providerName}. Dữ liệu khung Intraday (1m, 5m, 15m, 1h) yêu cầu kết nối API Intraday đối tác có bản quyền.`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTimeframeChange('1D')}
                className="px-4 py-2 rounded-xl bg-[#008FD3] text-white text-xs font-semibold hover:bg-[#007bb8] transition shadow-xs"
              >
                Chuyển sang nến Ngày (1D)
              </button>
              <button
                onClick={() => onTimeframeChange('1W')}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-[#172033] text-xs font-semibold hover:bg-[#E2E8F0] transition border border-[#E2E8F0]"
              >
                Xem nến Tuần (1W)
              </button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-[480px]" />
      </div>

      {/* 4. SUB-PANE: RSI(14) */}
      {showRSI && hasData && (
        <div className="border-t border-[#E2E8F0] bg-[#FFFFFF] p-2">
          <div className="flex items-center justify-between text-xs px-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0284C7]">RSI (14 chu kỳ)</span>
              <span className="text-[11px] text-[#64748B]">Wilder RSI</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-[#F43F5E]">Quá mua: 70</span>
              <span className="text-[#64748B]">Trung tính: 50</span>
              <span className="text-[#10B981]">Quá bán: 30</span>
            </div>
          </div>
          <div ref={rsiContainerRef} className="w-full h-[140px]" />
        </div>
      )}

      {/* 5. SUB-PANE: MACD(12, 26, 9) */}
      {showMACD && hasData && (
        <div className="border-t border-[#E2E8F0] bg-[#FFFFFF] p-2">
          <div className="flex items-center justify-between text-xs px-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#C026D3]">MACD (12, 26, 9)</span>
              <span className="text-[11px] text-[#008FD3] font-mono">Đường MACD</span>
              <span className="text-[11px] text-[#F59E0B] font-mono">Đường Tín hiệu</span>
            </div>
            <span className="text-[11px] text-[#64748B]">Xung lực động lượng thị trường</span>
          </div>
          <div ref={macdContainerRef} className="w-full h-[140px]" />
        </div>
      )}
    </div>
  );
}
