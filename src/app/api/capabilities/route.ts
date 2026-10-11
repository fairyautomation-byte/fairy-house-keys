import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      apiVersion: "2.1.2",
      minSupportedExtensionVersion: "2.1.0",
      capabilities: {
        phones: true,
        validate: true,
        invite: true,
        idempotency: true,
        paymentSettle: true,
      },
      releaseId: "2026.10.11",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    },
  );
}
