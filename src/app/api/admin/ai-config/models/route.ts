import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth-service';
import { AiConfigService } from '@/lib/ai-config-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-config/models
 * Lấy danh sách mô hình trực tiếp từ OpenAI bằng API Key đã cấu hình.
 */
export async function GET(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Yêu cầu quyền Quản trị viên (Admin).',
        },
        { status: 401 }
      );
    }

    const result = await AiConfigService.fetchOpenAiModels();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        models: [],
        message: error.message || 'Lỗi khi lấy danh sách mô hình từ OpenAI',
      },
      { status: 500 }
    );
  }
}
