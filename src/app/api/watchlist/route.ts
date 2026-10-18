import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { StockQuote } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = AuthService.getCurrentUserFromRequest(req);
    const db = getDatabase();

    // Lọc danh sách theo dõi riêng của User này
    let userWatchlists = (db.watchlists || []).filter(w => (w as any).userId === user.id);

    // Nếu người dùng mới chưa có watchlist, khởi tạo một danh sách mặc định
    if (userWatchlists.length === 0) {
      const defaultSymbols = user.tier === 'FREE' ? ['FPT', 'HPG', 'TCB'] : ['FPT', 'HPG', 'TCB', 'VNM', 'MWG'];
      const initialWl = {
        id: `wl_${user.id}_default`,
        userId: user.id,
        name: 'Mặc định',
        category: 'Theo dõi ngắn hạn',
        symbols: defaultSymbols,
        updatedAt: new Date().toISOString(),
      };
      if (!db.watchlists) db.watchlists = [];
      db.watchlists.push(initialWl);
      saveDatabase(db);
      userWatchlists = [initialWl];
    }

    // Lấy thông tin giá hiện tại từ database
    const allQuotes: StockQuote[] = db.market_prices || [];
    const quotesMap = new Map<string, StockQuote>();
    allQuotes.forEach(q => quotesMap.set(q.symbol.toUpperCase(), q));

    // Tập hợp tất cả các mã của user
    const allUserSymbols = Array.from(new Set(userWatchlists.flatMap(w => w.symbols)));
    const matchedQuotes = allUserSymbols.map(sym => {
      return quotesMap.get(sym.toUpperCase()) || {
        symbol: sym,
        companyName: `Công ty ${sym}`,
        exchange: 'HOSE',
        price: 50000,
        change: 0,
        changePercent: 0,
        open: 50000,
        high: 50000,
        low: 50000,
        close: 50000,
        volume: 1000000,
        value: 50000000000,
        industry: 'Chưa phân loại',
        rsi: 50,
        updatedTime: '15:00:00',
        source: 'StockAI Data Engine',
        isValid: true,
        isStale: false,
      };
    });

    const maxSymbols = user.tier === 'FREE' ? 5 : 9999;
    const canCreateMultipleCategories = user.tier !== 'FREE';

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        userTier: user.tier,
        watchlists: userWatchlists,
        quotes: matchedQuotes,
        totalSymbols: allUserSymbols.length,
        maxSymbols,
        canCreateMultipleCategories,
      },
    });
  } catch (error: any) {
    console.error('Lỗi API GET /api/watchlist:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách theo dõi' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = AuthService.getCurrentUserFromRequest(req);
    const db = getDatabase();
    const body = await req.json();
    const { action, symbol, listId, categoryName, listName } = body;

    if (!db.watchlists) db.watchlists = [];

    // Lấy các watchlist của user
    let userWatchlists = db.watchlists.filter(w => (w as any).userId === user.id);

    // Khởi tạo nếu rỗng
    if (userWatchlists.length === 0) {
      const initialWl = {
        id: `wl_${user.id}_default`,
        userId: user.id,
        name: 'Mặc định',
        category: 'Theo dõi ngắn hạn',
        symbols: ['FPT', 'HPG', 'TCB'],
        updatedAt: new Date().toISOString(),
      };
      db.watchlists.push(initialWl);
      userWatchlists = [initialWl];
    }

    if (action === 'ADD_SYMBOL') {
      const cleanSymbol = (symbol || '').trim().toUpperCase();
      if (!cleanSymbol || cleanSymbol.length < 3) {
        return NextResponse.json(
          { success: false, message: 'Mã cổ phiếu không hợp lệ' },
          { status: 400 }
        );
      }

      // Kiểm tra giới hạn gói Free (tối đa 5 mã)
      const allCurrentSymbols = Array.from(new Set(userWatchlists.flatMap(w => w.symbols)));
      if (user.tier === 'FREE' && allCurrentSymbols.length >= 5 && !allCurrentSymbols.includes(cleanSymbol)) {
        return NextResponse.json({
          success: false,
          code: 'TIER_LIMIT_REACHED',
          message: 'Tài khoản Miễn Phí chỉ được theo dõi tối đa 5 mã cổ phiếu. Vui lòng nâng cấp gói Pro để theo dõi không giới hạn!',
          limit: 5,
        });
      }

      // Thêm vào list chỉ định hoặc list đầu tiên
      const targetList = listId 
        ? userWatchlists.find(w => w.id === listId) 
        : userWatchlists[0];

      if (!targetList) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy danh mục' }, { status: 404 });
      }

      if (!targetList.symbols.includes(cleanSymbol)) {
        targetList.symbols.push(cleanSymbol);
        (targetList as any).updatedAt = new Date().toISOString();
      }

      saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Đã thêm ${cleanSymbol} vào danh sách theo dõi`,
        data: { watchlists: userWatchlists },
      });
    }

    if (action === 'REMOVE_SYMBOL') {
      const cleanSymbol = (symbol || '').trim().toUpperCase();
      userWatchlists.forEach(w => {
        w.symbols = w.symbols.filter(s => s !== cleanSymbol);
        (w as any).updatedAt = new Date().toISOString();
      });

      saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Đã xóa ${cleanSymbol} khỏi danh sách theo dõi`,
        data: { watchlists: userWatchlists },
      });
    }

    if (action === 'CREATE_CATEGORY') {
      if (user.tier === 'FREE') {
        return NextResponse.json({
          success: false,
          code: 'TIER_LIMIT_REACHED',
          message: 'Tính năng tạo nhiều danh mục/nhóm theo dõi chỉ dành cho gói Pro và Enterprise. Vui lòng nâng cấp gói!',
        });
      }

      const name = (listName || categoryName || 'Danh mục mới').trim();
      const newCategory = {
        id: `wl_${user.id}_${Date.now()}`,
        userId: user.id,
        name,
        category: categoryName || 'Tùy chỉnh',
        symbols: [],
        updatedAt: new Date().toISOString(),
      };

      db.watchlists.push(newCategory);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Đã tạo nhóm danh mục "${name}"`,
        data: { watchlists: db.watchlists.filter(w => (w as any).userId === user.id) },
      });
    }

    if (action === 'DELETE_CATEGORY') {
      if (!listId) {
        return NextResponse.json({ success: false, message: 'Thiếu mã danh mục cần xóa' }, { status: 400 });
      }

      db.watchlists = db.watchlists.filter(w => !((w as any).userId === user.id && w.id === listId));
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        message: 'Đã xóa danh mục theo dõi',
        data: { watchlists: db.watchlists.filter(w => (w as any).userId === user.id) },
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi API POST /api/watchlist:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật danh sách theo dõi' },
      { status: 500 }
    );
  }
}
