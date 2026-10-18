import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { getDatabase, saveDatabase } from '@/lib/db';
import { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const signature = 
      req.headers.get('x-pay2s-signature') || 
      req.headers.get('x-signature') || 
      req.headers.get('authorization') || 
      undefined;
    const body = await req.json();

    // Nhận diện provider tự động
    let provider: 'VIETQR' | 'CASSO' | 'SEPAY' | 'PAY2S' = 'VIETQR';
    if (body.pay2s || body.merchant_id || body.pay2s_trans_id || req.headers.get('x-pay2s-signature')) {
      provider = 'PAY2S';
    } else if (body.tid || body.casso) {
      provider = 'CASSO';
    } else if (body.transferAmount || body.referenceCode) {
      provider = 'SEPAY';
    }

    // Xử lý riêng cho cổng thanh toán Pay2S
    if (provider === 'PAY2S') {
      const bankConfig = PaymentService.getBankConfig();
      const secretKey = bankConfig.pay2sSecretKey || bankConfig.webhookSecret || process.env.PAY2S_SECRET_KEY;

      // 1. Kiểm tra xác minh chữ ký HMAC nếu cấu hình secretKey
      if (secretKey && signature) {
        const orderCodeVal = (body.order_code || body.orderCode || body.order_id || '').trim().toUpperCase();
        const amountVal = Number(body.amount || body.total_amount || 0);
        const transIdVal = (body.transaction_id || body.transactionId || body.pay2s_trans_id || body.trans_id || '').trim();
        const rawPayload1 = `${orderCodeVal}|${amountVal}|${body.status || 'PAID'}|${transIdVal}`;
        const rawPayload2 = typeof body === 'string' ? body : JSON.stringify(body);
        const expectedSig1 = crypto.createHmac('sha256', secretKey).update(rawPayload1).digest('hex');
        const expectedSig2 = crypto.createHmac('sha256', secretKey).update(rawPayload2).digest('hex');

        const isMatch = (
          signature === expectedSig1 ||
          signature === expectedSig2 ||
          signature === `sha256=${expectedSig1}` ||
          signature === `sha256=${expectedSig2}`
        );

        if (!isMatch) {
          return NextResponse.json(
            { success: false, code: 'INVALID_SIGNATURE', message: 'Chữ ký số Pay2S IPN không hợp lệ.' },
            { status: 401 }
          );
        }
      }

      const amount = Number(body.amount || body.total_amount || 0);
      const orderCode = (body.order_code || body.orderCode || body.order_id || '').trim().toUpperCase();
      const pay2sTransId = (body.transaction_id || body.transactionId || body.pay2s_trans_id || body.trans_id || `P2S_TX_${Date.now()}`).trim();

      if (!orderCode || !amount) {
        return NextResponse.json(
          { success: false, message: 'Dữ liệu IPN Pay2S thiếu order_code hoặc amount.' },
          { status: 400 }
        );
      }

      const db = getDatabase();
      const order = (db.subscription_orders || []).find(o => o.orderCode === orderCode);
      if (!order) {
        return NextResponse.json(
          { success: false, message: `Không tìm thấy đơn hàng mã ${orderCode}.` },
          { status: 404 }
        );
      }

      // 2. BẢO VỆ IDEMPOTENCY: Chống cộng dồn nhiều lần khi Pay2S gửi lại cùng thông báo
      if (order.status === 'PAID') {
        const orderUser = (db.users || []).find(u => u.id === order.userId);
        return NextResponse.json({
          success: true,
          code: 'ALREADY_PROCESSED',
          message: 'Đơn hàng này đã được xác nhận thanh toán trước đó, không ghi nhận lặp lại.',
          order,
          user: orderUser,
        });
      }

      // Đối soát tự động bởi System Bot
      const systemAdmin: UserProfile = {
        id: 'usr_system_pay2s',
        name: 'Pay2S Gateway Auto-Reconciler',
        email: 'gateway@pay2s.vn',
        role: 'ADMIN',
        tier: 'ENTERPRISE',
        validUntil: '2099-12-31',
        features: [],
      };

      const verifyResult = await PaymentService.adminVerifyPayment({
        orderId: order.id,
        adminUser: systemAdmin,
        actualAmount: amount,
        bankTransactionRef: pay2sTransId,
        transactionTime: new Date().toISOString(),
        reconciliationNotes: `Tự động kích hoạt qua cổng Pay2S IPN. Mã GD Pay2S: ${pay2sTransId}`,
      });

      // Ghi nhận metadata cổng Pay2S trên bản ghi mới nhất
      const freshDb = getDatabase();
      const updatedOrder = (freshDb.subscription_orders || []).find(o => o.id === order.id);
      if (updatedOrder) {
        updatedOrder.paymentGateway = 'PAY2S';
        updatedOrder.pay2sTransactionId = pay2sTransId;
        saveDatabase(freshDb);
      }

      return NextResponse.json({
        success: true,
        message: verifyResult.message,
        order: updatedOrder || verifyResult.order,
        user: verifyResult.user,
      });
    }

    // Các nhà cung cấp khác (VietQR, Casso, SePay)
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
