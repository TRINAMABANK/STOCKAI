import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { T3Strategy, T3Period, T3SignalType, RiskLevel, Exchange } from '@/types';
import { enrichT3Signal, normalizeIndustry } from '@/lib/t3-industry-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // 'all', 'T+1', 'T+3', 'T+5'
    const strategy = searchParams.get('strategy'); // 'all', 'Breakout', ...
    const industry = searchParams.get('industry'); // 'Tất cả ngành', 'Ngân hàng', ...
    const exchange = searchParams.get('exchange'); // 'ALL', 'HOSE', 'HNX', 'UPCOM'
    const signalType = searchParams.get('signalType'); // 'ALL', 'BUY', 'SELL', 'WATCHLIST'
    const riskLevel = searchParams.get('riskLevel'); // 'ALL', 'Thấp', 'Trung bình', 'Cao'
    const search = searchParams.get('search')?.trim().toLowerCase();
    const sortBy = searchParams.get('sortBy') || 'score';

    const db = getDatabase();

    // Chuẩn hóa và làm giàu dữ liệu ngành, loại tín hiệu cho toàn bộ signals
    const allSignals = (db.t3_signals || []).map(enrichT3Signal);

    let signals = [...allSignals];

    // 1. Lọc theo kỳ hạn (T+1, T+3, T+5)
    if (period && period !== 'all') {
      signals = signals.filter(s => s.period === period);
    }

    // 2. Lọc theo chiến lược
    if (strategy && strategy !== 'all') {
      signals = signals.filter(s => s.strategy.toLowerCase() === strategy.toLowerCase());
    }

    // 3. Lọc theo ngành
    if (industry && industry !== 'Tất cả ngành' && industry !== 'all') {
      const targetIndustry = normalizeIndustry(industry);
      signals = signals.filter(s => normalizeIndustry(s.industry) === targetIndustry);
    }

    // 4. Lọc theo sàn (HOSE, HNX, UPCoM)
    if (exchange && exchange !== 'ALL' && exchange !== 'all') {
      signals = signals.filter(s => s.exchange.toUpperCase() === exchange.toUpperCase());
    }

    // 5. Lọc theo loại tín hiệu (BUY, SELL, WATCHLIST)
    if (signalType && signalType !== 'ALL' && signalType !== 'all') {
      signals = signals.filter(s => s.signalType === signalType);
    }

    // 6. Lọc theo mức rủi ro (Thấp, Trung bình, Cao)
    if (riskLevel && riskLevel !== 'ALL' && riskLevel !== 'all') {
      signals = signals.filter(s => s.riskLevel === riskLevel);
    }

    // 7. Tìm kiếm theo mã cổ phiếu hoặc tên doanh nghiệp
    if (search) {
      signals = signals.filter(s => 
        s.symbol.toLowerCase().includes(search) || 
        s.companyName.toLowerCase().includes(search)
      );
    }

    // 8. Sắp xếp
    signals.sort((a, b) => {
      if (sortBy === 'liquidity') {
        const valA = a.liquidityValue || (a.liquidity.includes('Rất cao') ? 3 : a.liquidity.includes('Cao') ? 2 : 1);
        const valB = b.liquidityValue || (b.liquidity.includes('Rất cao') ? 3 : b.liquidity.includes('Cao') ? 2 : 1);
        return valB - valA;
      }
      if (sortBy === 'changePercent') {
        return (b.changePercent || 0) - (a.changePercent || 0);
      }
      if (sortBy === 'rewardRisk') {
        return (b.rewardRiskRatio || 0) - (a.rewardRiskRatio || 0);
      }
      // Mặc định: Điểm tín hiệu (Cao xuống Thấp)
      return b.t3Score - a.t3Score;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCount: allSignals.length,
        count: signals.length,
        hasOpportunities: signals.length > 0,
        signals,
        lastEvaluationTime: '14:35:22',
        evaluationModel: 'StockAI T+1 to T+5 Quantitative Radar v2.0',
        disclaimer: 'Giá mục tiêu và các mức cắt lỗ/vùng mua được định lượng dựa trên mô hình ATR kỹ thuật. Đây là công cụ hỗ trợ phân tích độc lập, không cam kết lợi nhuận tài chính.',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi tải tín hiệu T+3', error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, signalId } = body;
    const db = getDatabase();

    if (action === 'TOGGLE_FAVORITE' && signalId) {
      const target = db.t3_signals.find(s => s.id === signalId);
      if (target) {
        target.isFavorite = !target.isFavorite;
        saveDatabase(db);
        return NextResponse.json({ success: true, isFavorite: target.isFavorite });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy tín hiệu' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật tín hiệu', error: String(error) }, { status: 500 });
  }
}
