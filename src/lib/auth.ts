import { NextRequest } from "next/server";
import { verifyToken, signToken } from "./jwt";
import { db } from "./firebase";
import { activeUser, sameOrigin } from "./security";
import {
  timingSafeEqual,
  createHash,
  createHmac,
  randomUUID,
} from "node:crypto";
export const ADMIN_COOKIE_NAME = "fh_admin_token",
  USER_COOKIE_NAME = "fh_user_token";
function credentialVersion() {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_USERNAME) return null;
  if (!process.env.JWT_SECRET) return null;
  return createHmac("sha256", process.env.JWT_SECRET)
    .update(
      process.env.ADMIN_USERNAME +
        "\0" +
        process.env.ADMIN_PASSWORD +
        "\0" +
        (process.env.ADMIN_TOTP_SECRET || "") +
        "\0" +
        (process.env.ADMIN_REQUIRE_MFA || ""),
    )
    .digest("hex");
}
export async function signAdminToken() {
  const version = credentialVersion();
  if (!version) throw new Error("ADMIN_CONFIG_MISSING");
  return signToken({ role: "admin", version }, "1h");
}
export function validateAdminCredentials(
  username: string,
  password: string,
): boolean {
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password ||
    !credentialVersion()
  )
    return false;
  const compare = (a: string, b: string) =>
    timingSafeEqual(
      createHash("sha256").update(a).digest(),
      createHash("sha256").update(b).digest(),
    );
  return (
    compare(username, process.env.ADMIN_USERNAME!) &&
    compare(password, process.env.ADMIN_PASSWORD!)
  );
}
async function token(req: NextRequest, name: string) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.cookies.has(name) &&
    !sameOrigin(req)
  )
    return null;
  return (
    req.cookies.get(name)?.value ||
    (req.headers.get("authorization")?.startsWith("Bearer ")
      ? req.headers.get("authorization")!.slice(7)
      : null)
  );
}
export async function getAdminTokenFromRequest(req: NextRequest) {
  return token(req, ADMIN_COOKIE_NAME);
}
export async function isAdminAuthenticated(req: NextRequest) {
  const value = await token(req, ADMIN_COOKIE_NAME);
  if (!value) return false;
  const data = await verifyToken(value);
  return (
    !!credentialVersion() &&
    data?.role === "admin" &&
    data.version === credentialVersion()
  );
}
export async function signUserToken(
  uid: string,
  email: string,
  version?: number,
) {
  if (version === undefined) {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists || !activeUser(snap.data()))
      throw new Error("USER_DENIED");
    version = snap.data()!.auth_version || 0;
  }
  return signToken({ role: "user", uid, email, version, sid: randomUUID() });
}
export async function getUserTokenFromRequest(req: NextRequest) {
  return token(req, USER_COOKIE_NAME);
}
export async function getAuthenticatedUser(
  req: NextRequest,
): Promise<{ uid: string; email: string } | null> {
  const value = await token(req, USER_COOKIE_NAME);
  if (!value) return null;
  const data = await verifyToken(value);
  if (
    data?.role !== "user" ||
    typeof data.uid !== "string" ||
    !data.uid ||
    data.uid.includes("/")
  )
    return null;
  const snap = await db.collection("users").doc(data.uid).get();
  const user = snap.data();
  if (
    !snap.exists ||
    !activeUser(user) ||
    user?.email_verified !== true ||
    data.version !== (user.auth_version || 0)
  )
    return null;
  if (
    data.sid &&
    (await db.collection("revoked_sessions").doc(data.sid).get()).exists
  )
    return null;
  return { uid: data.uid, email: user.email };
}
