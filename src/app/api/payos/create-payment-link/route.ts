import { NextRequest, NextResponse } from "next/server";
import { payos } from "@/lib/payos";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, description, returnUrl, cancelUrl } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) < 10000) {
      return NextResponse.json({ error: "Số tiền nạp tối thiểu là 10.000đ" }, { status: 400 });
    }

    const amountInt = Math.floor(Number(amount));

    // Tạo mã giao dịch duy nhất (timestamp 6 chữ số cuối - đủ cho môi trường test)
    const orderCode = Number(String(Date.now()).slice(-8));

    // Tạo transaction code dạng FH + ngày + random
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const transactionCode = `FH${dateStr}${random4}`;

    const paymentData = {
      orderCode,
      amount: amountInt,
      description: description || `NAP ${transactionCode}`,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/wallet?success=true`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/wallet?success=false`
    };

    const paymentLinkRes = await payos.createPaymentLink(paymentData);

    // Lưu đơn hàng vào Firestore để webhook tìm lại khi có thanh toán
    await db.collection('payos_orders').add({
      payosOrderCode: orderCode,
      transactionCode,
      userId: user.uid,
      amount: amountInt,
      status: 'PENDING',
      created_at: new Date(),
      paymentLinkId: paymentLinkRes.paymentLinkId || '',
    });

    return NextResponse.json({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode,
      orderCode: paymentLinkRes.orderCode,
      bin: paymentLinkRes.bin,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      amount: paymentLinkRes.amount,
      description: paymentLinkRes.description,
      transactionCode,
    });
  } catch (error: any) {
    console.error("Create payment link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
