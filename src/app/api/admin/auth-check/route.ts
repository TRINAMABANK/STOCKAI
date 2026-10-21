import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const admin = AdminAuthService.getAuthenticatedAdminFromRequest(req);

    if (!admin) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      mustChangePassword: admin.mustChangePassword ?? false,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false });
  }
}
