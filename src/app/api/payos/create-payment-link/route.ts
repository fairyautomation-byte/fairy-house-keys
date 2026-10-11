import { NextRequest, NextResponse } from "next/server";
import { randomInt, randomUUID } from "node:crypto";
import { payos } from "@/lib/payos";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  validPlan,
  planIds,
  settlePayment,
  transitionOrderStatus,
} from "@/lib/order-service";
import {
  jsonBody,
  failure,
  ApiError,
  digest,
  activeUser,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    if (!(await checkRateLimit(`payment-create:${user.uid}`, 5, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const body = await jsonBody(req),
      planId = body.planId;
    if (planId && (!planIds.includes(planId) || planId === "trial"))
      throw new ApiError(400, "INVALID_PLAN");
    const requestId = body.requestId;
    if (
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    )
      throw new ApiError(400, "REQUEST_ID_REQUIRED");
    const plan = planId
      ? validPlan((await db.collection("plans").doc(planId).get()).data())
      : null;
    const amount = plan ? plan.price : body.amount;
    if (!Number.isSafeInteger(amount) || amount < 10000 || amount > 100000000)
      throw new ApiError(400, "INVALID_AMOUNT");
    const origin = new URL(
      process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        req.url,
    ).origin;
    for (const url of [body.returnUrl, body.cancelUrl])
      if (url && new URL(url).origin !== origin)
        throw new ApiError(400, "INVALID_REDIRECT");

    const ref = db
        .collection("payos_orders")
        .doc(digest(`${user.uid}:${requestId}`)),
      orderCode = randomInt(100000000000, 999999999999),
      transactionCode = `FH${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const reservation = db
      .collection("payos_order_codes")
      .doc(String(orderCode));

    const nowSec = Math.floor(Date.now() / 1000);
    const expirySec = nowSec + 300;

    const result: FirebaseFirestore.DocumentData = await db.runTransaction(
      async (tx) => {
        const [existing, reserved, owner] = await Promise.all([
          tx.get(ref),
          tx.get(reservation),
          tx.get(db.collection("users").doc(user.uid)),
        ]);
        if (!activeUser(owner.data()) || owner.data()?.email_verified !== true)
          throw new ApiError(403, "ACCOUNT_NOT_VERIFIED");
        if (existing.exists) {
          if (
            existing.data()!.amount !== amount ||
            existing.data()!.plan_id !== (planId || null)
          )
            throw new ApiError(409, "REQUEST_ID_CONFLICT");
          return existing.data()!;
        }
        if (reserved.exists) throw new ApiError(409, "ORDER_CODE_COLLISION");
        const data = {
          payosOrderCode: orderCode,
          transactionCode,
          userId: user.uid,
          amount,
          status: "CREATING",
          type: plan ? "PURCHASE" : "DEPOSIT",
          plan_id: planId || null,
          plan_snapshot: plan,
          created_at: new Date(),
          expired_at: new Date(expirySec * 1000),
          expiredAt: expirySec,
        };
        tx.set(ref, data);
        tx.set(reservation, { order_id: ref.id });
        return data;
      },
      { maxAttempts: 20 },
    );

    // If order was already fulfilled/paid (e.g. concurrent webhook/polling completed)
    if (result.status === "PAID") {
      return NextResponse.json({
        ok: true,
        orderCode: result.payosOrderCode,
        status: "PAID",
        amount: result.amount,
        licenseKey: result.license_key || null,
      });
    }

    const originalExpirySec =
      result.payment?.expiredAt ||
      result.expiredAt ||
      (result.expired_at
        ? typeof result.expired_at.toMillis === "function"
          ? Math.floor(result.expired_at.toMillis() / 1000)
          : Math.floor(new Date(result.expired_at).getTime() / 1000)
        : expirySec);

    if (result.payment) {
      if (originalExpirySec <= nowSec) {
        await transitionOrderStatus(ref, "EXPIRED", {
          expired_at: new Date(),
        });
        throw new ApiError(
          410,
          "PAYMENT_LINK_EXPIRED",
          "Liên kết thanh toán đã hết hạn. Vui lòng tạo yêu cầu mới.",
          undefined,
          false,
        );
      }
      return NextResponse.json({
        ...result.payment,
        expiredAt: originalExpirySec,
        timeLeft: Math.max(0, originalExpirySec - nowSec),
      });
    }

    const paymentData = {
      orderCode: result.payosOrderCode,
      amount: result.amount,
      description: String(result.payosOrderCode).slice(0, 25),
      returnUrl: `${origin}${plan ? "/dashboard/licenses" : "/dashboard/wallet"}`,
      cancelUrl: `${origin}${plan ? "/checkout" : "/dashboard/wallet"}`,
      expiredAt: originalExpirySec,
    };
    let link: any;
    try {
      link = await payos.createPaymentLink(paymentData);
    } catch {
      // Recovery path when createPaymentLink fails or drops response
      try {
        // First check current database status in case webhook committed during create call
        const currentSnap = await ref.get();
        if (currentSnap.data()?.status === "PAID") {
          return NextResponse.json({
            ok: true,
            orderCode: result.payosOrderCode,
            status: "PAID",
            amount: currentSnap.data()?.amount || result.amount,
            licenseKey: currentSnap.data()?.license_key || null,
          });
        }

        const info = await payos.getPaymentLinkInformation(
          result.payosOrderCode,
        );
        if (!info) {
          throw new ApiError(
            503,
            "PAYMENT_GATEWAY_UNAVAILABLE",
            "Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.",
            3,
            true,
          );
        }

        if (info.orderCode !== result.payosOrderCode) {
          throw new ApiError(502, "PAYMENT_ORDER_MISMATCH", "Mã đơn hàng không khớp.");
        }

        // Re-check database status right after fetching provider info (interleaving race check)
        const recheckSnap = await ref.get();
        if (recheckSnap.data()?.status === "PAID") {
          return NextResponse.json({
            ok: true,
            orderCode: result.payosOrderCode,
            status: "PAID",
            amount: recheckSnap.data()?.amount || result.amount,
            licenseKey: recheckSnap.data()?.license_key || null,
          });
        }

        if (info.status === "PAID") {
          if (info.amountPaid !== result.amount) {
            throw new ApiError(
              400,
              "PAYMENT_AMOUNT_MISMATCH",
              `Số tiền thanh toán (${info.amountPaid}) không khớp với giá trị đơn hàng (${result.amount}).`,
            );
          }
          await settlePayment(
            result.payosOrderCode,
            info.amountPaid,
            `create-recovery:${result.payosOrderCode}`,
          );
          const settledSnap = await ref.get();
          return NextResponse.json({
            ok: true,
            orderCode: result.payosOrderCode,
            status: "PAID",
            amount: info.amountPaid,
            licenseKey: settledSnap.data()?.license_key || null,
          });
        }

        if (info.status === "PENDING") {
          if (info.amount !== result.amount) {
            throw new ApiError(
              400,
              "PAYMENT_AMOUNT_MISMATCH",
              "Giá trị đơn hàng không khớp.",
            );
          }
          const bin = (info as any).bin || process.env.PAYOS_BIN || "";
          const accountNumber = (info as any).accountNumber || process.env.PAYOS_ACCOUNT_NUMBER || "";
          const accountName = (info as any).accountName || process.env.PAYOS_ACCOUNT_NAME || "FAIRY HOUSE";
          const checkoutUrl = (info as any).checkoutUrl || "";
          const qrCode = (info as any).qrCode || "";

          // Authentic payment details check:
          // To consider recovery ready for customer scanning, we must have non-empty bank account credentials or checkoutUrl.
          const hasAuthenticPayment = (Boolean(bin) && Boolean(accountNumber)) || Boolean(checkoutUrl);

          if (!hasAuthenticPayment) {
            // SDK v1 returned PENDING without account fields and server lacks environment bank credentials.
            // Return status: RECOVERING so client can poll or show a friendly synchronization state instead of fake QR.
            return NextResponse.json({
              ok: true,
              orderCode: result.payosOrderCode,
              status: "RECOVERING",
              recovered: false,
              amount: result.amount,
              message: "Đang đồng bộ thông tin thanh toán từ PayOS. Vui lòng thử lại sau giây lát.",
              retryAfter: 3,
              timeLeft: Math.max(0, originalExpirySec - nowSec),
              expiredAt: originalExpirySec,
            });
          }

          const payment = {
            orderCode: result.payosOrderCode,
            amount: result.amount,
            status: "PENDING",
            recovered: true,
            paymentLinkId: info.id,
            bin,
            accountNumber,
            accountName,
            description: String(result.payosOrderCode),
            transactionCode: result.transactionCode,
            expiredAt: originalExpirySec,
            timeLeft: Math.max(0, originalExpirySec - nowSec),
            checkoutUrl,
            qrCode,
          };

          await db.runTransaction(async (tx) => {
            const current = await tx.get(ref);
            if (current.data()?.status === "PAID") return;
            tx.update(ref, {
              payment,
              paymentLinkId: info.id,
              expires_at: new Date(originalExpirySec * 1000),
              ...(current.data()?.status === "CREATING" ? { status: "PENDING" } : {}),
            });
          });

          return NextResponse.json(payment);
        }

        if (["EXPIRED", "CANCELLED", "CANCELED"].includes(info.status)) {
          const target = info.status === "EXPIRED" ? "EXPIRED" : "CANCELED";
          const transition = await transitionOrderStatus(ref, target, {
            paymentLinkId: info.id,
          });
          if (transition.status === "PAID") {
            const currentOrder = (await ref.get()).data();
            return NextResponse.json({
              ok: true,
              orderCode: result.payosOrderCode,
              status: "PAID",
              amount: currentOrder?.amount || result.amount,
              licenseKey: currentOrder?.license_key || null,
            });
          }
          throw new ApiError(
            410,
            "PAYMENT_LINK_EXPIRED",
            "Liên kết thanh toán đã hết hạn hoặc bị hủy.",
          );
        }

        throw new ApiError(
          503,
          "PAYMENT_GATEWAY_UNAVAILABLE",
          "Cổng thanh toán chưa sẵn sàng.",
          3,
          true,
        );
      } catch (recErr: any) {
        if (recErr instanceof ApiError) throw recErr;
        throw new ApiError(
          503,
          "PAYMENT_GATEWAY_TIMEOUT",
          "Cổng thanh toán phản hồi chậm. Vui lòng thử lại sau.",
          3,
          true,
        );
      }
    }

    const payment = {
      checkoutUrl: link.checkoutUrl || "",
      qrCode: link.qrCode || "",
      orderCode: result.payosOrderCode,
      bin: link.bin,
      accountNumber: link.accountNumber,
      accountName: link.accountName,
      amount: result.amount,
      description: link.description || String(result.payosOrderCode),
      transactionCode: result.transactionCode,
      expiredAt: originalExpirySec,
      timeLeft: Math.max(0, originalExpirySec - nowSec),
    };
    await db.runTransaction(
      async (tx) => {
        const current = await tx.get(ref);
        if (current.data()?.status === "PAID") return;
        tx.update(ref, {
          payment,
          paymentLinkId: link.paymentLinkId || null,
          expires_at: new Date(originalExpirySec * 1000),
          status: "PENDING",
        });
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json(payment);
  } catch (err: any) {
    return failure(err);
  }
}
