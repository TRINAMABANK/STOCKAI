import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { T3Strategy } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const strategy = searchParams.get('strategy') as T3Strategy | 'all' | null;
    const db = getDatabase();

    let signals = db.t3_signals;

    if (strategy && strategy !== 'all') {
      signals = signals.filter(s => s.strategy.toLowerCase() === strategy.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: {
        count: signals.length,
        hasOpportunities: signals.length > 0,
        signals,
        lastEvaluationTime: '14:35:22',
        evaluationModel: 'StockAI T+3 Quantitative Engine v1.0',
        disclaimer: 'Tín hiệu T+3 được tính bằng công thức kỹ thuật khách quan, không phải cam kết lợi nhuận tài chính.',
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
