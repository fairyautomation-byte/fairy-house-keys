import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallel fetches for speed
    const [usersSnap, licensesSnap, ordersSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("licenses").get(),
      db.collection("orders").orderBy("created_at", "desc").get(),
    ]);

    const usersCount = usersSnap.size;
    const activeLicenses = licensesSnap.docs.filter(
      (d: any) => d.data().status === "ACTIVE",
    ).length;

    let totalScans = 0;
    licensesSnap.forEach((doc: any) => {
      totalScans += doc.data().total_scans || 0;
    });

    const pendingOrders = ordersSnap.docs.filter(
      (d: any) => d.data().status === "PENDING_PAYMENT_REVIEW",
    ).length;

    // Recent 20 orders
    const recentOrders = ordersSnap.docs
      .slice(0, 20)
      .map((doc: any) => ({ id: doc.id, ...doc.data() }));

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
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
