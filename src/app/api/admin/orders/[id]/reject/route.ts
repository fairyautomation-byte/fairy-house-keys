import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure } from "@/lib/security";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { id } = await params,
      ref = db.collection("orders").doc(id);
    await db.runTransaction(
      async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new ApiError(404, "ORDER_NOT_FOUND");
        if (snap.data()!.status === "REJECTED") return;
        if (snap.data()!.status !== "PENDING_PAYMENT_REVIEW")
          throw new ApiError(409, "ORDER_NOT_PENDING");
        tx.update(ref, { status: "REJECTED", rejected_at: new Date() });
        tx.set(db.collection("admin_audit").doc(), {
          action: "REJECT_ORDER",
          order_id: id,
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
