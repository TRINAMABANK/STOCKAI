import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất thành công khỏi hệ thống StockAI.',
  });

  // Xóa cookie phiên người dùng
  response.cookies.set({
    name: AuthService.getCookieName(),
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  // Xóa cookie phiên quản trị viên nếu có
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
