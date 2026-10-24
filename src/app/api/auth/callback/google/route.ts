import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const config = AuthService.getGoogleConfig();
  const appBaseUrl = config.appUrl;

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.warn('Google OAuth Redirect Error:', error, errorDescription);
      return NextResponse.redirect(
        `${appBaseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${appBaseUrl}/?auth_error=missing_code`);
    }

    // Nếu đã cấu hình Client Secret, thực hiện quy trình trao đổi code lấy token
    if (config.hasSecret) {
      const exchange = await AuthService.exchangeCodeForToken(code, config.callbackUrl);
      if (!exchange.success || !exchange.idToken) {
        return NextResponse.redirect(
          `${appBaseUrl}/?auth_error=${encodeURIComponent(exchange.error || 'exchange_failed')}`
        );
      }

      const verification = await AuthService.verifyGoogleIdToken(exchange.idToken);
      if (!verification.success || !verification.payload) {
        return NextResponse.redirect(
          `${appBaseUrl}/?auth_error=${encodeURIComponent(verification.error || 'verify_failed')}`
        );
      }

      const { user } = AuthService.findOrCreateGoogleUser(verification.payload);
      const sessionToken = AuthService.createSessionToken(user);

      const response = NextResponse.redirect(`${appBaseUrl}/?auth_success=1`);
      response.cookies.set({
        name: AuthService.getCookieName(),
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 3600,
      });

      return response;
    }

    // Nếu chưa cấu hình Client Secret trong .env.local:
    // Hướng dẫn người dùng cấu hình Client Secret hoặc sử dụng nút đăng nhập Google One-Tap/Popup ID Token
    return new Response(
      `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>StockAI - Google OAuth Callback</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F4F7FF; color: #172554; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #FFFFFF; border: 1px solid #DCE5FF; border-radius: 16px; padding: 32px; max-width: 520px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { color: #087CFF; margin-top: 0; }
    code { background: #EBF3FF; color: #087CFF; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #087CFF; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .note { background: #FEF3C7; border: 1px solid #FDE68A; padding: 12px; border-radius: 8px; font-size: 13px; color: #92400E; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Xác thực Callback Google OAuth</h2>
    <p>URL chuyển hướng <code>/api/auth/callback/google</code> đã nhận mã xác thực (Authorization Code) thành công từ Google Cloud.</p>
    <div class="note">
      <strong>Lưu ý:</strong> Để hoàn tất trao đổi mã qua luồng Server Redirect, hãy bổ sung <code>GOOGLE_CLIENT_SECRET</code> vào file <code>.env.local</code> ở backend.<br><br>
      Hoặc bạn có thể quay lại trang chủ và sử dụng nút <strong>Đăng nhập Google</strong> (Google Identity Services popup) chỉ cần Client ID.
    </div>
    <a href="/" class="btn">Quay lại StockAI</a>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (err: any) {
    console.error('Lỗi Callback Google:', err);
    return NextResponse.redirect(`${appBaseUrl}/?auth_error=server_error`);
  }
}
