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
    // Parallel bounded queries for dashboard stats
    const [usersSnap, licensesSnap, recentOrdersSnap, pendingOrdersSnap] =
      await Promise.all([
        db.collection("users").get(),
        db.collection("licenses").get(),
        db.collection("orders").orderBy("created_at", "desc").limit(20).get(),
        db
          .collection("orders")
          .where("status", "==", "PENDING_PAYMENT_REVIEW")
          .limit(100)
          .get(),
      ]);

    const usersCount = usersSnap.size;
    let totalScans = 0;
    let activeLicenses = 0;

    licensesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      totalScans += data.total_scans || 0;
      const expired =
        data.expires_at?.toDate ? data.expires_at.toDate() : data.expires_at ? new Date(data.expires_at) : null;
      const isExpired = expired && expired.getTime() <= now.getTime();
      if (data.status === "ACTIVE" && !isExpired) {
        activeLicenses++;
      }
    });

    const pendingOrders = pendingOrdersSnap.size;
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
