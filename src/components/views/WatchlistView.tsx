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
            <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">
              Danh sách theo dõi (Watchlist)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
              Tài khoản độc lập
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Dữ liệu cá nhân hóa cho từng nhà đầu tư • Giám sát biến động giá, khối lượng và tín hiệu kỹ thuật
          </p>
        </div>

        {/* Quota & Add Symbol Input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#64748B] font-medium block">Hạn mức theo dõi</span>
            <span className={`text-xs font-bold font-mono ${isAtLimit ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
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
              className="w-36 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#172033] uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#008FD3]/20 focus:border-[#008FD3] shadow-2xs"
            />
            <button
              onClick={handleAddSymbol}
              disabled={isSubmitting || !newSymbol.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
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
        <div className="p-3 bg-[#FFE4E6] border border-[#FECDD3] text-[#F43F5E] text-xs font-medium rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline ml-2">Đóng</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {watchlists.map((w) => {
            const isActive = (activeListId || watchlists[0]?.id) === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setActiveListId(w.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#008FD3] text-white shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{w.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {w.symbols.length}
                </span>
              </button>
            );
          })}

          {/* Create category button */}
          {userTier === 'FREE' ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F8FC] border border-dashed border-[#CBD5E1] text-[#64748B] hover:text-[#008FD3] flex items-center gap-1.5"
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
                  className="w-32 bg-white border border-[#008FD3] rounded-xl px-2.5 py-1 text-xs text-[#172033] focus:outline-none"
                />
                <button
                  onClick={handleCreateCategory}
                  className="px-2 py-1 bg-[#008FD3] text-white rounded-lg text-xs font-semibold"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-2 py-1 bg-[#F1F5F9] text-[#64748B] rounded-lg text-xs"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] text-[#008FD3] hover:bg-[#E0F2FE] flex items-center gap-1.5 shadow-2xs"
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
          className="text-xs text-[#64748B] hover:text-[#008FD3] flex items-center gap-1 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#008FD3]' : ''}`} />
          <span>Cập nhật giá</span>
        </button>
      </div>

      {/* Main Table or Empty State */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#64748B] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#008FD3]" />
            <p className="text-sm font-semibold">Đang tải danh sách theo dõi của bạn...</p>
          </div>
        ) : currentDisplayedQuotes.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] text-[#008FD3] flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">Chưa có mã nào trong danh sách này</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
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
                  className="px-2.5 py-1 rounded-lg bg-[#F5F8FC] hover:bg-[#E0F2FE] text-[#008FD3] font-bold text-xs border border-[#E2E8F0] transition"
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
                <tr className="bg-[#F5F8FC] text-[#64748B] text-[11pt] font-semibold border-b border-[#E2E8F0]">
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
              <tbody className="divide-y divide-[#F1F5F9] text-[11pt]">
                {currentDisplayedQuotes.map(stock => {
                  const isUp = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#F8FAFC] transition h-[44px]">
                      <td 
                        className="py-2.5 px-4 font-semibold text-[#008FD3] cursor-pointer hover:underline whitespace-nowrap"
                        onClick={() => onSelectStock(stock.symbol)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#172033]">{stock.symbol}</span>
                          <span className="text-[11pt] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] font-semibold border border-[#E2E8F0]">
                            {stock.exchange}
                          </span>
                        </div>
                        <span className="block text-[11pt] text-[#64748B] font-normal truncate max-w-[180px]">
                          {stock.companyName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] text-[11pt] font-medium whitespace-nowrap">{stock.exchange}</td>
                      <td className="py-2.5 px-3 text-[#64748B] text-[11pt] whitespace-nowrap">{stock.industry || 'Chung'}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#172033] font-mono tabular-nums text-[11pt] whitespace-nowrap">
                        {stock.price.toLocaleString('vi-VN')}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold font-mono tabular-nums text-[11pt] whitespace-nowrap ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                        {isUp ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold font-mono tabular-nums text-[11pt] whitespace-nowrap ${isUp ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" /> : <ArrowDownRight className="w-3.5 h-3.5 text-[#F43F5E]" />}
                          <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#64748B] text-[11pt] whitespace-nowrap">
                        {stock.volume.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[11pt] font-mono tabular-nums border ${
                          (stock.rsi || 50) > 70 
                            ? 'bg-[#FFE4E6] text-[#F43F5E] border-[#FECDD3]'
                            : (stock.rsi || 50) < 30
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#F5F8FC] text-[#172033] border-[#E2E8F0]'
                        }`}>
                          {stock.rsi || 50}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectStock(stock.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#008FD3] font-semibold text-[11pt] transition shadow-2xs"
                          >
                            Phân tích
                          </button>
                          <button
                            onClick={() => handleRemoveSymbol(stock.symbol)}
                            className="p-1 text-[#CBD5E1] hover:text-[#F43F5E] transition rounded-lg hover:bg-[#FFE4E6]"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
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
                className="text-xs text-[#64748B] hover:text-[#172033] font-semibold"
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
