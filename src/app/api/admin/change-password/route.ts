import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập: Chưa đăng nhập Quản trị viên.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = AdminAuthService.changePassword(currentPassword, newPassword, ip);

    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.success ? 200 : 400 }
    );
  } catch (error: any) {
    console.error('Lỗi API /api/admin/change-password:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi đổi mật khẩu.' },
      { status: 500 }
    );
  }
}
