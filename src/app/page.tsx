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

// User Portal Views
import MarketDashboardView from '@/components/views/MarketDashboardView';
import UserProfileView from '@/components/views/UserProfileView';
import UserGuideView from '@/components/views/UserGuideView';
import SubscriptionView from '@/components/views/SubscriptionView';
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
import AdminSubscriptionView from '@/components/views/AdminSubscriptionView';

import { 
  PortfolioSummary, 
  PortfolioItem, 
  Transaction, 
  T3Signal, 
  StockQuote, 
  MarketIndex, 
  NewsItem, 
  ApiProvider,
  UserProfile
} from '@/types';

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('FPT');
  const [selectedT3Signal, setSelectedT3Signal] = useState<T3Signal | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const paramMenu = new URLSearchParams(window.location.search).get('menu') as ActiveMenu;
      if (paramMenu) {
        setActiveMenu(paramMenu);
      }
    }
  }, []);

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

  // Load User Profile
  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.data?.user) {
        setCurrentUser(data.data.user);
      }
    } catch (e) {
      console.error('Lỗi tải user:', e);
    }
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
        setQuotes(data.data.quotes || []);
        setTopGainers(data.data.topGainers || []);
        setTopLosers(data.data.topLosers || []);
        setIndices(data.data.indices || []);
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
        setT3Signals(data.data.signals || []);
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
        setApiProviders(data.data.providers || []);
      }
    } catch (e) {
      console.error('Lỗi tải API providers:', e);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadPortfolioData();
    loadMarketData();
    loadT3Signals();
    loadApiProviders();

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
        currentUser={currentUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          indices={indices}
          onSelectStock={handleSelectStock}
          onOpenSettings={() => setActiveMenu('settings')}
          quotes={quotes}
          currentUser={currentUser}
          onOpenProfile={() => setActiveMenu('profile')}
          onOpenSubscription={() => setActiveMenu('subscription')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Scrollable Center Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Center Content Column */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              {/* Trang 1: Dashboard thị trường chuyên nghiệp */}
              {activeMenu === 'dashboard' && (
                <MarketDashboardView
                  indices={indices}
                  quotes={quotes}
                  t3Signals={t3Signals}
                  onSelectStock={handleSelectStock}
                  onViewScreener={() => setActiveMenu('screener')}
                  onViewWatchlist={() => setActiveMenu('watchlist')}
                  onViewT3Radar={() => setActiveMenu('t3')}
                />
              )}

              {/* Trang 2: Bộ quét cổ phiếu định lượng */}
              {activeMenu === 'screener' && (
                <ScreenerView
                  quotes={quotes}
                  onSelectStock={handleSelectStock}
                  onAddToWatchlist={async (sym) => {
                    try {
                      const res = await fetch('/api/watchlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'ADD_SYMBOL', symbol: sym }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        showToast(`⭐ Đã thêm ${sym} vào danh sách theo dõi cá nhân!`);
                      } else {
                        showToast(`⚠️ ${data.message}`);
                      }
                    } catch {
                      showToast(`Đã thêm ${sym} vào danh sách theo dõi!`);
                    }
                  }}
                  userTier={currentUser?.tier}
                  onOpenSubscription={() => setActiveMenu('subscription')}
                />
              )}

              {/* Trang 3: Phân tích kỹ thuật & Đồ thị TradingView */}
              {activeMenu === 'analysis' && (
                <StockAnalysisView
                  quotes={quotes}
                  selectedSymbol={selectedStockSymbol}
                  onSelectSymbol={(sym) => setSelectedStockSymbol(sym)}
                />
              )}

              {/* Trang 4: Danh sách theo dõi cá nhân hóa */}
              {activeMenu === 'watchlist' && (
                <WatchlistView
                  quotes={quotes}
                  onSelectStock={handleSelectStock}
                  onOpenSubscription={() => setActiveMenu('subscription')}
                />
              )}

              {/* Trang 5: Tài khoản cá nhân & Lịch sử đơn hàng */}
              {activeMenu === 'profile' && (
                <UserProfileView
                  onOpenSubscription={() => setActiveMenu('subscription')}
                  onOpenAuthModal={() => {
                    // Trigger modal in header
                    const googleBtn = document.querySelector('button[title*="Google"]') as HTMLButtonElement;
                    if (googleBtn) googleBtn.click();
                  }}
                />
              )}

              {/* Trang 6: Gói dịch vụ StockAI */}
              {activeMenu === 'subscription' && (
                <SubscriptionView />
              )}

              {/* Trang 7: Cẩm nang kỷ luật & Hướng dẫn sử dụng */}
              {activeMenu === 'guide' && (
                <UserGuideView />
              )}

              {/* Quét T+1–T+5 */}
              {activeMenu === 't3' && (
                <T3RadarView
                  signals={t3Signals}
                  onSelectSignal={(s) => setSelectedT3Signal(s)}
                  onToggleFavorite={handleToggleFavorite}
                  onRefreshSignals={loadT3Signals}
                />
              )}

              {/* Danh mục mô phỏng */}
              {activeMenu === 'portfolio' && (
                <PortfolioView
                  summary={summary}
                  holdings={holdings}
                  onRefresh={loadPortfolioData}
                  onSelectStock={handleSelectStock}
                />
              )}

              {/* Sổ giao dịch */}
              {activeMenu === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onRefresh={loadPortfolioData}
                />
              )}

              {/* Bảng giá trực tuyến */}
              {activeMenu === 'market' && (
                <MarketBoardView
                  quotes={quotes}
                  indices={indices}
                  onSelectStock={handleSelectStock}
                />
              )}

              {/* Trợ lý AI */}
              {activeMenu === 'ai' && <AiAssistantView />}

              {/* Cảnh báo */}
              {activeMenu === 'alerts' && <AlertsView />}

              {/* Trung tâm API */}
              {activeMenu === 'api-center' && (
                <ApiCenterView
                  providers={apiProviders}
                  onTestApi={handleTestApi}
                  testingProvider={testingProvider}
                />
              )}

              {/* Kiểm định chiến lược */}
              {activeMenu === 'backtest' && <BacktestView />}

              {/* Cài đặt hệ thống */}
              {activeMenu === 'settings' && (
                <SettingsView onRefreshAll={loadPortfolioData} />
              )}

              {/* Khu vực Quản trị Admin: Bảo vệ nghiêm ngặt */}
              {activeMenu === 'admin-subscription' && (
                currentUser?.role === 'ADMIN' ? (
                  <AdminSubscriptionView />
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-[#FECDD3] space-y-2">
                    <p className="text-sm font-bold text-[#F43F5E]">Khu vực dành riêng cho Quản trị viên (Admin)</p>
                    <p className="text-xs text-[#64748B]">Tài khoản của bạn không có quyền truy cập trang quản trị này.</p>
                  </div>
                )
              )}
            </div>

            {/* Right Sidebar Panel */}
            <div className="w-full xl:w-80 xl:shrink-0">
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
