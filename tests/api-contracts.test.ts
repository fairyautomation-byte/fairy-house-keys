import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as capabilitiesHandler } from "../src/app/api/capabilities/route";
import { GET as readinessHandler } from "../src/app/api/admin/readiness/route";
import { failure, ApiError } from "../src/lib/security";
import { db } from "../src/lib/firebase";

test("capabilities endpoint returns 200, valid capabilities contract, and no secrets", async () => {
  const res = await capabilitiesHandler();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(typeof data.apiVersion, "string");
  assert.equal(typeof data.minSupportedExtensionVersion, "string");
  assert.equal(typeof data.capabilities, "object");
  assert.equal(data.capabilities.phones, true);
  assert.equal(data.capabilities.validate, true);
  assert.equal(data.capabilities.idempotency, true);
  assert.equal(data.capabilities.paymentSettle, true);

  // Security check: ensure no private secrets or credentials leaked
  const text = JSON.stringify(data);
  assert.equal(text.includes("private_key"), false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("password"), false);
});

test("failure helper attaches correlationId, retryable, and Retry-After header", async () => {
  const req = new NextRequest("http://localhost/api/test", {
    headers: { "x-correlation-id": "corr-12345" },
  });
  const rateLimitErr = new ApiError(429, "RATE_LIMIT_EXCEEDED", undefined, 60);
  const res = failure(rateLimitErr, req);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("x-correlation-id"), "corr-12345");
  assert.equal(res.headers.get("Retry-After"), "60");

  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.success, false);
  assert.equal(data.code, "RATE_LIMIT_EXCEEDED");
  assert.equal(data.retryable, true);
  assert.equal(data.correlationId, "corr-12345");
});

test("admin readiness endpoint rejects unauthenticated requests with 401", async () => {
  const req = new NextRequest("http://localhost/api/admin/readiness", {
    method: "GET",
  });
  const res = await readinessHandler(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.code, "Unauthorized");
});

test("test guard in firebase.ts rejects production project fairy-house-keys in test mode", () => {
  const oldProject = process.env.FIREBASE_PROJECT_ID;
  const oldAppEnv = process.env.APP_ENV;
  try {
    process.env.FIREBASE_PROJECT_ID = "fairy-house-keys";
    process.env.APP_ENV = "staging";
    assert.throws(
      () => {
        // Accessing db triggers database()
        db.collection("test");
      },
      /SECURITY_GUARD_VIOLATION/,
    );
  } finally {
    process.env.FIREBASE_PROJECT_ID = oldProject;
    process.env.APP_ENV = oldAppEnv;
  }
});
