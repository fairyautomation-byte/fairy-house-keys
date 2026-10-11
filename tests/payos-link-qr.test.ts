import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { MockFirestore } from "./helpers/mock-firestore";
import { setDatabaseInstance } from "../src/lib/firebase";
import { POST as createLinkHandler } from "../src/app/api/payos/create-payment-link/route";
import { setPayosClient } from "../src/lib/payos";
import { signUserToken } from "../src/lib/auth";

const mockDb = new MockFirestore();

beforeEach(() => {
  mockDb.clear();
  setDatabaseInstance(mockDb as any);
  process.env.JWT_SECRET = "0123456789abcdef0123456789abcdef";
});

test("A06 & A07: create-payment-link returns valid timeLeft and rejects expired payment link", async () => {
  const userRef = mockDb.collection("users").doc("user-payos");
  await userRef.set({
    email: "payos@example.test",
    email_verified: true,
    status: "ACTIVE",
  });

  const token = await signUserToken("user-payos", "payos@example.test", 0);

  // Mock PayOS SDK using setPayosClient
  setPayosClient({
    createPaymentLink: async (data: any) => ({
      checkoutUrl: "https://pay.payos.vn/web/test12345",
      qrCode: "00020101021238...",
      orderCode: data.orderCode,
      bin: "970422",
      accountNumber: "1234567890",
      accountName: "FAIRY HOUSE",
      amount: data.amount,
      description: data.description,
      paymentLinkId: "plink-test-123",
    }),
    getPaymentLinkInformation: async () => ({
      status: "PENDING",
    }),
  } as any);

  try {
    const req = new NextRequest("http://localhost/api/payos/create-payment-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 50000,
        requestId: "req-payos-intent-12345678",
      }),
    });

    const res = await createLinkHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.amount, 50000);
    assert.ok(data.timeLeft > 0 && data.timeLeft <= 300);
    assert.equal(typeof data.expiredAt, "number");

    // Test expiration: artificially set expiredAt to the past in DB
    const orderDocId = Object.keys(mockDb["store"]["collections"].get("payos_orders")?.entries().next().value[1]);
    const ordersMap = mockDb["store"]["collections"].get("payos_orders")!;
    const [orderKey, orderData] = ordersMap.entries().next().value;
    orderData.payment.expiredAt = Math.floor(Date.now() / 1000) - 10;
    ordersMap.set(orderKey, orderData);

    // Calling again with the same requestId should detect expired payment
    const reqExpired = new NextRequest("http://localhost/api/payos/create-payment-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 50000,
        requestId: "req-payos-intent-12345678",
      }),
    });

    const resExpired = await createLinkHandler(reqExpired);
    assert.equal(resExpired.status, 410);
    const errData = await resExpired.json();
    assert.equal(errData.code, "PAYMENT_LINK_EXPIRED");
  } finally {
    setPayosClient(undefined);
  }
});
