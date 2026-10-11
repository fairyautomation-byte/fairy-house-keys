import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  validateLicense,
  unbindLicenseInstallation,
} from "../src/lib/license-service";
import { POST as unbindHandler } from "../src/app/api/license/unbind/route";
import { POST as validateHandler } from "../src/app/api/license/validate/route";
import { POST as phonesHandler } from "../src/app/api/license/phones/route";
import { setDatabaseInstance } from "../src/lib/firebase";
import { MockFirestore } from "./helpers/mock-firestore";

test("A09: License device binding & unbind state machine", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  // Setup mock user & license
  mockDb.seed("users", "user_abc", {
    status: "ACTIVE",
    role: "user",
  });

  mockDb.seed("licenses", "lic_1", {
    license_key: "FHAD-AAAA-BBBB-CCCC-DDDD",
    user_id: "user_abc",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    total_scans: 0,
  });

  const licRef = mockDb.collection("licenses").doc("lic_1");

  // Step 1: First validation binds installation_1
  const res1 = await validateLicense(licRef as any, "inst_device_one", {
    deviceName: "Laptop Admin",
  });
  assert.equal(res1.valid, true);
  assert.equal(res1.installation_id, "inst_device_one");
  assert.equal(res1.bound_to_device, true);

  // Step 2: Second validation from the SAME device succeeds
  const res2 = await validateLicense(licRef as any, "inst_device_one");
  assert.equal(res2.valid, true);

  // Step 3: Validation from a DIFFERENT device is rejected with DEVICE_LIMIT_EXCEEDED
  await assert.rejects(
    async () => {
      await validateLicense(licRef as any, "inst_device_two");
    },
    (err: any) => {
      assert.equal(err.code, "DEVICE_LIMIT_EXCEEDED");
      assert.equal(err.status, 403);
      return true;
    },
  );

  // Step 4: Unbind from an unauthorized installation is rejected
  await assert.rejects(
    async () => {
      await unbindLicenseInstallation(licRef as any, "inst_intruder", null);
    },
    (err: any) => {
      assert.equal(err.code, "UNAUTHORIZED_UNBIND");
      assert.equal(err.status, 403);
      return true;
    },
  );

  // Step 5: Unbind from the authorized installation succeeds
  const unbindRes = await unbindLicenseInstallation(
    licRef as any,
    "inst_device_one",
    null,
  );
  assert.equal(unbindRes.unbound, true);

  // Verify license doc has cleared installation_id
  const docAfterUnbind = await licRef.get();
  assert.equal(docAfterUnbind.data().installation_id, null);

  // Step 6: Device two can now successfully bind to the license
  const res3 = await validateLicense(licRef as any, "inst_device_two", {
    deviceName: "Desktop Work",
  });
  assert.equal(res3.valid, true);
  assert.equal(res3.installation_id, "inst_device_two");
  assert.equal(res3.bound_to_device, true);
});

test("A09: POST /api/license/unbind route works with valid installation or owner", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  mockDb.seed("users", "user_unbind_test", {
    status: "ACTIVE",
    role: "user",
  });

  mockDb.seed("licenses", "lic_unbind_test", {
    license_key: "FHAD-1111-2222-3333-4444",
    user_id: "user_unbind_test",
    status: "ACTIVE",
    daily_limit: 50,
    installation_id: "inst_my_pc",
  });

  // Call unbind endpoint with installationId
  const req = new NextRequest("http://localhost/api/license/unbind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      licenseKey: "FHAD-1111-2222-3333-4444",
      installationId: "inst_my_pc",
    }),
  });

  const res = await unbindHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.unbound, true);
});

test("A09: POST /api/license/phones rejects foreign installation when license is bound", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  mockDb.seed("users", "user_phone_test", {
    status: "ACTIVE",
    role: "user",
  });

  mockDb.seed("licenses", "lic_phone_test", {
    license_key: "FHAD-5555-6666-7777-8888",
    user_id: "user_phone_test",
    status: "ACTIVE",
    daily_limit: 100,
    daily_used: 0,
    installation_id: "inst_legit_device",
  });

  // Request with mismatched installationId
  const req = new NextRequest("http://localhost/api/license/phones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      licenseKey: "FHAD-5555-6666-7777-8888",
      uids: ["100012345678901"],
      requestId: "req-phone-mismatch-1234",
      installationId: "inst_foreign_device",
    }),
  });

  const res = await phonesHandler(req);
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, "DEVICE_LIMIT_EXCEEDED");
});
