import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth-service';
import { AiConfigService } from '@/lib/ai-config-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/ai-config/test
 * Thực hiện kiểm tra kết nối thật hoặc chạy thử phân tích mẫu tới OpenAI.
 * BẢO VỆ NGHIÊM NGẶT: Chỉ Quản trị viên mới có quyền chạy test. Rate-limited chống spam.
 */
export async function POST(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Yêu cầu quyền Quản trị viên (Admin). Bạn không được phép thực hiện gọi thử API.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'TEST_CONNECTION'; // 'TEST_CONNECTION' | 'TEST_SAMPLE'
    const symbol = body.symbol || 'FPT';

    if (action === 'TEST_CONNECTION') {
      const result = await AiConfigService.testConnection();
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    if (action === 'TEST_SAMPLE') {
      const result = await AiConfigService.testSampleAnalysis(symbol);
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Hành động "${action}" không được hỗ trợ. Sử dụng TEST_CONNECTION hoặc TEST_SAMPLE.`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API Admin AI Test] Lỗi thử nghiệm API:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Lỗi khi thực hiện kiểm tra OpenAI API',
      },
      { status: 500 }
    );
  }
}
