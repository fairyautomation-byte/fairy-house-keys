import { scrypt, randomBytes, timingSafeEqual, createHash } from "node:crypto";
const N = 131072,
  r = 8,
  p = 1;
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      32,
      { N, r, p, maxmem: 160 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export function validPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    Buffer.byteLength(value) <= 1024
  );
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${N}$${r}$${p}$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password) > 1024 ||
    typeof stored !== "string"
  )
    return false;
  let actual: Buffer, expected: Buffer;
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (
      parts.length !== 6 ||
      parts[1] !== String(N) ||
      parts[2] !== String(r) ||
      parts[3] !== String(p) ||
      !/^[a-f0-9]{32}$/.test(parts[4]) ||
      !/^[a-f0-9]{64}$/.test(parts[5])
    )
      return false;
    actual = await derive(password, parts[4]);
    expected = Buffer.from(parts[5], "hex");
  } else {
    if (!/^[a-f0-9]{64}$/.test(stored) || !process.env.KEY_SECRET_SALT)
      return false;
    actual = createHash("sha256")
      .update(password + process.env.KEY_SECRET_SALT)
      .digest();
    expected = Buffer.from(stored, "hex");
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
