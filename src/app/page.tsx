'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { ActiveMenu } from '@/components/Sidebar';
import Header from '@/components/Header';
import RightPanel from '@/components/RightPanel';
import StatCards from '@/components/StatCards';
import AssetChart from '@/components/AssetChart';
import PortfolioDonut from '@/components/PortfolioDonut';
import TopMovers from '@/components/TopMovers';
import T3SignalsTable from '@/components/T3SignalsTable';
import T3DetailModal from '@/components/T3DetailModal';

// Views
import BmscAccountView from '@/components/views/BmscAccountView';
import PortfolioView from '@/components/views/PortfolioView';
import TransactionsView from '@/components/views/TransactionsView';
import MarketBoardView from '@/components/views/MarketBoardView';
import ScreenerView from '@/components/views/ScreenerView';
import T3RadarView from '@/components/views/T3RadarView';
import StockAnalysisView from '@/components/views/StockAnalysisView';
import AiAssistantView from '@/components/views/AiAssistantView';
import WatchlistView from '@/components/views/WatchlistView';
import AlertsView from '@/components/views/AlertsView';
import ApiCenterView from '@/components/views/ApiCenterView';
import BacktestView from '@/components/views/BacktestView';
import SettingsView from '@/components/views/SettingsView';

import { 
  PortfolioSummary, 
  PortfolioItem, 
  Transaction, 
  T3Signal, 
  StockQuote, 
  MarketIndex, 
  NewsItem, 
  ApiProvider 
} from '@/types';

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('FPT');
  const [selectedT3Signal, setSelectedT3Signal] = useState<T3Signal | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');

  // State data
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalAssets: 1268450000,
    stockValue: 985320000,
    cash: 283130000,
    realizedPnL: 48320000,
    unrealizedPnL: 64200000,
    totalReturnPercent: 8.92,
    dailyChange: 35620000,
    dailyChangePercent: 2.89,
  });

  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [topGainers, setTopGainers] = useState<StockQuote[]>([]);
  const [topLosers, setTopLosers] = useState<StockQuote[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [t3Signals, setT3Signals] = useState<T3Signal[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);

  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Initial Data
  const loadPortfolioData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setHoldings(data.data.holdings);
        setTransactions(data.data.transactions);
      }
    } catch (e) {
      console.error('Lỗi tải portfolio:', e);
    }
  };

  const loadMarketData = async () => {
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      if (data.success) {
        setQuotes(data.data.quotes);
        setTopGainers(data.data.topGainers);
        setTopLosers(data.data.topLosers);
        setIndices(data.data.indices);
      }
    } catch (e) {
      console.error('Lỗi tải market:', e);
    }
  };

  const loadT3Signals = async () => {
    try {
      const res = await fetch('/api/t3-signals');
      const data = await res.json();
      if (data.success) {
        setT3Signals(data.data.signals);
      }
    } catch (e) {
      console.error('Lỗi tải T3 signals:', e);
    }
  };

  const loadApiProviders = async () => {
    try {
      const res = await fetch('/api/api-center');
      const data = await res.json();
      if (data.success) {
        setApiProviders(data.data.providers);
      }
    } catch (e) {
      console.error('Lỗi tải API providers:', e);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    loadMarketData();
    loadT3Signals();
    loadApiProviders();

    // Default static news from image
    setNews([
      { id: '1', title: 'VN-Index tăng gần 13 điểm, dòng tiền quay lại nhóm ngân hàng', source: 'Cafef', timeAgo: '2 giờ trước' },
      { id: '2', title: 'FPT công bố kết quả kinh doanh Quý 1/2025 với mức tăng trưởng ấn tượng', source: 'VnExpress', timeAgo: '3 giờ trước' },
      { id: '3', title: 'Giá dầu giảm mạnh, tác động đến nhóm cổ phiếu dầu khí', source: 'Vietstock', timeAgo: '5 giờ trước' },
    ]);
  }, []);

  // Handlers
  const handleTestApi = async (providerCode: string) => {
    setTestingProvider(providerCode);
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_CONNECTION', providerCode }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.data.message}`);
        loadApiProviders();
      } else {
        showToast(`❌ ${data.message}`);
      }
    } catch {
      showToast('❌ Lỗi kiểm tra kết nối API');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggleFavorite = async (signalId: string) => {
    try {
      const res = await fetch('/api/t3-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_FAVORITE', signalId }),
      });
      const data = await res.json();
      if (data.success) {
        setT3Signals(prev => prev.map(s => s.id === signalId ? { ...s, isFavorite: data.isFavorite } : s));
        showToast(data.isFavorite ? '⭐ Đã thêm vào danh sách yêu thích' : 'Đã bỏ theo dõi');
      }
    } catch {
      showToast('Lỗi cập nhật yêu thích');
    }
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    setActiveMenu('analysis');
  };

  return (
    <div className="flex h-screen bg-[#F5F8FC] overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#E2E8F0] text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => setActiveMenu(menu)}
        onCheckConnection={() => handleTestApi('VIETSTOCK')}
        isCheckingConn={testingProvider === 'VIETSTOCK'}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          indices={indices}
          onSelectStock={handleSelectStock}
          onOpenSettings={() => setActiveMenu('settings')}
          quotes={quotes}
        />

        {/* Scrollable Center Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Center Content Column */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Menu 1: Tổng quan Dashboard */}
              {activeMenu === 'dashboard' && (
                <>
                  {/* Dashboard Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#172033] tracking-tight">Tổng quan danh mục</h2>
                      <p className="text-xs text-[#64748B] mt-0.5">Theo dõi tài sản và hiệu quả đầu tư của bạn</p>
                    </div>

                    {/* Time Filter Pills */}
                    <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-xl border border-[#E2E8F0] shadow-2xs">
                      {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeFilter(tf)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            timeFilter === tf
                              ? 'bg-[#008FD3] text-white shadow-2xs'
                              : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]'
                          }`}
                        >
                          {tf === 'ALL' ? 'Tất cả' : tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <StatCards summary={summary} />

                  {/* 2 Interactive Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <AssetChart />
                    </div>
                    <div>
                      <PortfolioDonut />
                    </div>
                  </div>

                  {/* Top Movers Row */}
                  <TopMovers
                    topGainers={topGainers}
                    topLosers={topLosers}
                    indices={indices}
                    onSelectStock={handleSelectStock}
                    onViewAllStocks={() => setActiveMenu('market')}
                  />

                  {/* T+3 Signals Table */}
                  <T3SignalsTable
                    signals={t3Signals}
                    onSelectSignal={(s) => setSelectedT3Signal(s)}
                    onToggleFavorite={handleToggleFavorite}
                    onViewAllSignals={() => setActiveMenu('t3')}
                  />
                </>
              )}

              {/* Menu 2: BMSC Account */}
              {activeMenu === 'bmsc' && (
                <BmscAccountView
                  summary={summary}
                  holdings={holdings}
                  onRefresh={loadPortfolioData}
                />
              )}

              {/* Menu 3: Danh mục đầu tư */}
              {activeMenu === 'portfolio' && (
                <PortfolioView
                  summary={summary}
                  holdings={holdings}
                  onRefresh={loadPortfolioData}
                  onSelectStock={handleSelectStock}
                />
              )}

              {/* Menu 4: Giao dịch & Sổ lệnh */}
              {activeMenu === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onRefresh={loadPortfolioData}
                />
              )}

              {/* Menu 5: Thị trường & Bảng giá */}
              {activeMenu === 'market' && (
                <MarketBoardView
                  quotes={quotes}
                  indices={indices}
                  onSelectStock={handleSelectStock}
                />
              )}

              {/* Menu 6: Bộ lọc cổ phiếu */}
              {activeMenu === 'screener' && (
                <ScreenerView
                  quotes={quotes}
                  onSelectStock={handleSelectStock}
                  onAddToWatchlist={(sym) => {
                    showToast(`Đã thêm ${sym} vào danh sách theo dõi!`);
                  }}
                />
              )}

              {/* Menu 7: Giao dịch T+3 */}
              {activeMenu === 't3' && (
                <T3RadarView
                  signals={t3Signals}
                  onSelectSignal={(s) => setSelectedT3Signal(s)}
                  onToggleFavorite={handleToggleFavorite}
                  onRefreshSignals={loadT3Signals}
                />
              )}

              {/* Menu 8: Phân tích cổ phiếu */}
              {activeMenu === 'analysis' && (
                <StockAnalysisView
                  quotes={quotes}
                  selectedSymbol={selectedStockSymbol}
                  onSelectSymbol={(sym) => setSelectedStockSymbol(sym)}
                />
              )}

              {/* Menu 9: Trợ lý AI */}
              {activeMenu === 'ai' && <AiAssistantView />}

              {/* Menu 10: Danh sách theo dõi */}
              {activeMenu === 'watchlist' && (
                <WatchlistView
                  quotes={quotes}
                  onSelectStock={handleSelectStock}
                />
              )}

              {/* Menu 11: Cảnh báo */}
              {activeMenu === 'alerts' && <AlertsView />}

              {/* Menu 12: Trung tâm API */}
              {activeMenu === 'api-center' && (
                <ApiCenterView
                  providers={apiProviders}
                  onTestApi={handleTestApi}
                  testingProvider={testingProvider}
                />
              )}

              {/* Menu 13: Kiểm định chiến lược */}
              {activeMenu === 'backtest' && <BacktestView />}

              {/* Menu 14: Cài đặt & Sao lưu */}
              {activeMenu === 'settings' && (
                <SettingsView onRefreshAll={loadPortfolioData} />
              )}
            </div>

            {/* Right Sidebar Panel (Always visible in Dashboard, or responsive) */}
            <div className="shrink-0">
              <RightPanel
                news={news}
                apiProviders={apiProviders}
                onTestApi={handleTestApi}
                onOpenApiCenter={() => setActiveMenu('api-center')}
                onOpenAiAssistant={() => setActiveMenu('ai')}
                testingProvider={testingProvider}
              />
            </div>
          </div>
        </div>
      </div>

      {/* T+3 Detail Analysis Modal */}
      <T3DetailModal
        signal={selectedT3Signal}
        onClose={() => setSelectedT3Signal(null)}
        onTradeSimulation={(sig) => {
          showToast(`Đã chọn mô phỏng vào lệnh cho ${sig.symbol}`);
          setSelectedStockSymbol(sig.symbol);
          setActiveMenu('portfolio');
        }}
      />
    </div>
  );
}
