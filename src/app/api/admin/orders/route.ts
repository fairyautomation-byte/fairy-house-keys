import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure } from "@/lib/security";
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    let query = db
      .collection("orders")
      .orderBy("created_at", "desc")
      .limit(100);
    const cursor = req.nextUrl.searchParams.get("cursor");
    if (cursor) {
      const doc = await db.collection("orders").doc(cursor).get();
      if (!doc.exists) throw new ApiError(400, "INVALID_CURSOR");
      query = query.startAfter(doc);
    }
    const snap = await query.get(),
      users = await Promise.all(
        snap.docs.map((doc) =>
          db.collection("users").doc(doc.data().user_id).get(),
        ),
      );
    return NextResponse.json({
      items: snap.docs.map((doc, i) => ({
        id: doc.id,
        ...doc.data(),
        email: users[i].data()?.email || "",
      })),
      nextCursor: snap.size === 100 ? snap.docs[99].id : null,
    });
  } catch (error) {
    return failure(error);
  }
}
