import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as adminDashboardHandler } from "../src/app/api/admin/dashboard/route";
import { GET as adminUsersHandler } from "../src/app/api/admin/users/route";
import { POST as reconcileHandler } from "../src/app/api/admin/reconcile-payments/route";
import { setDatabaseInstance } from "../src/lib/firebase";
import { MockFirestore } from "./helpers/mock-firestore";
import { signAdminToken } from "../src/lib/auth";
import { setPayosClient } from "../src/lib/payos";

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

test("L2-06: reconcile-payments cursor scan processes due orders beyond 200 delayed orders", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  let providerCalls = 0;
  const calledCodes: number[] = [];
  setPayosClient({
    getPaymentLinkInformation: async (orderCode: number) => {
      providerCalls++;
      calledCodes.push(orderCode);
      return {
        id: "mock-link",
        orderCode,
        amount: 50000,
        amountPaid: 0,
        amountRemaining: 50000,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        transactions: [],
      };
    },
  } as any);

  try {
    // Seed 200 delayed orders with next_reconcile_at in the future (+1 hour)
    for (let i = 0; i < 200; i++) {
      mockDb.seed("payos_orders", `a-${String(i).padStart(3, "0")}`, {
        status: "PENDING",
        payosOrderCode: i,
        amount: 50000,
        next_reconcile_at: new Date(Date.now() + 3600000),
      });
    }

    // Seed due order #201 without next_reconcile_at (or due)
    mockDb.seed("payos_orders", "z-due-201", {
      status: "PENDING",
      payosOrderCode: 201,
      amount: 50000,
    });

    const adminToken = await signAdminToken();
    const req = new NextRequest("http://localhost/api/admin/reconcile-payments", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });

    const res = await reconcileHandler(req);
    assert.equal(res.status, 200);
    // Anti-starvation check: order 201 must be processed despite 200 preceding delayed orders
    assert.ok(providerCalls >= 1, "Provider should be called for due order 201");
    assert.ok(calledCodes.includes(201), "Order 201 must be reached by cursor scan");
  } finally {
    setPayosClient(undefined);
  }
});

test("L2-07: admin dashboard aggregates accurately for > 1000 licenses without truncation", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  // Seed 1,001 active licenses, each with total_scans = 1
  for (let i = 0; i < 1001; i++) {
    mockDb.seed("licenses", `lic-${i}`, {
      status: "ACTIVE",
      total_scans: 1,
    });
  }

  const adminToken = await signAdminToken();
  const req = new NextRequest("http://localhost/api/admin/dashboard", {
    headers: { authorization: `Bearer ${adminToken}` },
  });

  const res = await adminDashboardHandler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.stats.activeLicenses, 1001);
  assert.equal(data.stats.totalScans, 1001);
});

test("L2-07: admin users keyset pagination and search beyond page 1 (> 50 users)", async () => {
  const mockDb = new MockFirestore();
  setDatabaseInstance(mockDb as any);

  // Seed 60 users with created_at timestamps
  const baseTime = Date.now();
  for (let i = 1; i <= 60; i++) {
    mockDb.seed("users", `user_${String(i).padStart(3, "0")}`, {
      email: i === 55 ? "special.target@example.com" : `user${i}@example.com`,
      full_name: i === 55 ? "Special Person" : `User ${i}`,
      role: "user",
      created_at: new Date(baseTime - i * 1000),
    });
  }

  const adminToken = await signAdminToken();

  // 1. Fetch page 1 (50 users)
  const reqPage1 = new NextRequest("http://localhost/api/admin/users?limit=50", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const resPage1 = await adminUsersHandler(reqPage1);
  assert.equal(resPage1.status, 200);
  const usersPage1 = await resPage1.json();
  assert.equal(usersPage1.length, 50);

  const nextCursor = resPage1.headers.get("x-next-cursor");
  const hasMore = resPage1.headers.get("x-has-more");
  assert.ok(nextCursor, "x-next-cursor header must be present on page 1");
  assert.equal(hasMore, "true");

  // 2. Fetch page 2 using cursor (remaining 10 users)
  const reqPage2 = new NextRequest(`http://localhost/api/admin/users?limit=50&cursor=${nextCursor}`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const resPage2 = await adminUsersHandler(reqPage2);
  assert.equal(resPage2.status, 200);
  const usersPage2 = await resPage2.json();
  assert.equal(usersPage2.length, 10);

  // 3. Search query finds user #55 located on page 2
  const reqSearch = new NextRequest("http://localhost/api/admin/users?search=special.target", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const resSearch = await adminUsersHandler(reqSearch);
  assert.equal(resSearch.status, 200);
  const searchResults = await resSearch.json();
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].email, "special.target@example.com");
});
