import { NextResponse } from 'next/server';
import { AdminAuthService, ADMIN_COOKIE_NAME } from '@/lib/admin-auth-service';
import { AuthService } from '@/lib/auth-service';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    const authResult = AdminAuthService.authenticate(username, password, ip);

    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    const adminAccount = authResult.account;
    const adminToken = AdminAuthService.createAdminToken(adminAccount);

    // Tạo cả token stockai_session đồng bộ
    const userSessionToken = AuthService.createSessionToken({
      id: adminAccount.id,
      name: adminAccount.name,
      email: adminAccount.email,
      role: 'ADMIN',
      tier: 'ENTERPRISE',
      validUntil: '2028-12-31',
      features: SUBSCRIPTION_PLANS.ENTERPRISE.features,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAgeSeconds = 30 * 24 * 3600;

    const res = NextResponse.json({
      success: true,
      message: 'Đăng nhập Quản trị viên thành công.',
      mustChangePassword: authResult.mustChangePassword ?? false,
      user: {
        id: adminAccount.id,
        username: adminAccount.username,
        email: adminAccount.email,
        name: adminAccount.name,
        role: adminAccount.role,
      },
    });

    // Set cookie stockai_admin_session
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: adminToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    // Set cookie stockai_session cho compatibility
    res.cookies.set({
      name: 'stockai_session',
      value: userSessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return res;
  } catch (error: any) {
    console.error('Lỗi API /api/admin/login:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi xử lý đăng nhập quản trị.' },
      { status: 500 }
    );
  }
}
