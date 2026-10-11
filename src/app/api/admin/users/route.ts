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
    const limit = Math.min(
      100,
      Math.max(1, limitParam ? parseInt(limitParam, 10) || 50 : 50),
    );

    const snapshot = await db
      .collection("users")
      .orderBy("created_at", "desc")
      .limit(limit)
      .get();
    const users = snapshot.docs.map((doc: any) => {
      const data = publicUser(doc.data());
      if (data.password) delete data.password;
      return {
        id: doc.id,
        ...data,
      };
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
