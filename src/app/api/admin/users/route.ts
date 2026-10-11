import { publicUser } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = req.nextUrl.searchParams.get("limit");
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(
      100,
      Math.max(1, limitParam ? parseInt(limitParam, 10) || 50 : 50),
    );

    let query: any = db
      .collection("users")
      .orderBy("created_at", "desc")
      .limit(limit);

    if (cursor) {
      const cursorDoc = await db.collection("users").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc: any) => {
      const data = publicUser(doc.data());
      if (data.password) delete data.password;
      return {
        id: doc.id,
        ...data,
      };
    });

    const nextCursor =
      snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    const res = NextResponse.json(users);
    if (nextCursor) {
      res.headers.set("x-next-cursor", nextCursor);
      res.headers.set("x-has-more", "true");
    }
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
