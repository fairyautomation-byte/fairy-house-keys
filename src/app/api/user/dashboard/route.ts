import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser, USER_COOKIE_NAME } from "@/lib/auth";
import { publicUser, failure, ApiError } from "@/lib/security";
import { licenseView } from "@/lib/license-service";
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete(USER_COOKIE_NAME);
      return res;
    }
    const [account, licenses, orders] = await Promise.all([
      db.collection("users").doc(user.uid).get(),
      db.collection("licenses").where("user_id", "==", user.uid).get(),
      db.collection("orders").where("user_id", "==", user.uid).get(),
    ]);
    if (!account.exists) throw new ApiError(401, "Unauthorized");
    return NextResponse.json(
      {
        user: publicUser(account.data()),
        licenses: licenses.docs.map((doc) => {
          const data = doc.data(),
            view = licenseView(data);
          return { id: doc.id, ...data, ...view, status: view.license_status };
        }),
        orders: orders.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
