import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as adminDashboardHandler } from "../src/app/api/admin/dashboard/route";
import { GET as adminUsersHandler } from "../src/app/api/admin/users/route";
import { setDatabaseInstance } from "../src/lib/firebase";
import { MockFirestore } from "./helpers/mock-firestore";
import { signAdminToken } from "../src/lib/auth";

test("A12: Admin dashboard computes accurate ACTIVE licenses and limits recent orders to 20", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  process.env.ADMIN_USERNAME = "testadmin";
  process.env.ADMIN_PASSWORD = "testpassword123";
  process.env.JWT_SECRET = "testjwtsecretkeywithatleast32characterslong!!";

  const adminToken = await signAdminToken();
    // 1. Seed active and expired licenses
    const now = Date.now();
    mockDb.seed("licenses", "lic_active_1", {
      status: "ACTIVE",
      expires_at: new Date(now + 86400000), // ngày mai
      total_scans: 10,
    });
    mockDb.seed("licenses", "lic_active_2", {
      status: "ACTIVE",
      expires_at: null, // vĩnh viễn
      total_scans: 20,
    });
    mockDb.seed("licenses", "lic_expired_in_active_state", {
      status: "ACTIVE",
      expires_at: new Date(now - 86400000), // đã hết hạn hôm qua
      total_scans: 5,
    });
    mockDb.seed("licenses", "lic_revoked", {
      status: "REVOKED",
      expires_at: new Date(now + 86400000),
      total_scans: 0,
    });

    // 2. Seed 35 orders
    for (let i = 1; i <= 35; i++) {
      mockDb.seed("orders", `order_${i}`, {
        order_id: `ord_${i}`,
        status: i % 5 === 0 ? "PENDING_PAYMENT_REVIEW" : "PAID",
        amount: 100000,
        created_at: new Date(now - i * 1000),
      });
    }

    // Call admin dashboard with Authorization header
    const req = new NextRequest("http://localhost/api/admin/dashboard", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const res = await adminDashboardHandler(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(data.stats);
    // Phải là 2 active licenses (không tính lic_expired_in_active_state dù status là ACTIVE)
    assert.equal(data.stats.activeLicenses, 2);
    assert.equal(data.stats.totalScans, 35);

    // Recent orders phải bị bounded tối đa 20 items thay vì trả toàn bộ 35 orders
    assert.equal(data.recentOrders.length, 20);
});

test("A12: Admin users endpoint bounds query with limit parameter (max 100)", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  process.env.ADMIN_USERNAME = "testadmin";
  process.env.ADMIN_PASSWORD = "testpassword123";
  process.env.JWT_SECRET = "testjwtsecretkeywithatleast32characterslong!!";

  const adminToken = await signAdminToken();

  for (let i = 1; i <= 25; i++) {
    mockDb.seed("users", `user_${i}`, {
      email: `user${i}@example.com`,
      role: "user",
      created_at: new Date(),
    });
  }

  // Call with limit=10
  const req = new NextRequest("http://localhost/api/admin/users?limit=10", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const res = await adminUsersHandler(req);
  assert.equal(res.status, 200);

  const users = await res.json();
  assert.equal(users.length, 10);
});
