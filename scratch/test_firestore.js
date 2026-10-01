const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const orders = await db.collection('payos_orders').orderBy('created_at', 'desc').limit(5).get();
  orders.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

run();
