import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MockFirestore } from "./helpers/mock-firestore";
import { setDatabaseInstance } from "../src/lib/firebase";
import { settlePayment, transitionOrderStatus } from "../src/lib/order-service";

const mockDb = new MockFirestore();

beforeEach(() => {
  mockDb.clear();
  setDatabaseInstance(mockDb as any);
});

test("A05: transitionOrderStatus prevents downgrading PAID status to CANCELED", async () => {
  const orderRef = mockDb.collection("payos_orders").doc("order-test-1");
  await orderRef.set({
    payosOrderCode: 123456789,
    userId: "user-1",
    amount: 69000,
    status: "PAID",
    paid_at: new Date(),
  });

  const res = await transitionOrderStatus(orderRef as any, "CANCELED", {
    canceled_at: new Date(),
  });

  assert.equal(res.status, "PAID");
  assert.equal(res.transitioned, false);

  const finalSnap = await orderRef.get();
  assert.equal(finalSnap.data()?.status, "PAID");
});

test("A05: interleaving race between Webhook PAID and Poll CANCELLED preserves PAID", async () => {
  const code = 998877665544;
  const orderRef = mockDb.collection("payos_orders").doc(`order-${code}`);
  const userRef = mockDb.collection("users").doc("user-race-1");

  await userRef.set({
    email: "race@example.test",
    email_verified: true,
    wallet_balance: 0,
    status: "ACTIVE",
  });

  await mockDb.collection("plans").doc("monthly").set({
    price: 69000,
    duration: 30,
    scanLimit: 100,
    active: true,
  });

  await orderRef.set({
    payosOrderCode: code,
    transactionCode: "FHTEST123456",
    userId: "user-race-1",
    amount: 69000,
    status: "PENDING",
    type: "PURCHASE",
    plan_id: "monthly",
    plan_snapshot: { price: 69000, duration: 30, scanLimit: 100 },
  });

  // Step 1: Webhook arrives and settles payment
  const settleResult = await settlePayment(code, 69000, "webhook-ref-1");
  assert.equal(settleResult.duplicate, false);

  // Step 2: Concurrently or right after, a delayed poll/cancel operation tries to mark CANCELED
  const cancelResult = await transitionOrderStatus(orderRef as any, "CANCELED", {
    canceled_at: new Date(),
    cancel_reason: "STALE_POLL_RESULT",
  });

  // Must not have transitioned to CANCELED
  assert.equal(cancelResult.status, "PAID");
  assert.equal(cancelResult.transitioned, false);

  const freshOrder = await orderRef.get();
  assert.equal(freshOrder.data()?.status, "PAID");

  // Ledger must exist and have status PAID
  const ledger = await mockDb.collection("orders").doc(`payos_${code}`).get();
  assert.equal(ledger.exists, true);
  assert.equal(ledger.data()?.status, "PAID");

  // License must be generated
  const license = await mockDb.collection("licenses").doc(`payos_${code}`).get();
  assert.equal(license.exists, true);
  assert.equal(license.data()?.status, "ACTIVE");
});

test("A05: concurrent settlePayment and cancel operations guarantee PAID consistency", async () => {
  const code = 112233445566;
  const orderRef = mockDb.collection("payos_orders").doc(`order-${code}`);
  const userRef = mockDb.collection("users").doc("user-concurrent");

  await userRef.set({
    email: "concurrent@example.test",
    email_verified: true,
    wallet_balance: 100000,
    status: "ACTIVE",
  });

  await orderRef.set({
    payosOrderCode: code,
    transactionCode: "FHCONCURRENT",
    userId: "user-concurrent",
    amount: 50000,
    status: "PENDING",
    type: "DEPOSIT",
  });

  // Fire 10 settlePayment and 10 cancel transitions concurrently
  const ops = [
    ...Array.from({ length: 10 }, () => settlePayment(code, 50000, "ref")),
    ...Array.from({ length: 10 }, () =>
      transitionOrderStatus(orderRef as any, "CANCELED"),
    ),
  ];

  await Promise.all(ops);

  // Because settlePayment ran, final state in DB must be PAID
  const finalOrder = await orderRef.get();
  assert.equal(finalOrder.data()?.status, "PAID");

  // User wallet credited exactly once: 100000 + 50000 = 150000
  const finalUser = await userRef.get();
  assert.equal(finalUser.data()?.wallet_balance, 150000);
});
