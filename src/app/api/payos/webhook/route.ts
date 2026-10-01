import { NextRequest, NextResponse } from "next/server";
import { payos } from "@/lib/payos";
import { db } from "@/lib/firebase";

// PayOS gọi GET để verify webhook URL còn hoạt động
export async function GET() {
  return NextResponse.json({ success: true, message: "Fairy House AutoData Webhook OK" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Bước 1: Xác thực chữ ký từ PayOS (chống giả mạo webhook)
    const webhookData = payos.verifyPaymentWebhookData(body);

    const { orderCode, amount } = webhookData.data;
    const isSuccess = webhookData.code === '00' && webhookData.success === true;

    if (!isSuccess) {
      // Giao dịch thất bại - không cần xử lý
      return NextResponse.json({ success: true, message: "Payment not completed, ignored" });
    }

    // Bước 2: Tìm đơn hàng pending tương ứng với orderCode
    const ordersSnap = await db.collection('payos_orders')
      .where('payosOrderCode', '==', orderCode)
      .where('status', '==', 'PENDING')
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      console.warn(`Webhook: No pending payos_order found for orderCode ${orderCode}`);
      return NextResponse.json({ success: true, message: "Order not found or already processed" });
    }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();

    // Bước 3: Kiểm tra số tiền khớp với backend (chống gian lận)
    if (orderData.amount !== amount) {
      console.error(`Webhook FRAUD: amount mismatch for orderCode ${orderCode}. Expected ${orderData.amount}, got ${amount}`);
      return NextResponse.json({ success: false, message: "Amount mismatch" }, { status: 400 });
    }

    const userId = orderData.userId;
    const transactionCode = orderData.transactionCode;

    // Bước 4: Dùng Firestore transaction để cộng tiền an toàn (chống race condition)
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (tx: any) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('User not found: ' + userId);

      const currentBalance = userDoc.data().wallet_balance || 0;
      const newBalance = currentBalance + amount;

      // Cộng tiền vào ví
      tx.update(userRef, { wallet_balance: newBalance });

      // Cập nhật trạng thái đơn PayOS
      tx.update(orderDoc.ref, {
        status: 'PAID',
        paid_at: new Date(),
        reference: webhookData.data.reference || '',
      });

      // Ghi lịch sử giao dịch vào collection 'orders' hiện có
      const historyRef = db.collection('orders').doc();
      tx.set(historyRef, {
        transaction_code: transactionCode,
        user_id: userId,
        plan_id: null,
        type: 'DEPOSIT',
        amount: amount,
        status: 'PAID',
        payos_order_code: orderCode,
        created_at: new Date(),
        paid_at: new Date(),
      });
    });

    console.log(`Webhook OK: +${amount}đ for user ${userId}, orderCode ${orderCode}`);

    return NextResponse.json({ success: true, message: "Wallet topped up successfully" });

  } catch (error: any) {
    console.error("PayOS Webhook error:", error.message);
    // Trả về 200 để PayOS không retry liên tục
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
