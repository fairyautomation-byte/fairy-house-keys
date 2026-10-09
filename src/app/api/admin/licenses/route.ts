import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure, jsonBody } from "@/lib/security";
import { licenseView } from "@/lib/license-service";
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const cursor = req.nextUrl.searchParams.get("cursor");
    let query = db.collection("licenses").orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.get(),
      users = await Promise.all(
        snap.docs.map((doc) =>
          db.collection("users").doc(doc.data().user_id).get(),
        ),
      );
    return NextResponse.json({
      items: snap.docs.map((doc, i) => ({
        ...doc.data(),
        id: doc.id,
        status: licenseView(doc.data()).license_status,
        email: users[i].data()?.email || "",
      })),
      nextCursor: snap.size === 100 ? snap.docs[99].id : null,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { id, status, reason } = await jsonBody(req);
    if (
      typeof id !== "string" ||
      id.includes("/") ||
      !["ACTIVE", "SUSPENDED", "REVOKED"].includes(status) ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.length > 500
    )
      throw new ApiError(400, "INVALID_REQUEST");
    const ref = db.collection("licenses").doc(id);
    await db.runTransaction(
      async (tx) => {
        const old = await tx.get(ref);
        if (!old.exists) throw new ApiError(404, "LICENSE_NOT_FOUND");
        tx.update(ref, { status, updated_at: new Date() });
        tx.set(db.collection("admin_audit").doc(), {
          action: "LICENSE_STATUS",
          license_id: id,
          old_status: old.data()!.status,
          status,
          reason,
          actor: process.env.ADMIN_USERNAME,
          created_at: new Date(),
        });
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
