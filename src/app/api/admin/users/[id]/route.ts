import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure } from "@/lib/security";
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { id } = await params,
      ref = db.collection("users").doc(id);
    await db.runTransaction(
      async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new ApiError(404, "USER_NOT_FOUND");
        tx.update(ref, {
          status: "DELETED",
          disabled: true,
          auth_version: (snap.data()!.auth_version || 0) + 1,
        });
        tx.set(db.collection("admin_audit").doc(), {
          action: "DELETE_USER",
          user_id: id,
          created_at: new Date(),
        });
      },
      { maxAttempts: 20 },
    );
    // Keep financial history and the tombstone so pending payments can still be reconciled.
    const licenses = await db
      .collection("licenses")
      .where("user_id", "==", id)
      .get();
    for (let i = 0; i < licenses.size; i += 400) {
      const batch = db.batch();
      for (const doc of licenses.docs.slice(i, i + 400))
        batch.update(doc.ref, { status: "REVOKED" });
      await batch.commit();
    }
    for (const collection of ["email_otp_sessions"]) {
      const sessions = await db
        .collection(collection)
        .where("uid", "==", id)
        .get();
      for (let i = 0; i < sessions.size; i += 400) {
        const batch = db.batch();
        for (const doc of sessions.docs.slice(i, i + 400))
          batch.delete(doc.ref);
        await batch.commit();
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
