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
    const ordersSnap = await mockDb.collection("payos_orders").get();
    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    orderData.payment.expiredAt = Math.floor(Date.now() / 1000) - 10;
    await orderDoc.ref.set(orderData);

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

test("L2-03 / R06: recovery without authentic account credentials returns RECOVERING status", async () => {
  const userRef = mockDb.collection("users").doc("user-r06");
  await userRef.set({
    email: "user-r06@example.test",
    email_verified: true,
    status: "ACTIVE",
  });
  const token = await signUserToken("user-r06", "user-r06@example.test", 0);

  delete process.env.PAYOS_ACCOUNT_NUMBER;
  delete process.env.PAYOS_BIN;

  // createPaymentLink throws; getPaymentLinkInformation returns SDK schema without account/QR fields
  setPayosClient({
    createPaymentLink: async () => {
      throw new Error("ETIMEDOUT: createPaymentLink response dropped");
    },
    getPaymentLinkInformation: async (orderCode: number) => ({
      id: "plink-sdk-real-pending-123",
      orderCode,
      amount: 69000,
      amountPaid: 0,
      amountRemaining: 69000,
      status: "PENDING",
      createdAt: "2026-10-11T00:00:00.000Z",
      transactions: [],
      cancellationReason: null,
      canceledAt: null,
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
        amount: 69000,
        requestId: "req-r06-pending-recovery-1234",
      }),
    });

    const res = await createLinkHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "RECOVERING");
    assert.equal(data.amount, 69000);
    assert.equal(data.recovered, false);
  } finally {
    setPayosClient(undefined);
  }
});

test("L2-02 / R06: recovery when provider reports CANCELLED preserves database PAID state committed during await", async () => {
  const userRef = mockDb.collection("users").doc("user-l2-02");
  await userRef.set({
    email: "user-l2-02@example.test",
    email_verified: true,
    status: "ACTIVE",
  });
  const token = await signUserToken("user-l2-02", "user-l2-02@example.test", 0);

  let webhookSimulated = false;
  const requestId = "req-l2-02-race-12345678";

  setPayosClient({
    createPaymentLink: async () => {
      throw new Error("Simulated dropped create response");
    },
    getPaymentLinkInformation: async (orderCode: number) => {
      // Simulate webhook committing PAID while recovery is awaiting provider
      if (!webhookSimulated) {
        webhookSimulated = true;
        const query = await mockDb.collection("payos_orders").get();
        for (const doc of query.docs) {
          if (doc.data().payosOrderCode === orderCode) {
            await doc.ref.update({ status: "PAID", paid_at: new Date() });
          }
        }
      }
      return {
        id: "plink-sdk-cancelled-race",
        orderCode,
        amount: 69000,
        amountPaid: 0,
        amountRemaining: 69000,
        status: "CANCELLED", // Provider says CANCELLED
        createdAt: "2026-10-11T00:00:00.000Z",
        transactions: [],
      };
    },
  } as any);

  try {
    const req = new NextRequest("http://localhost/api/payos/create-payment-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 69000,
        requestId,
      }),
    });

    const res = await createLinkHandler(req);
    // Must NOT downgrade to CANCELLED or return 410!
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "PAID");

    const orders = await mockDb.collection("payos_orders").get();
    const orderDoc = orders.docs.find((d) => d.data().amount === 69000);
    assert.equal(orderDoc?.data().status, "PAID");
  } finally {
    setPayosClient(undefined);
  }
});

test("R06: recovery when status is PAID rejects mismatched amountPaid and does not fulfill", async () => {
  const userRef = mockDb.collection("users").doc("user-r06-underpay");
  await userRef.set({
    email: "user-underpay@example.test",
    email_verified: true,
    status: "ACTIVE",
  });
  const token = await signUserToken("user-r06-underpay", "user-underpay@example.test", 0);

  // createPaymentLink throws; getPaymentLinkInformation reports PAID but with underpaid amount (1000 instead of 69000)
  setPayosClient({
    createPaymentLink: async () => {
      throw new Error("ETIMEDOUT: createPaymentLink response dropped");
    },
    getPaymentLinkInformation: async (orderCode: number) => ({
      id: "plink-sdk-real-paid-123",
      orderCode,
      amount: 69000,
      amountPaid: 1000, // Attacker underpaid!
      amountRemaining: 68000,
      status: "PAID",
      createdAt: "2026-10-11T00:00:00.000Z",
      transactions: [],
      cancellationReason: null,
      canceledAt: null,
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
        amount: 69000,
        requestId: "req-r06-underpay-1234",
      }),
    });

    const res = await createLinkHandler(req);
    // Must NOT return 200 with PAID fulfilled! Must reject with 400 or 502 error
    assert.notEqual(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, false);
  } finally {
    setPayosClient(undefined);
  }
});

