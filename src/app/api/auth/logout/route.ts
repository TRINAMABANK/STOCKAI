import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất thành công',
  });

  response.cookies.set({
    name: AuthService.getCookieName(),
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
