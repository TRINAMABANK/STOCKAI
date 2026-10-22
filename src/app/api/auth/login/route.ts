import { NextResponse } from 'next/server';
import { AdminAuthService, ADMIN_COOKIE_NAME } from '@/lib/admin-auth-service';
import { AuthService } from '@/lib/auth-service';
import { getDatabase } from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';
import { UserProfile } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { usernameOrEmail, password, demoUserId } = body;

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAgeSeconds = 30 * 24 * 3600;

    // 1. Chế độ chuyển đổi nhanh tài khoản mẫu (Quick Demo Switcher)
    if (demoUserId) {
      const db = getDatabase();
      const users = db.users || [];
      const targetUser = users.find((u: UserProfile) => u.id === demoUserId);

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: 'Tài khoản mẫu không tồn tại.' },
          { status: 404 }
        );
      }

      const res = NextResponse.json({
        success: true,
        message: `Đã chuyển đổi sang tài khoản: ${targetUser.name}`,
        user: targetUser,
      });

      // Nếu chuyển sang tài khoản Admin
      if (targetUser.role === 'ADMIN') {
        const adminAccount = AdminAuthService.getOrInitAdminAccount();
        const adminToken = AdminAuthService.createAdminToken(adminAccount);
        res.cookies.set({
          name: ADMIN_COOKIE_NAME,
          value: adminToken,
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: maxAgeSeconds,
        });
      }

      const userToken = AuthService.createSessionToken(targetUser);
      res.cookies.set({
        name: AuthService.getCookieName(),
        value: userToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
      });

      return res;
    }

    // 2. Chế độ đăng nhập bằng Username / Email và Mật khẩu
    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập hoặc email và mật khẩu.' },
        { status: 400 }
      );
    }

    const trimmedInput = usernameOrEmail.trim();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    // A. Kiểm tra Quản trị viên (triqn, admin, triqnnamabank@gmail.com)
    const adminCheck = AdminAuthService.authenticate(trimmedInput, password, ip);
    if (adminCheck.success && adminCheck.account) {
      const adminAccount = adminCheck.account;
      const adminToken = AdminAuthService.createAdminToken(adminAccount);

      const adminUserProfile: UserProfile = {
        id: adminAccount.id,
        name: adminAccount.name,
        email: adminAccount.email,
        role: 'ADMIN',
        tier: 'ENTERPRISE',
        validUntil: '2028-12-31',
        features: SUBSCRIPTION_PLANS.ENTERPRISE.features,
      };

      const userToken = AuthService.createSessionToken(adminUserProfile);

      const res = NextResponse.json({
        success: true,
        message: 'Đăng nhập Quản trị viên thành công.',
        user: adminUserProfile,
        isAdmin: true,
      });

      res.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: adminToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
      });

      res.cookies.set({
        name: AuthService.getCookieName(),
        value: userToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
      });

      return res;
    }

    // B. Kiểm tra danh sách người dùng thông thường trong Database
    const db = getDatabase();
    const users = db.users || [];
    const matchedUser = users.find(
      (u: UserProfile) =>
        u.email.toLowerCase() === trimmedInput.toLowerCase() ||
        u.id.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (matchedUser) {
      // Để thuận tiện cho môi trường demo / testing, chấp nhận mật khẩu quản trị hoặc mật khẩu mặc định
      if (password === 'Admin@2026' || password === '123456' || password === 'StockAI@2026') {
        const userToken = AuthService.createSessionToken(matchedUser);

        const res = NextResponse.json({
          success: true,
          message: `Đăng nhập thành công với tài khoản: ${matchedUser.name}`,
          user: matchedUser,
          isAdmin: matchedUser.role === 'ADMIN',
        });

        res.cookies.set({
          name: AuthService.getCookieName(),
          value: userToken,
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: maxAgeSeconds,
        });

        return res;
      }

      return NextResponse.json(
        { success: false, message: 'Mật khẩu tài khoản không chính xác.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: adminCheck.message || 'Tài khoản không tồn tại trong hệ thống.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Lỗi API /api/auth/login:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}
