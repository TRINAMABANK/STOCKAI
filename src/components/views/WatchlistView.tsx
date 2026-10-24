'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Layers, 
  Sparkles, 
  Lock, 
  AlertCircle,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { StockQuote, SubscriptionTier } from '@/types';
import FeatureGate from '@/components/FeatureGate';

interface WatchlistViewProps {
  quotes?: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onOpenSubscription?: () => void;
}

interface WatchlistGroup {
  id: string;
  name: string;
  category?: string;
  symbols: string[];
}

export default function WatchlistView({
  quotes = [],
  onSelectStock,
  onOpenSubscription,
}: WatchlistViewProps) {
  const [watchlists, setWatchlists] = useState<WatchlistGroup[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [watchlistQuotes, setWatchlistQuotes] = useState<StockQuote[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>('PRO');
  const [maxSymbols, setMaxSymbols] = useState<number>(9999);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      if (data.success && data.data) {
        setWatchlists(data.data.watchlists || []);
        if (data.data.watchlists?.length > 0 && !activeListId) {
          setActiveListId(data.data.watchlists[0].id);
        }
        setWatchlistQuotes(data.data.quotes || []);
        setUserTier(data.data.userTier || 'FREE');
        setMaxSymbols(data.data.maxSymbols || (data.data.userTier === 'FREE' ? 5 : 9999));
      }
    } catch (err) {
      console.error('Lỗi tải danh sách theo dõi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const activeGroup = watchlists.find(w => w.id === activeListId) || watchlists[0];
  const activeSymbols = activeGroup?.symbols || [];
  const currentDisplayedQuotes = watchlistQuotes.filter(q => activeSymbols.includes(q.symbol));

  const totalUsedSymbols = Array.from(new Set(watchlists.flatMap(w => w.symbols))).length;
  const isAtLimit = userTier === 'FREE' && totalUsedSymbols >= 5;

  const handleAddSymbol = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;

    if (isAtLimit && !activeSymbols.includes(sym)) {
      setErrorMsg('Tài khoản Miễn Phí đã đạt giới hạn 5 mã theo dõi. Vui lòng nâng cấp gói Pro để thêm mã không giới hạn.');
      setShowUpgradeModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SYMBOL',
          symbol: sym,
          listId: activeListId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSymbol('');
        loadWatchlist();
      } else {
        if (data.code === 'TIER_LIMIT_REACHED') {
          setShowUpgradeModal(true);
        }
        setErrorMsg(data.message || 'Không thể thêm mã');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSymbol = async (sym: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REMOVE_SYMBOL',
          symbol: sym,
          listId: activeListId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadWatchlist();
      }
    } catch {
      setErrorMsg('Lỗi xóa mã khỏi danh sách');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CATEGORY',
          listName: newCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCategoryName('');
        setIsCreatingCategory(false);
        loadWatchlist();
      } else {
        if (data.code === 'TIER_LIMIT_REACHED') {
          setShowUpgradeModal(true);
        }
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Lỗi tạo nhóm danh mục');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
              Danh sách theo dõi (Watchlist)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF]">
              Tài khoản độc lập
            </span>
          </div>
          <p className="text-[13px] text-[#647293] mt-0.5">
            Dữ liệu cá nhân hóa cho từng nhà đầu tư • Giám sát biến động giá, khối lượng và tín hiệu kỹ thuật
          </p>
        </div>

        {/* Quota & Add Symbol Input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#647293] font-medium block">Hạn mức theo dõi</span>
            <span className={`text-xs font-bold font-mono ${isAtLimit ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
              {totalUsedSymbols}/{userTier === 'FREE' ? '5 mã (Gói Miễn Phí)' : 'Không giới hạn (Pro)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
              placeholder="Nhập mã (VD: VCB)..."
              disabled={isSubmitting}
              className="w-36 bg-[#FFFFFF] border border-[#DCE5FF] rounded-xl px-3 py-1.5 text-xs text-[#172554] uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#087CFF]/20 focus:border-[#087CFF] shadow-2xs"
            />
            <button
              onClick={handleAddSymbol}
              disabled={isSubmitting || !newSymbol.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Thêm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error / Alert notice */}
      {errorMsg && (
        <div className="p-3 bg-[#FEE2E2] border border-[#FEE2E2] text-[#EF4444] text-xs font-medium rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline ml-2">Đóng</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE5FF] pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {watchlists.map((w, index) => {
            const isActive = (activeListId || watchlists[0]?.id) === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setActiveListId(w.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#087CFF] text-white shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#647293] hover:text-[#172554] border border-[#DCE5FF]'
                }`}
              >
                <span className={`w-3.5 h-1.5 rounded-full opacity-80 ${
                  index % 4 === 0 ? 'bg-gradient-to-r from-[#7C3CFF] to-[#087CFF]' :
                  index % 4 === 1 ? 'bg-gradient-to-r from-[#8B36FF] to-[#EF4CBF]' :
                  index % 4 === 2 ? 'bg-gradient-to-r from-[#F59E0B] to-[#EF4444]' :
                  'bg-gradient-to-r from-[#00A991] to-[#13C9D5]'
                } shrink-0`} />
                <Bookmark className="w-3.5 h-3.5" />
                <span>{w.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[#F4F7FF] text-[#647293]'}`}>
                  {w.symbols.length}
                </span>
              </button>
            );
          })}

          {/* Create category button */}
          {userTier === 'FREE' ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F4F7FF] border border-dashed border-[#CBD5E1] text-[#647293] hover:text-[#087CFF] flex items-center gap-1.5"
              title="Nâng cấp Pro để tạo nhiều danh mục tùy chỉnh"
            >
              <Lock className="w-3 h-3 text-[#F59E0B]" />
              <span>Thêm nhóm</span>
            </button>
          ) : (
            isCreatingCategory ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Tên nhóm mới..."
                  className="w-32 bg-white border border-[#087CFF] rounded-xl px-2.5 py-1 text-xs text-[#172554] focus:outline-none"
                />
                <button
                  onClick={handleCreateCategory}
                  className="px-2 py-1 bg-[#087CFF] text-white rounded-lg text-xs font-semibold"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-2 py-1 bg-[#F4F7FF] text-[#647293] rounded-lg text-xs"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFFFF] border border-[#DCE5FF] text-[#087CFF] hover:bg-[#EBF3FF] flex items-center gap-1.5 shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Tạo nhóm mới</span>
              </button>
            )
          )}
        </div>

        <button
          onClick={loadWatchlist}
          disabled={isLoading}
          className="text-xs text-[#647293] hover:text-[#087CFF] flex items-center gap-1 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#087CFF]' : ''}`} />
          <span>Cập nhật giá</span>
        </button>
      </div>

      {/* Main Table or Empty State */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#647293] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#087CFF]" />
            <p className="text-sm font-semibold">Đang tải danh sách theo dõi của bạn...</p>
          </div>
        ) : currentDisplayedQuotes.length === 0 ? (
          <div className="p-12 text-center text-[#647293] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF3FF] text-[#087CFF] flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172554]">Chưa có mã nào trong danh sách này</h3>
              <p className="text-xs text-[#647293] max-w-md mx-auto mt-1">
                Nhập mã cổ phiếu vào ô &quot;Nhập mã (VD: VCB)&quot; phía trên và bấm <strong>Thêm</strong> để bắt đầu theo dõi.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              {['FPT', 'HPG', 'TCB', 'VNM', 'SSI'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setNewSymbol(s);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F4F7FF] hover:bg-[#EBF3FF] text-[#087CFF] font-bold text-xs border border-[#DCE5FF] transition"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11pt]">
              <thead>
                <tr className="bg-[#F4F7FF] text-[#647293] text-[11pt] font-semibold border-b border-[#DCE5FF]">
                  <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã CP</th>
                  <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Sàn</th>
                  <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Ngành</th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Giá (VNĐ)</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">+/-</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">%</th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">RSI</th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FF] text-[11pt]">
                {currentDisplayedQuotes.map(stock => {
                  const isUp = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#F8FAFC] transition h-[44px]">
                      <td 
                        className="py-2.5 px-4 font-semibold text-[#087CFF] cursor-pointer hover:underline whitespace-nowrap"
                        onClick={() => onSelectStock(stock.symbol)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#172554]">{stock.symbol}</span>
                          <span className="text-[11pt] px-1.5 py-0.2 rounded bg-[#F4F7FF] text-[#647293] font-semibold border border-[#DCE5FF]">
                            {stock.exchange}
                          </span>
                        </div>
                        <span className="block text-[11pt] text-[#647293] font-normal truncate max-w-[180px]">
                          {stock.companyName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#647293] text-[11pt] font-medium whitespace-nowrap">{stock.exchange}</td>
                      <td className="py-2.5 px-3 text-[#647293] text-[11pt] whitespace-nowrap">{stock.industry || 'Chung'}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">
                        {stock.price.toLocaleString('vi-VN')}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold font-mono tabular-nums text-[11pt] whitespace-nowrap ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold font-mono tabular-nums text-[11pt] whitespace-nowrap ${isUp ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-[#16A34A]" /> : <ArrowDownRight className="w-3.5 h-3.5 text-[#EF4444]" />}
                          <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#647293] text-[11pt] whitespace-nowrap">
                        {stock.volume.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[11pt] font-mono tabular-nums border ${
                          (stock.rsi || 50) > 70 
                            ? 'bg-[#FEE2E2] text-[#EF4444] border-[#FEE2E2]'
                            : (stock.rsi || 50) < 30
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#F4F7FF] text-[#172554] border-[#DCE5FF]'
                        }`}>
                          {stock.rsi || 50}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectStock(stock.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-[#EBF3FF] hover:bg-[#DCE5FF] text-[#087CFF] font-semibold text-[11pt] transition shadow-2xs"
                          >
                            Phân tích
                          </button>
                          <button
                            onClick={() => handleRemoveSymbol(stock.symbol)}
                            className="p-1 text-[#CBD5E1] hover:text-[#EF4444] transition rounded-lg hover:bg-[#FEE2E2]"
                            title="Xóa khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Feature Gate Upgrade Notice when limit reached */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#DCE5FF] space-y-4">
            <FeatureGate
              featureKey="WATCHLIST_UNLIMITED"
              userTier={userTier}
              requiredTier="PRO"
              featureTitle="Hạn mức danh sách theo dõi không giới hạn"
              featureDescription="Tài khoản Miễn Phí giới hạn tối đa 5 mã. Hãy nâng cấp gói Pro để theo dõi hàng trăm mã, phân loại nhiều danh mục và nhận cảnh báo kỹ thuật thời gian thực!"
              onUpgrade={() => {
                setShowUpgradeModal(false);
                if (onOpenSubscription) onOpenSubscription();
              }}
            />
            <div className="text-center pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs text-[#647293] hover:text-[#172554] font-semibold"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
