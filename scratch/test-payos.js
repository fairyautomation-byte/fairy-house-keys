
const PayOS = require('@payos/node');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY || process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY
);

async function test() {
  try {
    const paymentData = {
      orderCode: Number(String(Date.now()).slice(-8)),
      amount: 10000,
      description: 'Test payment',
      returnUrl: 'http://localhost:3000',
      cancelUrl: 'http://localhost:3000'
    };
    
    console.log('Sending:', paymentData);
    const res = await payos.createPaymentLink(paymentData);
    console.log('Response:', res);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
