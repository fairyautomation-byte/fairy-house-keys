import { SignJWT, jwtVerify } from "jose";
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || new TextEncoder().encode(value).length < 32)
    throw new Error("JWT_CONFIG_MISSING");
  return new TextEncoder().encode(value);
}
export async function signToken(
  payload: any,
  expiresIn = "7d",
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("fairy-house")
    .setAudience("fairy-house")
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}
export async function verifyToken(token: string): Promise<any> {
  try {
    return (
      await jwtVerify(token, secret(), {
        algorithms: ["HS256"],
        issuer: "fairy-house",
        audience: "fairy-house",
      })
    ).payload;
  } catch {
    return null;
  }
}
