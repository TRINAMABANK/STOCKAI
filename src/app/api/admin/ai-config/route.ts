import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth-service';
import { AiConfigService } from '@/lib/ai-config-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-config
 * Đọc cấu hình AI công khai (Đã che API Key) và thống kê sử dụng.
 * BẢO VỆ NGHIÊM NGẶT: Chỉ Quản trị viên đã xác thực phiên mới có quyền truy cập.
 */
export async function GET(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Yêu cầu quyền Quản trị viên (Admin). Bạn không được phép truy cập cấu hình bí mật này.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get('dateRange') as 'today' | '7days' | '30days' | 'all') || 'all';
    const modelFilter = searchParams.get('model') || undefined;

    const config = AiConfigService.getPublicConfig();
    const { stats, logs } = AiConfigService.getUsageStats(dateRange, modelFilter);

    return NextResponse.json({
      success: true,
      data: {
        config,
        stats,
        logs,
      },
    });
  } catch (error: any) {
    console.error('[API Admin AI Config] Lỗi đọc cấu hình:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi máy chủ khi đọc cấu hình AI',
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-config
 * Cập nhật cấu hình OpenAI, mã hóa AES-256-GCM cho API Key.
 * BẢO VỆ NGHIÊM NGẶT: Chỉ Quản trị viên đã xác thực phiên mới có quyền cập nhật.
 */
export async function POST(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Yêu cầu quyền Quản trị viên (Admin). Thao tác cập nhật cấu hình bị từ chối.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { apiKey, model, timeoutMs, maxTokens, temperature, systemPromptExtra } = body;

    const result = AiConfigService.saveConfig(admin.username || admin.email, {
      apiKey,
      model,
      timeoutMs: timeoutMs !== undefined ? Number(timeoutMs) : undefined,
      maxTokens: maxTokens !== undefined ? Number(maxTokens) : undefined,
      temperature: temperature !== undefined ? Number(temperature) : undefined,
      systemPromptExtra,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        config: result.config,
      },
    });
  } catch (error: any) {
    console.error('[API Admin AI Config] Lỗi lưu cấu hình:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Lỗi khi cập nhật cấu hình AI',
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/ai-config
 * Xóa toàn bộ lịch sử usage logs (Ghi audit log)
 */
export async function DELETE(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu quyền Quản trị viên (Admin)' },
        { status: 401 }
      );
    }

    const result = AiConfigService.clearLogs(admin.username || admin.email);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi dọn dẹp logs' },
      { status: 500 }
    );
  }
}
