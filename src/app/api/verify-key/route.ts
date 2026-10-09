import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  validateKeyFormat,
  KEY_SCAN_LIMITS,
  KEY_DURATIONS,
} from "@/lib/key-generator";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Kiểm tra Extension API secret
    const apiSecret = req.headers.get("x-fh-secret");
    if (
      !process.env.EXTENSION_API_SECRET ||
      !apiSecret ||
      apiSecret !== process.env.EXTENSION_API_SECRET
    ) {
      return NextResponse.json(
        { valid: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { key, machineId } = await jsonBody(req);
    if (
      typeof key !== "string" ||
      key.length > 80 ||
      typeof machineId !== "string" ||
      !/^[a-zA-Z0-9_-]{8,128}$/.test(machineId)
    ) {
      return NextResponse.json(
        { valid: false, error: "Thiếu thông tin" },
        { status: 400 },
      );
    }

    if (!(await checkRateLimit(`legacy-key:${machineId}`, 30, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");

    // Validate format key
    const formatCheck = validateKeyFormat(key.trim().toUpperCase());
    if (!formatCheck.valid) {
      return NextResponse.json({
        valid: false,
        error: "Key không đúng định dạng",
      });
    }

    // Tìm key trong DB
    const snap = await db
      .collection("license_keys")
      .where("key", "==", key.trim().toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false, error: "Key không tồn tại" });
    }

    const docRef = snap.docs[0].ref;
    const data = await db.runTransaction(
      async (tx) => {
        const fresh = await tx.get(docRef),
          current = fresh.data();
        if (!current || !["active", "ACTIVE"].includes(current.status))
          throw new ApiError(403, "LICENSE_INACTIVE");
        if (current.expiresAt && current.expiresAt.toMillis() <= Date.now())
          throw new ApiError(403, "LICENSE_EXPIRED");
        const machines: string[] = current.machineIds || [];
        if (
          !machines.includes(machineId) &&
          machines.length >= (current.maxMachines || 1)
        )
          throw new ApiError(403, "MACHINE_LIMIT_REACHED");
        tx.update(docRef, {
          machineIds: FieldValue.arrayUnion(machineId),
          lastVerifiedAt: FieldValue.serverTimestamp(),
        });
        return current;
      },
      { maxAttempts: 20 },
    );

    // Trả về thông tin license
    const expiresAt = data.expiresAt
      ? (data.expiresAt as Timestamp).toDate().toISOString()
      : null;
    const keyType = data.type as keyof typeof KEY_SCAN_LIMITS;
    const scanLimit = KEY_SCAN_LIMITS[keyType] ?? -1;
    const durationDays = KEY_DURATIONS[keyType] ?? null;

    // Features theo gói
    const featureMap: Record<string, string[]> = {
      trial: ["scan_basic"],
      monthly: ["scan_basic", "scan_advanced", "export", "phone"],
      quarterly: [
        "scan_basic",
        "scan_advanced",
        "export",
        "phone",
        "gender",
        "fanpage",
      ],
      yearly: [
        "scan_basic",
        "scan_advanced",
        "export",
        "phone",
        "gender",
        "fanpage",
        "unlimited",
      ],
      // Legacy
      standard: ["scan_basic", "scan_advanced", "export", "phone"],
      pro: [
        "scan_basic",
        "scan_advanced",
        "export",
        "phone",
        "gender",
        "fanpage",
      ],
      lifetime: [
        "scan_basic",
        "scan_advanced",
        "export",
        "phone",
        "gender",
        "fanpage",
        "unlimited",
      ],
    };

    return NextResponse.json({
      valid: true,
      type: data.type,
      expiresAt,
      scanLimit,
      durationDays,
      userName: data.userName,
      userEmail: data.userEmail,
      features: featureMap[data.type] || ["scan_basic"],
    });
  } catch (err) {
    return failure(err);
  }
}
export const dynamic = "force-dynamic";
