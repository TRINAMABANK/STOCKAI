import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment-service';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature') || req.headers.get('authorization') || undefined;
    const body = await req.json();

    // Tự động nhận diện provider từ header hoặc body
    let provider: 'VIETQR' | 'CASSO' | 'SEPAY' = 'VIETQR';
    if (body.tid || body.casso) provider = 'CASSO';
    if (body.transferAmount || body.referenceCode) provider = 'SEPAY';

    const result = await PaymentService.handleWebhook({
      provider,
      payload: body,
      signature,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý webhook ngân hàng' },
      { status: 400 }
    );
  }
}
