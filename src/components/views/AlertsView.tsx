'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  Search, 
  ChevronRight, 
  Zap, 
  Activity, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal, 
  PieChart, 
  Layers, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  MarketAlertItem, 
  MarketOverviewData, 
  MarketAlertFilterCounts,
  Exchange,
  MarketAlertRiskLevel,
  MarketAlertStatus,
  MarketAlertEventType
} from '@/types';

interface AlertsViewProps {
  onSelectStock?: (symbol: string) => void;
}

type FilterTab = 
  | 'all' 
  | 'breakout' 
  | 'failed_breakout' 
  | 'weakening' 
  | 'stop_loss' 
  | 'take_profit' 
  | 'consecutive_up' 
  | 'volume_surge' 
  | 'corporate_action' 
  | 'watchlist';

export default function AlertsView({ onSelectStock }: AlertsViewProps) {
  // State quản lý dữ liệu
  const [overview, setOverview] = useState<MarketOverviewData | null>(null);
  const [alerts, setAlerts] = useState<MarketAlertItem[]>([]);
  const [counts, setCounts] = useState<MarketAlertFilterCounts>({
    all: 0,
    breakout: 0,
    failed_breakout: 0,
    weakening: 0,
    stop_loss: 0,
    take_profit: 0,
    consecutive_up: 0,
    volume_surge: 0,
    corporate_action: 0,
    watchlist: 0,
  });

  // State bộ lọc
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State tải và xử lý
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MarketAlertItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Tải Tổng quan thị trường
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/market-alerts/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải overview thị trường:', err);
    }
  };

  // 2. Tải danh sách cảnh báo theo bộ lọc
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('tab', activeTab);
      if (selectedExchange !== 'ALL') params.append('exchange', selectedExchange);
      if (selectedRisk !== 'ALL') params.append('risk', selectedRisk);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/market-alerts?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAlerts(data.data.alerts);
        setCounts(data.data.counts);
      } else {
        setError(data.message || 'Lỗi tải danh sách cảnh báo');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [activeTab, selectedExchange, selectedRisk, selectedStatus]);

  // Tìm kiếm có debounce nhẹ
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAlerts();
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Quét thị trường tức thời
  const handleScanNow = async () => {
    try {
      setScanning(true);
      const res = await fetch('/api/market-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN_NOW' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.message}`);
        await fetchOverview();
        await fetchAlerts();
      } else {
        showToast(`❌ ${data.message}`);
      }
    } catch {
      showToast('❌ Lỗi kết nối khi quét thị trường');
    } finally {
      setScanning(false);
    }
  };

  // Cập nhật trạng thái của cảnh báo
  const handleUpdateStatus = async (alertId: string, nextStatus: MarketAlertStatus) => {
    try {
      const res = await fetch(`/api/market-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã chuyển trạng thái sang [${nextStatus}]`);
        setAlerts(prev => prev.map(a => a.id === alertId ? data.data : a));
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(data.data);
        }
      }
    } catch {
      showToast('❌ Lỗi cập nhật trạng thái');
    }
  };

  // Định dạng nhãn và màu sắc loại cảnh báo
  const getEventTypeMeta = (type: MarketAlertEventType) => {
    switch (type) {
      case 'BREAKOUT_20':
        return { label: 'Bứt phá đỉnh 20P', color: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]', icon: ArrowUpRight };
      case 'FAILED_BREAKOUT':
        return { label: 'Bứt phá thất bại', color: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]', icon: AlertCircle };
      case 'TREND_WEAKENING':
        return { label: 'Suy yếu xu hướng', color: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]', icon: TrendingDown };
      case 'STOP_LOSS':
        return { label: 'Cắt lỗ phòng thủ', color: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]', icon: XCircle };
      case 'TAKE_PROFIT':
        return { label: 'Chốt lời mục tiêu', color: 'bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]', icon: CheckCircle2 };
      case 'CONSECUTIVE_UP':
        return { label: 'Tăng liên tiếp', color: 'bg-[#CFFAFE] text-[#0891B2] border-[#A5F3FC]', icon: Zap };
      case 'VOLUME_SURGE':
        return { label: 'Khối lượng đột biến', color: 'bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]', icon: Activity };
      case 'CORPORATE_ACTION':
        return { label: 'Sự kiện quyền', color: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]', icon: Calendar };
      case 'PORTFOLIO_WATCHLIST':
        return { label: 'Danh mục/Theo dõi', color: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]', icon: Eye };
      default:
        return { label: type, color: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]', icon: Info };
    }
  };

  // Định dạng trạng thái cảnh báo
  const getStatusBadge = (status: MarketAlertStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">MỚI</span>;
      case 'WATCHING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">ĐANG THEO DÕI</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">ĐÃ XÁC NHẬN</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">THẤT BẠI</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">ĐÃ KẾT THÚC</span>;
    }
  };

  // Định dạng rủi ro
  const getRiskBadge = (risk: MarketAlertRiskLevel) => {
    switch (risk) {
      case 'THẤP':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />Thấp</span>;
      case 'TRUNG BÌNH':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#F59E0B]"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Trung bình</span>;
      case 'CAO':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#EF4444]"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />Cao</span>;
    }
  };

  // Danh sách các tab bộ lọc
  const filterTabs = [
    { id: 'all', label: 'Tất cả cảnh báo', count: counts.all },
    { id: 'breakout', label: 'Mua / Bứt phá', count: counts.breakout },
    { id: 'failed_breakout', label: 'Bứt phá thất bại', count: counts.failed_breakout },
    { id: 'weakening', label: 'Suy yếu xu hướng', count: counts.weakening },
    { id: 'stop_loss', label: 'Cắt lỗ', count: counts.stop_loss },
    { id: 'take_profit', label: 'Chốt lời', count: counts.take_profit },
    { id: 'consecutive_up', label: 'Tăng nhiều phiên', count: counts.consecutive_up },
    { id: 'volume_surge', label: 'Khối lượng đột biến', count: counts.volume_surge },
    { id: 'corporate_action', label: 'Sự kiện quyền', count: counts.corporate_action },
    { id: 'watchlist', label: 'Danh mục theo dõi', count: counts.watchlist },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#E2E8F0] text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* TIÊU ĐỀ PHÂN HỆ VÀ NÚT QUÉT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[22px] lg:text-[24px] font-bold text-[#172033] tracking-tight">
              Cảnh báo Thị trường & Dòng tiền
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
              Version 2.0
            </span>
            {overview && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                overview.dataMode === 'REALTIME' 
                  ? 'bg-[#D1FAE5] text-[#059669]' 
                  : overview.dataMode === 'EOD' 
                  ? 'bg-[#E0E7FF] text-[#4338CA]' 
                  : 'bg-[#FEF3C7] text-[#D97706]'
              }`}>
                {overview.dataMode}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            Giám sát bứt phá 20 phiên, khối lượng đột biến KL/TB20, chuỗi tăng nóng, bẫy bull trap và quản trị rủi ro kỷ luật
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanNow}
            disabled={scanning}
            className="px-3.5 py-2 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Quét toàn bộ cổ phiếu trên 3 sàn HOSE, HNX, UPCoM"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Đang quét...' : 'Quét thị trường'}</span>
          </button>
        </div>
      </div>

      {/* 1. KHU VỰC TỔNG QUAN THỊ TRƯỜNG (MARKET OVERVIEW SECTION) */}
      {overview ? (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs p-4 lg:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: VN-Index & Trạng thái */}
            <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#64748B]">Chỉ số VN-Index</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  overview.marketStatus === 'TĂNG' 
                    ? 'bg-[#D1FAE5] text-[#059669]' 
                    : overview.marketStatus === 'GIẢM' 
                    ? 'bg-[#FEE2E2] text-[#DC2626]' 
                    : 'bg-[#FEF3C7] text-[#D97706]'
                }`}>
                  {overview.marketStatus}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-extrabold text-[#172033] font-mono tabular-nums">
                  {overview.currentValue.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[13px] font-bold font-mono tabular-nums flex items-center ${
                  overview.changeValue >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {overview.changeValue >= 0 ? '+' : ''}{overview.changeValue.toFixed(2)} ({overview.changeValue >= 0 ? '+' : ''}{overview.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]/70 pt-1.5">
                <span>MA20: <b className="font-mono text-[#172033]">{overview.indexMa20.toFixed(1)}</b></span>
                <span>MA50: <b className="font-mono text-[#172033]">{overview.indexMa50.toFixed(1)}</b></span>
              </div>
            </div>

            {/* Card 2: Độ rộng & Tỷ lệ cổ phiếu > MA20 / MA50 */}
            <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#64748B]">
                <span>Độ rộng cổ phiếu trên MA</span>
                <span className="text-[11px] font-normal text-[#94A3B8]">Toàn thị trường</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]/80 text-center">
                  <div className="text-[10px] text-[#64748B] uppercase font-medium">&gt; MA20</div>
                  <div className="text-[16px] font-bold text-[#008FD3] font-mono tabular-nums">
                    {overview.stocksAboveMa20Percent}%
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]/80 text-center">
                  <div className="text-[10px] text-[#64748B] uppercase font-medium">&gt; MA50</div>
                  <div className="text-[16px] font-bold text-[#4F46E5] font-mono tabular-nums">
                    {overview.stocksAboveMa50Percent}%
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]/70 pt-1.5">
                <span className="flex items-center gap-1 text-[#10B981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />Tăng: <b>{overview.advances}</b>
                  {overview.ceilings > 0 && <span className="text-[10px] text-[#9333EA]">({overview.ceilings} trần)</span>}
                </span>
                <span className="flex items-center gap-1 text-[#EF4444]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />Giảm: <b>{overview.declines}</b>
                  {overview.floors > 0 && <span className="text-[10px] text-[#0284C7]">({overview.floors} sàn)</span>}
                </span>
              </div>
            </div>

            {/* Card 3: Tỷ lệ Bứt phá vs Suy yếu */}
            <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#64748B]">
                <span>Xung lực & Tỷ lệ dòng tiền</span>
                <span className="text-[11px] text-[#94A3B8]">Mẫu định lượng</span>
              </div>
              <div className="space-y-1.5 pt-0.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#059669] font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Bứt phá đỉnh:
                  </span>
                  <span className="font-bold text-[#172033] font-mono tabular-nums">{overview.breakoutRatioPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Bứt phá thất bại:
                  </span>
                  <span className="font-bold text-[#172033] font-mono tabular-nums">{overview.failedBreakoutRatioPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#D97706] font-medium flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Suy yếu xu hướng:
                  </span>
                  <span className="font-bold text-[#172033] font-mono tabular-nums">{overview.weakeningRatioPercent}%</span>
                </div>
              </div>
            </div>

            {/* Card 4: Mức rủi ro & Tỷ trọng danh mục tham khảo */}
            <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#64748B]">Mức rủi ro thị trường</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    overview.marketRiskLevel === 'THẤP' 
                      ? 'bg-[#D1FAE5] text-[#059669]' 
                      : overview.marketRiskLevel === 'CAO' 
                      ? 'bg-[#FEE2E2] text-[#DC2626]' 
                      : 'bg-[#FEF3C7] text-[#D97706]'
                  }`}>
                    {overview.marketRiskLevel}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold text-[#172033] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#008FD3]" />
                  <span>Tham khảo: {overview.portfolioAllocationReference.stockPercent}% CP / {overview.portfolioAllocationReference.cashPercent}% Tiền</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                  {overview.portfolioAllocationReference.recommendationText}
                </p>
              </div>
              <div className="text-[10px] text-[#94A3B8] italic mt-2 border-t border-[#E2E8F0]/70 pt-1">
                * Tham khảo định lượng, không cam kết hiệu quả
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#64748B] animate-pulse">
          Đang tính toán tổng quan thị trường từ dữ liệu kiểm định...
        </div>
      )}

      {/* 2. THANH BỘ LỌC CHIP / TABS VÀ TÌM KIẾM */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs p-3.5 lg:p-4 space-y-3">
        {/* Hàng 1: 10 Chip lọc dạng Tab có số đếm thực tế */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#008FD3] text-white border-[#008FD3] shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#172033]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hàng 2: Bộ lọc phụ (Sàn, Rủi ro, Trạng thái, Tìm mã) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-[#F1F5F9] text-xs">
          {/* Lọc theo sàn */}
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium whitespace-nowrap">Sàn:</span>
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] w-full">
              {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSelectedExchange(ex)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedExchange === ex 
                      ? 'bg-white text-[#008FD3] shadow-2xs font-bold' 
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  {ex === 'ALL' ? 'Tất cả' : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Lọc theo mức rủi ro */}
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium whitespace-nowrap">Rủi ro:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 font-semibold text-[#172033]"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="THẤP">Thấp (Đạt chuẩn)</option>
              <option value="TRUNG BÌNH">Trung bình (Theo dõi)</option>
              <option value="CAO">Cao (Cảnh báo gãy)</option>
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 font-semibold text-[#172033]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="NEW">MỚI</option>
              <option value="WATCHING">ĐANG THEO DÕI</option>
              <option value="CONFIRMED">ĐÃ XÁC NHẬN</option>
              <option value="FAILED">THẤT BẠI</option>
              <option value="CLOSED">ĐÃ KẾT THÚC</option>
            </select>
          </div>

          {/* Tìm kiếm mã CP */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã cổ phiếu (VD: HPG)..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold uppercase text-[#172033] placeholder:normal-case placeholder:text-[#94A3B8]"
            />
          </div>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU CẢNH BÁO (ALERTS DATA TABLE) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#64748B] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#008FD3]" />
            <p className="text-xs">Đang tải danh sách cảnh báo thị trường...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#EF4444] space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto text-[#EF4444]" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={fetchAlerts}
              className="px-3 py-1 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] space-y-2">
            <Bell className="w-8 h-8 mx-auto text-[#CBD5E1]" />
            <p className="text-sm font-semibold text-[#172033]">Không tìm thấy cảnh báo nào phù hợp</p>
            <p className="text-xs text-[#94A3B8]">
              Không có cổ phiếu thỏa mãn tiêu chí lọc hiện tại. Nhấn &quot;Quét thị trường&quot; để cập nhật thêm dữ liệu mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] text-[11px] font-semibold border-b border-[#E2E8F0]">
                  <th className="py-3 px-3.5 text-left whitespace-nowrap">Thời gian</th>
                  <th className="py-3 px-3 text-left whitespace-nowrap">Mã CP & Sàn</th>
                  <th className="py-3 px-3 text-left whitespace-nowrap">Loại cảnh báo</th>
                  <th className="py-3 px-3 text-left min-w-[200px]">Mô tả điều kiện</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap font-mono">Giá cảnh báo</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap font-mono">KL/TB20</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap font-mono">Giá hiện tại</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap font-mono">% Thay đổi</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Rủi ro</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {alerts.map((item) => {
                  const meta = getEventTypeMeta(item.eventType);
                  const Icon = meta.icon;
                  const isPositive = item.priceChangeFromAlertPercent > 0;
                  const isNegative = item.priceChangeFromAlertPercent < 0;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-[#F8FAFC] transition duration-150 group"
                    >
                      {/* Thời gian */}
                      <td className="py-2.5 px-3.5 text-[#64748B] text-[11px] whitespace-nowrap font-mono">
                        {item.detectedAt.includes('T') ? item.detectedAt.replace('T', ' ').slice(0, 19) : item.detectedAt}
                      </td>

                      {/* Mã CP & Sàn */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={() => onSelectStock && onSelectStock(item.symbol)}
                            className="font-bold text-[#008FD3] text-[13px] hover:underline cursor-pointer"
                            title="Mở phân tích kỹ thuật"
                          >
                            {item.symbol}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.exchange === 'HOSE' 
                              ? 'bg-[#E0F2FE] text-[#0284C7]' 
                              : item.exchange === 'HNX' 
                              ? 'bg-[#FEF3C7] text-[#D97706]' 
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {item.exchange}
                          </span>
                        </div>
                      </td>

                      {/* Loại cảnh báo */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* Mô tả điều kiện */}
                      <td className="py-2.5 px-3 text-[#172033] text-[11px]">
                        <div>{item.description}</div>
                        {item.cautionNote && (
                          <div className="text-[10px] text-[#D97706] font-medium mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{item.cautionNote}</span>
                          </div>
                        )}
                      </td>

                      {/* Giá tại thời điểm cảnh báo ban đầu (BẢO LƯU) */}
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#64748B] tabular-nums whitespace-nowrap">
                        {item.alertPrice.toLocaleString('vi-VN')}
                      </td>

                      {/* KL/TB20 */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className={`font-bold ${
                          item.volumeRatio >= 2.0 
                            ? 'text-[#9333EA]' 
                            : item.volumeRatio >= 1.5 
                            ? 'text-[#059669]' 
                            : 'text-[#64748B]'
                        }`}>
                          {item.volumeRatio.toFixed(2).replace('.', ',')}x
                        </span>
                      </td>

                      {/* Giá hiện tại */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172033] tabular-nums whitespace-nowrap">
                        {item.currentPrice.toLocaleString('vi-VN')}
                      </td>

                      {/* % Thay đổi từ giá cảnh báo */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={`inline-flex items-center ${
                          isPositive ? 'text-[#10B981]' : isNegative ? 'text-[#EF4444]' : 'text-[#64748B]'
                        }`}>
                          {isPositive ? '+' : ''}{item.priceChangeFromAlertPercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Rủi ro */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getRiskBadge(item.riskLevel)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectStock && onSelectStock(item.symbol)}
                            className="px-2 py-1 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#008FD3] text-[11px] font-semibold transition flex items-center gap-0.5"
                            title="Phân tích mã này"
                          >
                            <span>Phân tích</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setSelectedAlert(item)}
                            className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#172033] transition"
                            title="Xem chi tiết & Lịch sử trạng thái"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL CHI TIẾT CẢNH BÁO (ALERT DETAIL MODAL) */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#172033]">{selectedAlert.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#008FD3]">
                    {selectedAlert.symbol} ({selectedAlert.exchange})
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">Phát hiện lúc: {selectedAlert.detectedAt}</p>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-[#94A3B8] hover:text-[#172033] p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Chi tiết chỉ báo & Thông số */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <div className="text-[10px] text-[#64748B]">Giá ban đầu</div>
                <div className="font-mono font-bold text-[#172033] text-[13px] mt-0.5">
                  {selectedAlert.alertPrice.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <div className="text-[10px] text-[#64748B]">Giá hiện tại</div>
                <div className="font-mono font-bold text-[#172033] text-[13px] mt-0.5">
                  {selectedAlert.currentPrice.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <div className="text-[10px] text-[#64748B]">Tỷ lệ KL/TB20</div>
                <div className="font-mono font-bold text-[#9333EA] text-[13px] mt-0.5">
                  {selectedAlert.volumeRatio.toFixed(2).replace('.', ',')}x
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <div className="text-[10px] text-[#64748B]">% Biến động</div>
                <div className={`font-mono font-bold text-[13px] mt-0.5 ${
                  selectedAlert.priceChangeFromAlertPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {selectedAlert.priceChangeFromAlertPercent >= 0 ? '+' : ''}{selectedAlert.priceChangeFromAlertPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Mô tả chi tiết & Cảnh báo */}
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1.5 text-xs">
              <div className="font-semibold text-[#172033]">Diễn giải điều kiện kỹ thuật:</div>
              <p className="text-[#475569] leading-relaxed">{selectedAlert.description}</p>
              {selectedAlert.cautionNote && (
                <div className="bg-[#FFFBEB] p-2 rounded-lg border border-[#FDE68A] text-[#B45309] text-[11px] font-medium flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{selectedAlert.cautionNote}</span>
                </div>
              )}
            </div>

            {/* Nhật ký chuyển tiếp trạng thái (Audit Trail) */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Nhật ký chuyển tiếp trạng thái (Audit Log):</span>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-2.5 max-h-36 overflow-y-auto space-y-2 text-[11px]">
                {selectedAlert.statusLogs && selectedAlert.statusLogs.length > 0 ? (
                  selectedAlert.statusLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b border-[#F1F5F9] pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-[#008FD3]">[{log.status}]</span> {log.note || 'Cập nhật hệ thống'}
                      </div>
                      <span className="text-[#94A3B8] font-mono whitespace-nowrap ml-2">
                        {log.timestamp.slice(11, 19) || log.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[#94A3B8]">Chưa có lịch sử trạng thái bổ sung.</div>
                )}
              </div>
            </div>

            {/* Chuyển trạng thái thủ công */}
            <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B]">Đổi trạng thái:</span>
                {(['WATCHING', 'CONFIRMED', 'CLOSED'] as MarketAlertStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedAlert.id, st)}
                    disabled={selectedAlert.status === st}
                    className="px-2 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] disabled:opacity-40 font-semibold text-[10px]"
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onSelectStock) onSelectStock(selectedAlert.symbol);
                    setSelectedAlert(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#008FD3] text-white font-semibold hover:bg-[#007bb8] transition flex items-center gap-1"
                >
                  <span>Mở phân tích CP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
