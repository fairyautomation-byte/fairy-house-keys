import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure, jsonBody } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { dryRun = true } = await jsonBody(req),
      yesterday = new Date(Date.now() - 86400000);
    let deletedUsers = 0,
      deletedSessions = 0;
    const users = await db
      .collection("users")
      .where("email_verified", "==", false)
      .where("created_at", "<", yesterday)
      .limit(400)
      .get();
    for (const doc of users.docs) {
      const [licenses, orders, payments] = await Promise.all([
        db.collection("licenses").where("user_id", "==", doc.id).limit(1).get(),
        db.collection("orders").where("user_id", "==", doc.id).limit(1).get(),
        db
          .collection("payos_orders")
          .where("userId", "==", doc.id)
          .limit(1)
          .get(),
      ]);
      if (!licenses.empty || !orders.empty || !payments.empty) continue;
      deletedUsers++;
      if (!dryRun)
        await doc.ref.update({
          status: "DELETED",
          disabled: true,
          auth_version: (doc.data().auth_version || 0) + 1,
        });
    }
    const sessions = await db
      .collection("email_otp_sessions")
      .where("created_at", "<", yesterday)
      .limit(400)
      .get();
    deletedSessions = sessions.size;
    if (!dryRun && sessions.size) {
      const batch = db.batch();
      sessions.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    return NextResponse.json({
      ok: true,
      dryRun,
      deletedUsers,
      deletedSessions,
      hasMore: users.size === 400 || sessions.size === 400,
    });
  } catch (error) {
    return failure(error);
  }
}
