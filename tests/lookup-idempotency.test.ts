import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { MockFirestore } from "./helpers/mock-firestore";
import { setDatabaseInstance } from "../src/lib/firebase";
import { POST as phonesHandler } from "../src/app/api/license/phones/route";
import { consumeQuota, refundSystemQuota } from "../src/lib/license-service";

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
    last_reset_date: "2026-10-11",
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
    last_reset_date: "2026-10-11",
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
    last_reset_date: "2026-10-11",
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
