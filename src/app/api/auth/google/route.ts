import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { credential, action } = body;

    if (action === 'GET_CONFIG') {
      const config = AuthService.getGoogleConfig();
      return NextResponse.json({
        success: true,
        data: {
          clientId: config.clientId,
          isConfigured: config.isConfigured,
          callbackUrl: config.callbackUrl,
        },
      });
    }

    if (!credential) {
      return NextResponse.json(
        { success: false, message: 'Thiếu Google credential (ID Token)' },
        { status: 400 }
      );
    }

    // 1. Xác minh Google Token ở backend
    const verification = await AuthService.verifyGoogleIdToken(credential);
    if (!verification.success || !verification.payload) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error || 'Xác thực tài khoản Google không thành công',
        },
        { status: 401 }
      );
    }

    // 2. Tra cứu hoặc tạo mới người dùng (bảo vệ quyền role/tier)
    const { user, isNew } = AuthService.findOrCreateGoogleUser(verification.payload);

    // 3. Tạo Session Token và cấp HttpOnly Cookie
    const sessionToken = AuthService.createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      message: isNew
        ? 'Tạo tài khoản StockAI mới thành công qua Google Gmail'
        : 'Đăng nhập tài khoản Google thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          validUntil: user.validUntil,
          features: user.features,
          avatarUrl: user.avatarUrl,
        },
        isNew,
      },
    });

    // Cài đặt HttpOnly Cookie an toàn
    response.cookies.set({
      name: AuthService.getCookieName(),
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 3600, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Lỗi API /api/auth/google:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi hệ thống khi xử lý đăng nhập Google' },
      { status: 500 }
    );
  }
}
