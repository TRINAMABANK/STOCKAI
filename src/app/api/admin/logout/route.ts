import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất quản trị viên thành công.',
  });

  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return res;
}
