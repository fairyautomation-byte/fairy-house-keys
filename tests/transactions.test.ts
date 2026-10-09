import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "../src/lib/firebase";
import { buyWithWallet, settlePayment } from "../src/lib/order-service";
import { consumeQuota, vietnamDay } from "../src/lib/license-service";
import { issueOTP, completeOTP } from "../src/lib/account-service";
import { signUserToken, getAuthenticatedUser } from "../src/lib/auth";
import { checkRateLimit } from "../src/lib/rate-limit";
import { POST as approve } from "../src/app/api/admin/orders/[id]/approve/route";
import { POST as reject } from "../src/app/api/admin/orders/[id]/reject/route";
import { signAdminToken } from "../src/lib/auth";
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
if (enabled && !process.env.FIREBASE_PROJECT_ID?.startsWith("demo-"))
  throw new Error("Tests must use a demo project");
process.env.OTP_SECRET_KEY = randomBytes(32).toString("hex");
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.ADMIN_USERNAME = randomUUID();
process.env.ADMIN_PASSWORD = randomBytes(32).toString("hex");
const suffix = randomUUID(),
  userId = `test-${suffix}`;
before(async () => {
  if (!enabled) return;
  await db
    .collection("users")
    .doc(userId)
    .set({
      email: `${suffix}@example.test`,
      email_verified: true,
      wallet_balance: 1000000,
      trial_used: false,
    });
  for (const id of ["trial", "monthly"])
    await db
      .collection("plans")
      .doc(id)
      .set({
        price: id === "trial" ? 0 : 69000,
        duration: 3,
        scanLimit: 100,
        active: true,
      });
});
after(async () => {
  if (enabled) await db.terminate();
});
const integration = (name: string, fn: () => Promise<void>) =>
  test(name, { skip: !enabled }, fn);
integration(
  "20 concurrent payment notifications credit wallet and ledger exactly once",
  async () => {
    const code = randomInt(100000000000, 999999999999),
      ref = db.collection("payos_orders").doc(`deposit-${suffix}`);
    await ref.set({
      payosOrderCode: code,
      userId,
      amount: 50000,
      status: "PENDING",
      transactionCode: "TEST",
      type: "DEPOSIT",
    });
    await Promise.all(
      Array.from({ length: 20 }, () => settlePayment(code, 50000, "reference")),
    );
    assert.equal(
      (await db.collection("users").doc(userId).get()).data()!.wallet_balance,
      1050000,
    );
    assert.equal((await ref.get()).data()!.status, "PAID");
    await assert.rejects(settlePayment(code, 1, "forged"));
    assert.equal(
      (await db.collection("orders").doc(`payos_${code}`).get()).exists,
      true,
    );
  },
);
integration(
  "purchase callback fulfills a license without needing a browser or wallet debit",
  async () => {
    const code = randomInt(100000000000, 999999999999),
      ref = db.collection("payos_orders").doc(`purchase-${suffix}`);
    await ref.set({
      payosOrderCode: code,
      userId,
      amount: 69000,
      status: "PENDING",
      type: "PURCHASE",
      plan_id: "monthly",
      plan_snapshot: { price: 69000, duration: 30, scanLimit: 100 },
      transactionCode: "TEST",
    });
    const before = (await db.collection("users").doc(userId).get()).data()!
      .wallet_balance;
    const results = await Promise.all(
      Array.from({ length: 20 }, () => settlePayment(code, 69000, "ref")),
    );
    assert.equal(new Set(results.map((r) => r.licenseKey)).size, 1);
    assert.equal(
      (await db.collection("licenses").doc(`payos_${code}`).get()).exists,
      true,
    );
    assert.equal(
      (await db.collection("users").doc(userId).get()).data()!.wallet_balance,
      before,
    );
  },
);
integration(
  "20 concurrent trial requests grant exactly one license across unique requests",
  async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        buyWithWallet(userId, "trial", randomUUID()),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  },
);
integration(
  "wallet retry uses the same result and subtracts only once",
  async () => {
    const id = randomUUID(),
      before = (await db.collection("users").doc(userId).get()).data()!
        .wallet_balance;
    const results = await Promise.all(
      Array.from({ length: 20 }, () => buyWithWallet(userId, "monthly", id)),
    );
    assert.equal(new Set(results.map((r) => r.licenseKey)).size, 1);
    assert.equal(
      (await db.collection("users").doc(userId).get()).data()!.wallet_balance,
      before - 69000,
    );
    await assert.rejects(buyWithWallet(userId, "trial", id));
  },
);
integration(
  "quota resets atomically, deduplicates, enforces exact limit and denies revoked license",
  async () => {
    const ref = db.collection("licenses").doc(`quota-${suffix}`);
    await ref.set({
      license_key: "FHAD-AAAA-BBBB-CCCC-DDDD",
      user_id: userId,
      status: "ACTIVE",
      daily_limit: 20,
      daily_used: 999,
      last_reset_date: "2000-01-01",
      total_scans: 0,
    });
    await Promise.all(
      Array.from({ length: 20 }, () =>
        consumeQuota(ref, "consume", 1, randomUUID()),
      ),
    );
    const data = (await ref.get()).data()!;
    assert.equal(data.daily_used, 20);
    assert.equal(data.total_scans, 20);
    assert.equal(data.last_reset_date, vietnamDay());
    await assert.rejects(consumeQuota(ref, "consume", 1, randomUUID()));
    await ref.update({ daily_limit: 100 });
    const id = randomUUID();
    await Promise.all(
      Array.from({ length: 20 }, () => consumeQuota(ref, "consume", 3, id)),
    );
    assert.equal((await ref.get()).data()!.daily_used, 23);
    await assert.rejects(consumeQuota(ref, "consume", 4, id));
    await ref.update({ status: "REVOKED" });
    await assert.rejects(consumeQuota(ref, "consume", 3, id));
  },
);
integration(
  "OTP purpose, attempts, resend and one-time use are atomic",
  async () => {
    const email = `${suffix}@example.test`,
      issued = await issueOTP(email, "RESET_PASSWORD");
    await assert.rejects(completeOTP(email, issued.code, "VERIFY_EMAIL"));
    await assert.rejects(issueOTP(email, "RESET_PASSWORD"));
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        completeOTP(email, issued.code, "RESET_PASSWORD", "UpdatedPassword!"),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    await issued.ref.update({
      used: false,
      attempts: 0,
      invalidated: false,
      last_sent_at: new Date(0),
    });
    const fresh = await issueOTP(email, "RESET_PASSWORD");
    await assert.rejects(
      completeOTP(email, issued.code, "RESET_PASSWORD", "AnotherPassword!"),
    );
    await fresh.ref.update({ attempts: 0 });
    const wrong = fresh.code === "111111" ? "222222" : "111111";
    await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        completeOTP(email, wrong, "RESET_PASSWORD", "AnotherPassword!"),
      ),
    );
    assert.equal((await fresh.ref.get()).data()!.attempts, 5);
  },
);
integration(
  "existing JWT cannot authenticate after password/session version revocation",
  async () => {
    const email = `${suffix}@example.test`,
      token = await signUserToken(userId, email),
      request = new NextRequest("https://app.example/api/user/dashboard", {
        headers: { authorization: `Bearer ${token}` },
      });
    assert.equal((await getAuthenticatedUser(request))?.uid, userId);
    const ref = db.collection("users").doc(userId);
    await ref.update({
      auth_version: ((await ref.get()).data()!.auth_version || 0) + 1,
    });
    assert.equal(await getAuthenticatedUser(request), null);
  },
);
integration(
  "rate limit is shared and strict under concurrent requests",
  async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => checkRateLimit(`test:${suffix}`, 5, 60)),
    );
    assert.equal(results.filter((r) => r.allowed).length, 5);
  },
);
integration(
  "concurrent approval yields one license and paid order cannot be rejected",
  async () => {
    const id = `approve-${suffix}`;
    await db
      .collection("orders")
      .doc(id)
      .set({
        user_id: userId,
        plan_id: "monthly",
        amount: 69000,
        status: "PENDING_PAYMENT_REVIEW",
        plan_snapshot: { price: 69000, duration: 30, scanLimit: 100 },
      });
    const token = await signAdminToken(),
      req = () =>
        new NextRequest("https://app.example/api/admin/orders", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        }),
      context = { params: Promise.resolve({ id }) };
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => approve(req(), context)),
    );
    assert.ok(responses.every((r) => r.status === 200));
    const data = await Promise.all(responses.map((r) => r.json()));
    assert.equal(new Set(data.map((d) => d.licenseKey)).size, 1);
    assert.equal((await reject(req(), context)).status, 409);
  },
);

integration(
  "legacy activation binds only one device under concurrent requests",
  async () => {
    const { POST } = await import("../src/app/api/verify-key/route");
    const { generateKey } = await import("../src/lib/key-generator");
    process.env.EXTENSION_API_SECRET = randomBytes(32).toString("hex");
    const key = generateKey(),
      ref = db.collection("license_keys").doc(`legacy-${suffix}`);
    await ref.set({
      key,
      type: "monthly",
      status: "active",
      maxMachines: 1,
      machineIds: [],
      userName: "Test",
      userEmail: `${suffix}@example.test`,
    });
    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        POST(
          new NextRequest("http://localhost/api/verify-key", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-fh-secret": process.env.EXTENSION_API_SECRET!,
            },
            body: JSON.stringify({
              key,
              machineId: `test-device-${suffix}-${i}`,
            }),
          }),
        ),
      ),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 1);
    assert.equal((await ref.get()).data()!.machineIds.length, 1);
  },
);
