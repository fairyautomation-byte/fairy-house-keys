const crypto = require('crypto');
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY;

async function simulate() {
  try {
    const order = {
      payosOrderCode: 50564431,
      amount: 10000,
      paymentLinkId: 'simulated_link'
    };
    
    console.log(`Đã tìm thấy đơn hàng: ${order.payosOrderCode} - ${order.amount}đ`);

    // Payload của PayOS v1.x (WebhookDataType)
    const dataObj = {
      orderCode: order.payosOrderCode,
      amount: order.amount,
      description: 'SIMULATED PAYMENT',
      accountNumber: 'VQR123',
      reference: 'SIMREF123',
      transactionDateTime: new Date().toISOString(),
      currency: 'VND',
      paymentLinkId: order.paymentLinkId || 'test_link',
      code: '00',
      desc: 'Success'
    };

    // Tạo chữ ký (Signature) - Sắp xếp dataObj theo key alpha và ghép chuỗi
    const signData = `amount=${dataObj.amount}&cancelUrl=&description=${dataObj.description}&orderCode=${dataObj.orderCode}&returnUrl=`;
    // Wait, signature calculation for WEBHOOK is different!
    // It's: amount=...&cancelUrl=... ? No, the webhook data is:
    // amount=...&code=...&currency=...&description=...&orderCode=...
    const sortedKeys = Object.keys(dataObj).sort();
    const signParams = [];
    for (const key of sortedKeys) {
      if (dataObj[key] !== undefined && dataObj[key] !== null) {
        signParams.push(`${key}=${dataObj[key]}`);
      }
    }
    const signStr = signParams.join('&');
    const signature = crypto.createHmac('sha256', CHECKSUM_KEY).update(signStr).digest('hex');

    const webhookBody = {
      code: '00',
      desc: 'Success',
      data: dataObj,
      signature: signature
    };

    console.log("Gửi Webhook giả lập tới Vercel...");
    const res = await fetch('https://fairy-house-keys.vercel.app/api/payos/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody)
    });

    const text = await res.text();
    console.log(`Kết quả từ Webhook API (Status: ${res.status}):`, text);

  } catch (err) {
    console.error("Lỗi:", err);
  }
}

simulate();
