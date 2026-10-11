import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { MockFirestore } from "./helpers/mock-firestore";
import { setDatabaseInstance } from "../src/lib/firebase";
import { POST as validateHandler } from "../src/app/api/license/validate/route";
import { queueLicenseEmail, deliverLicenseEmail } from "../src/lib/notifications";

const mockDb = new MockFirestore();

beforeEach(() => {
  mockDb.clear();
  setDatabaseInstance(mockDb as any);
});

test("A10: malformed license key rejected before writing to rate_limits", async () => {
  const req = new NextRequest("http://localhost/api/license/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licenseKey: "bad key with spaces!@#" }),
  });

  const res = await validateHandler(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.code, "INVALID_LICENSE_FORMAT");

  // Verify that NO document was created in rate_limits
  const rateLimits = mockDb.collection("rate_limits");
  const snap = await rateLimits.get();
  assert.equal(snap.size, 0);
});

test("A08: email outbox respects attempts, lease fencing and dead-letter queue", async () => {
  process.env.GMAIL_USER = "test@gmail.com";
  process.env.GMAIL_APP_PASSWORD = "app-password";

  const emailRef = mockDb.collection("email_outbox").doc("outbox-item-1");
  await emailRef.set({
    user_id: "user-1",
    license_id: "lic-1",
    status: "PENDING",
    attempts: 3,
    max_attempts: 5,
    next_attempt_at: new Date(Date.now() - 1000), // eligible
  });

  // Mock recipient missing so deliverLicenseEmail throws error
  await deliverLicenseEmail("outbox-item-1");

  const snap1 = await emailRef.get();
  assert.equal(snap1.data()?.attempts, 4);
  assert.equal(snap1.data()?.status, "PENDING");
  assert.ok(snap1.data()?.next_attempt_at);

  // Next delivery attempt should transition to DEAD_LETTER on 5th attempt
  await emailRef.update({ next_attempt_at: new Date(Date.now() - 1000) });
  await deliverLicenseEmail("outbox-item-1");

  const snap2 = await emailRef.get();
  assert.equal(snap2.data()?.status, "DEAD_LETTER");
  assert.equal(snap2.data()?.attempts, 5);
});
