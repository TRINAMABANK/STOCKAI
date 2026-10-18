import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { SUBSCRIPTION_PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = AuthService.getCurrentUserFromRequest(req);
    const config = AuthService.getGoogleConfig();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          validUntil: user.validUntil,
          features: user.features || SUBSCRIPTION_PLANS[user.tier]?.features || [],
          avatarUrl: user.avatarUrl,
        },
        google: {
          isConfigured: config.isConfigured,
          clientId: config.clientId,
          callbackUrl: config.callbackUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi API /api/auth/me:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy thông tin phiên đăng nhập' },
      { status: 500 }
    );
  }
}
