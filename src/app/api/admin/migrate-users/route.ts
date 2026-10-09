import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure, jsonBody } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { confirm, dryRun = true, cursor } = await jsonBody(req);
    if (!dryRun && confirm !== "I_KNOW_WHAT_I_AM_DOING")
      throw new ApiError(400, "CONFIRM_REQUIRED");
    let query = db.collection("users").orderBy("__name__").limit(400);
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.get(),
      batch = db.batch();
    let changed = 0;
    for (const doc of snap.docs)
      if (doc.data().email_verified === undefined) {
        changed++;
        if (!dryRun) batch.update(doc.ref, { email_verified: false });
      }
    if (!dryRun && changed) await batch.commit();
    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        total_scanned: snap.size,
        set_to_verified: 0,
        set_to_unverified: changed,
      },
      nextCursor: snap.size === 400 ? snap.docs[399].id : null,
    });
  } catch (error) {
    return failure(error);
  }
}
