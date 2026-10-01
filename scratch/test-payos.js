
const PayOS = require('@payos/node');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || "fcaaf2a3-ae41-4913-b9f2-ecb9b85c3793",
  process.env.PAYOS_API_KEY || "eb825018-e705-4020-b5f5-7368ded67af9",
  process.env.PAYOS_CHECKSUM_KEY || "0ec675d7621e3ece030f46aa7092b7b270d0ebf6e3bcbdbcba8a99ad3f286dda"
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
