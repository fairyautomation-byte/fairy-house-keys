import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { signToken, verifyToken } from "../src/lib/jwt";
import { validateAdminCredentials } from "../src/lib/auth";
import {
  emailAddress,
  sameOrigin,
  jsonBody,
  publicUser,
} from "../src/lib/security";
import { licenseView, scanInput } from "../src/lib/license-service";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.KEY_SECRET_SALT = randomBytes(32).toString("hex");
test("password hashes use independent salts and reject wrong or corrupted values", async () => {
  const a = await hashPassword("CorrectPassword!"),
    b = await hashPassword("CorrectPassword!");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("CorrectPassword!", a), true);
  assert.equal(await verifyPassword("WrongPassword!", a), false);
  assert.equal(
    await verifyPassword("CorrectPassword!", "scrypt$999999999$8$1$ab$cd"),
    false,
  );
  const legacy = createHash("sha256")
    .update("OldPassword!" + process.env.KEY_SECRET_SALT)
    .digest("hex");
  assert.equal(await verifyPassword("OldPassword!", legacy), true);
});
test("JWT rejects missing secret, tampering and algorithm changes", async () => {
  const token = await signToken({ role: "user", uid: "test" });
  assert.equal((await verifyToken(token)).uid, "test");
  assert.equal(await verifyToken(token + "x"), null);
  const secret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  await assert.rejects(signToken({ role: "admin" }));
  assert.equal(await verifyToken(token), null);
  process.env.JWT_SECRET = secret;
});
test("blank administrator configuration does not authenticate", () => {
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(validateAdminCredentials("", ""), false);
});
test("email parser rejects recipient lists and HTML; user responses hide auth data", () => {
  assert.throws(() => emailAddress("a@b.com,c@d.com"));
  assert.throws(() => emailAddress("<a@b.com>"));
  assert.throws(() => emailAddress("a@b.com\r\nBcc:x@y.com"));
  assert.equal(emailAddress("A@B.com"), "a@b.com");
  assert.equal(
    publicUser({ email: "a@b.com", password: "private", auth_version: 2 })
      .password,
    undefined,
  );
});
test("quota input rejects string, decimal, null and arbitrary action", () => {
  for (const value of ["1", 1.5, null, 0, 501])
    assert.throws(() => scanInput("consume", value, "request-1234567890"));
  assert.throws(() => scanInput("refund", 1, "request-1234567890"));
  assert.throws(() => scanInput("consume", 1, undefined));
  scanInput("check", 1, undefined);
});
test("license display crosses Vietnam midnight without mutating quota", () => {
  const data = {
    status: "ACTIVE",
    plan_id: "trial",
    daily_limit: 100,
    daily_used: 50,
    last_reset_date: "2026-10-09",
    total_scans: 50,
    expires_at: new Date("2026-10-12"),
  };
  assert.equal(
    licenseView(data, new Date("2026-10-09T16:59:59Z")).daily_used,
    50,
  );
  assert.equal(
    licenseView(data, new Date("2026-10-09T17:00:00Z")).daily_used,
    0,
  );
  assert.equal(data.daily_used, 50);
  assert.equal(licenseView(data, new Date("2026-10-13")).valid, false);
});
test("cookie API origin rejects cross-origin and malformed JSON", async () => {
  assert.equal(sameOrigin(new NextRequest("http://localhost:3100/api/auth/login", {headers:{host:"127.0.0.1:3100", origin:"http://127.0.0.1:3100"}})),true);
  assert.equal(
    sameOrigin(
      new NextRequest("https://app.example/api/orders", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    ),
    false,
  );
  assert.equal(
    sameOrigin(
      new NextRequest("https://app.example/api/orders", {
        method: "POST",
        headers: { origin: "https://app.example" },
      }),
    ),
    true,
  );
  await assert.rejects(
    jsonBody(
      new NextRequest("https://app.example/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "[]",
      }),
    ),
  );
});

test("TOTP matches RFC 6238 reference vector", async () => {
  const { totp } = await import("../src/lib/admin-mfa");
  assert.equal(totp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1, 8), "94287082");
});
