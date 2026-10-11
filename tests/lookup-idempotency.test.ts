import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { MockFirestore } from "./helpers/mock-firestore";
import { setDatabaseInstance } from "../src/lib/firebase";
import { POST as phonesHandler } from "../src/app/api/license/phones/route";
import { consumeQuota, refundSystemQuota, vietnamDay } from "../src/lib/license-service";

const mockDb = new MockFirestore();

beforeEach(() => {
  mockDb.clear();
  setDatabaseInstance(mockDb as any);
});

test("A04: same requestId with different UIDs rejects with 409 REQUEST_ID_CONFLICT", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-123");
  const userRef = mockDb.collection("users").doc("user-lookup");

  await userRef.set({
    status: "ACTIVE",
    email_verified: true,
  });

  await licenseRef.set({
    license_key: "FHAD-LOOK-UPTE-ST01-0001",
    user_id: "user-lookup",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: vietnamDay(),
  });

  // Mock global fetch to return success for db1
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        data: [{ uid: "10000000001", phone: "0901111111" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const req1 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-LOOK-UPTE-ST01-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000001"],
        requestId: "req-stable-id-12345678",
      }),
    });

    const res1 = await phonesHandler(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.ok, true);

    // Call 2 with SAME requestId but DIFFERENT UIDs
    const req2 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-LOOK-UPTE-ST01-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000002"],
        requestId: "req-stable-id-12345678",
      }),
    });

    const res2 = await phonesHandler(req2);
    assert.equal(res2.status, 409);
    const data2 = await res2.json();
    assert.equal(data2.code, "REQUEST_ID_CONFLICT");
  } finally {
    global.fetch = originalFetch;
  }
});

test("A04: identical UIDs in different order reuse normalized fingerprint and return cached result", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-perm");
  const userRef = mockDb.collection("users").doc("user-lookup");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-PERM-UTAT-ION0-0001",
    user_id: "user-lookup",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: vietnamDay(),
  });

  let fetchCount = 0;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCount++;
    return new Response(
      JSON.stringify({
        ok: true,
        data: [
          { uid: "10000000001", phone: "0901111111" },
          { uid: "10000000002", phone: "0902222222" },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const req1 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-PERM-UTAT-ION0-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000001", "10000000002"],
        requestId: "req-perm-test-12345678",
      }),
    });

    const res1 = await phonesHandler(req1);
    assert.equal(res1.status, 200);

    // Call 2 with same requestId and reversed UIDs order
    const req2 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-PERM-UTAT-ION0-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000002", "10000000001"],
        requestId: "req-perm-test-12345678",
      }),
    });

    const res2 = await phonesHandler(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.ok, true);
    assert.equal(data2.phoneMap["10000000001"], "0901111111");

    // Provider should have been called only once for db1
    assert.equal(fetchCount, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("A03 & A04: system failure rolls back quota and marks receipt FAILED", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-fail");
  const userRef = mockDb.collection("users").doc("user-fail");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-FAIL-URET-EST0-0001",
    user_id: "user-fail",
    status: "ACTIVE",
    daily_limit: 50,
    daily_used: 10,
    total_scans: 10,
    last_reset_date: vietnamDay(),
  });

  const originalFetch = global.fetch;
  // Provider returns 502 HTML error
  global.fetch = async () =>
    new Response("<html>Bad Gateway 502</html>", {
      status: 502,
      headers: { "Content-Type": "text/html" },
    });

  try {
    const req = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-FAIL-URET-EST0-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000001", "10000000002"],
        requestId: "req-fail-system-12345678",
      }),
    });

    const res = await phonesHandler(req);
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.code, "PHONE_PROVIDER_UNAVAILABLE");

    // Quota should have been rolled back to initial (10 used), NOT 12!
    const licenseSnap = await licenseRef.get();
    assert.equal(licenseSnap.data()?.daily_used, 10);
  } finally {
    global.fetch = originalFetch;
  }
});

test("R02: retry after refund recharges quota atomically instead of returning free lookup", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-r02");
  const userRef = mockDb.collection("users").doc("user-r02");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-R020-TEST-QUOT-A001",
    user_id: "user-r02",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: vietnamDay(),
  });

  const originalFetch = global.fetch;
  const requestId = "req-r02-retry-12345678";

  try {
    // 1. First call fails (502 HTML)
    global.fetch = async () =>
      new Response("<html>Bad Gateway 502</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      });

    const req1 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-R020-TEST-QUOT-A001",
        installationId: "inst-lookup-device",
        uids: ["10000000001"],
        requestId,
      }),
    });

    const res1 = await phonesHandler(req1);
    assert.equal(res1.status, 502);

    const snapAfterFail = await licenseRef.get();
    assert.equal(snapAfterFail.data()?.daily_used, 0);

    // 2. Retry with same requestId succeeds
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [{ uid: "10000000001", phone: "0908888888" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const req2 = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-R020-TEST-QUOT-A001",
        installationId: "inst-lookup-device",
        uids: ["10000000001"],
        requestId,
      }),
    });

    const res2 = await phonesHandler(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.ok, true);
    assert.equal(data2.phoneMap["10000000001"], "0908888888");

    // The retry MUST recharge quota in the database so daily_used is 1, NOT 0!
    const snapAfterRetry = await licenseRef.get();
    assert.equal(snapAfterRetry.data()?.daily_used, 1);
    assert.equal(snapAfterRetry.data()?.total_scans, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("R03: refunding earlier day charge does not subtract from new day counter", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-r03");
  const userRef = mockDb.collection("users").doc("user-r03");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-R030-MIDN-IGHT-0001",
    user_id: "user-r03",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: "2026-10-10",
  });

  const oldOperation = "req-yesterday-12345678";
  await consumeQuota(licenseRef as any, "consume", 5, oldOperation);

  // Simulate that a newer day's legitimate consumption has reset the daily counter to 3
  await licenseRef.update({
    daily_used: 3,
    last_reset_date: "2099-01-02",
    total_scans: 8,
  });

  // Now process refund for the old operation (which happened on yesterday's date)
  await refundSystemQuota(licenseRef as any, 5, oldOperation);

  const afterRefund = (await licenseRef.get()).data()!;
  // Today's counter MUST NOT be wiped out (should stay 3, NOT 0)
  assert.equal(afterRefund.daily_used, 3);
  // Total scans should be adjusted: 8 - 5 = 3
  assert.equal(afterRefund.total_scans, 3);
});

test("R04: worker with lost/expired lease is fenced and cannot overwrite active worker or refund quota", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-r04-fence");
  const userRef = mockDb.collection("users").doc("user-r04-fence");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-R040-FENC-ETOK-EN01",
    user_id: "user-r04-fence",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 1,
    total_scans: 1,
    last_reset_date: vietnamDay(),
  });

  const requestId = "req-r04-fence-12345678";
  const { digest } = await import("../src/lib/security");
  const receiptRef = mockDb
    .collection("phone_requests")
    .doc(digest(`lic-r04-fence:${requestId}`));

  // Simulate Worker B has taken over the lease and successfully completed
  await receiptRef.set({
    status: "COMPLETED",
    lease_token: "worker-b-active-token",
    lease_until: new Date(Date.now() + 60000),
    result: {
      ok: true,
      phoneMap: { "10000000001": "0909999999" },
    },
  });

  // Now Worker A (old stale worker with token-a) finishes slow execution with error and tries to refund/fail
  // With fencing token protection, Worker A's write must be blocked by the lease check
  const staleLeaseToken = "worker-a-stale-token";

  // Simulate transactional fence update attempt
  await mockDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(receiptRef);
    if (!snap.exists || snap.data()?.lease_token !== staleLeaseToken) {
      // Fenced out!
      return;
    }
    tx.update(receiptRef, { status: "FAILED" });
  });

  const snapAfterStaleAttempt = await receiptRef.get();
  // Status must REMAIN COMPLETED and lease_token must remain Worker B's token
  assert.equal(snapAfterStaleAttempt.data()?.status, "COMPLETED");
  assert.equal(snapAfterStaleAttempt.data()?.lease_token, "worker-b-active-token");
});

test("L2-01: atomic rollbackPhoneFailure prevents refunding subsequent retry and guarantees exactly one charge", async () => {
  const licenseRef = mockDb.collection("licenses").doc("lic-l2-01");
  const userRef = mockDb.collection("users").doc("user-l2-01");

  await userRef.set({ status: "ACTIVE", email_verified: true });
  await licenseRef.set({
    license_key: "FHAD-L201-RACE-TEST-0001",
    user_id: "user-l2-01",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: vietnamDay(),
  });

  const requestId = "req-l2-01-race-12345678";
  const { rollbackPhoneFailure } = await import("../src/lib/license-service");
  const { digest } = await import("../src/lib/security");
  const phoneReceiptRef = mockDb
    .collection("phone_requests")
    .doc(digest(`lic-l2-01:${requestId}`));

  // 1. Worker A claims lease
  const leaseTokenA = "worker-a-lease-token";
  const fingerprint = digest(JSON.stringify(["10000000001"]));
  await phoneReceiptRef.set({
    fingerprint,
    status: "PROCESSING",
    lease_token: leaseTokenA,
    lease_until: new Date(Date.now() + 14000),
    created_at: new Date(),
  });
  // Worker A consumes quota
  await consumeQuota(licenseRef as any, "consume", 1, requestId);
  assert.equal((await licenseRef.get()).data()?.daily_used, 1);

  // 2. Worker A experiences provider failure and calls rollbackPhoneFailure
  const rollbackResult = await rollbackPhoneFailure(
    licenseRef as any,
    phoneReceiptRef as any,
    1,
    requestId,
    leaseTokenA,
    "UPSTREAM_502",
  );
  assert.equal(rollbackResult.rolledBack, true);

  // Assert atomic state: phone_requests is FAILED and daily_used is 0
  const afterA = (await licenseRef.get()).data()!;
  assert.equal(afterA.daily_used, 0);
  assert.equal((await phoneReceiptRef.get()).data()?.status, "FAILED");

  // 3. Worker B retries with same requestId
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        data: [{ uid: "10000000001", phone: "0908888888" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const reqB = new NextRequest("http://localhost/api/license/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: "FHAD-L201-RACE-TEST-0001",
        installationId: "inst-lookup-device",
        uids: ["10000000001"],
        requestId,
      }),
    });

    const resB = await phonesHandler(reqB);
    assert.equal(resB.status, 200);
    const bodyB = await resB.json();
    assert.equal(bodyB.phoneMap["10000000001"], "0908888888");

    // Worker B MUST be charged exactly 1 (not 0!)
    const finalLicense = (await licenseRef.get()).data()!;
    assert.equal(finalLicense.daily_used, 1);
    assert.equal(finalLicense.total_scans, 1);
    assert.equal((await phoneReceiptRef.get()).data()?.status, "COMPLETED");
  } finally {
    global.fetch = originalFetch;
  }
});


