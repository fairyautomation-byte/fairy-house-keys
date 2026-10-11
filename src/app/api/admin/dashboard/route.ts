import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Users count aggregation (conditional fallback only on failure)
    let usersCount: number | null = null;
    if (typeof (db.collection("users") as any).count === "function") {
      try {
        const s = await (db.collection("users") as any).count().get();
        usersCount = s.data().count;
      } catch (_) {}
    }
    if (usersCount === null) {
      const snap = await db.collection("users").get();
      usersCount = snap.size;
    }

    // 2. Pending orders count aggregation (conditional fallback only on failure)
    let pendingOrders: number | null = null;
    const pendingQuery = db.collection("orders").where("status", "==", "PENDING_PAYMENT_REVIEW");
    if (typeof (pendingQuery as any).count === "function") {
      try {
        const s = await (pendingQuery as any).count().get();
        pendingOrders = s.data().count;
      } catch (_) {}
    }
    if (pendingOrders === null) {
      const snap = await pendingQuery.get();
      pendingOrders = snap.size;
    }

    // 3. Licenses aggregation without arbitrary 1000 truncation cap
    let totalScans = 0;
    let activeLicenses = 0;
    let lastLicDoc: any = null;

    while (true) {
      let lq: any = db.collection("licenses");
      if (lastLicDoc && typeof lq.startAfter === "function") {
        lq = lq.startAfter(lastLicDoc);
      } else if (lastLicDoc) {
        break;
      }

      if (typeof lq.startAfter !== "function") {
        const snap = await lq.get();
        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          totalScans += Number(data.total_scans || 0);
          const expired = data.expires_at?.toDate
            ? data.expires_at.toDate()
            : data.expires_at
              ? new Date(data.expires_at)
              : null;
          const isExpired = expired && expired.getTime() <= now.getTime();
          if (data.status === "ACTIVE" && !isExpired) {
            activeLicenses++;
          }
        });
        break;
      }

      const snap = await lq.limit(1000).get();
      if (!snap || snap.empty || snap.docs.length === 0) break;

      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        totalScans += Number(data.total_scans || 0);
        const expired = data.expires_at?.toDate
          ? data.expires_at.toDate()
          : data.expires_at
            ? new Date(data.expires_at)
            : null;
        const isExpired = expired && expired.getTime() <= now.getTime();
        if (data.status === "ACTIVE" && !isExpired) {
          activeLicenses++;
        }
      });

      if (snap.docs.length < 1000) break;
      lastLicDoc = snap.docs[snap.docs.length - 1];
    }

    // 4. Recent orders
    const recentOrdersSnap = await db
      .collection("orders")
      .orderBy("created_at", "desc")
      .limit(20)
      .get();
    const recentOrders = recentOrdersSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      stats: {
        totalUsers: usersCount,
        activeLicenses: activeLicenses,
        totalScans: totalScans,
        pendingOrders: pendingOrders,
      },
      recentOrders: recentOrders,
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
