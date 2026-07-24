import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const signatureHeader = req.headers.get("x-webhook-signature") ?? "";
    const rawBody = await req.arrayBuffer();
    const rawBodyBuffer = Buffer.from(rawBody);

    const parts = Object.fromEntries(
      signatureHeader.split(",").map((p) => {
        const idx = p.indexOf("=");
        return [p.slice(0, idx), p.slice(idx + 1)];
      })
    );
    const { t: timestamp, v1 } = parts;

    if (!timestamp || !v1) {
      return NextResponse.json({ error: "Missing signature components" }, { status: 400 });
    }

    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) {
      return NextResponse.json({ error: "Webhook timestamp too old" }, { status: 400 });
    }

    const signedPayload = Buffer.concat([
      Buffer.from(`${timestamp}.`),
      rawBodyBuffer,
    ]);
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("base64");

    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(v1);

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = req.headers.get("x-webhook-event");
    const webhookId = req.headers.get("x-webhook-id");
    const payload = JSON.parse(rawBodyBuffer.toString());

    console.log("==========================================");
    console.log(`📩 [ElementPay Webhook Incoming Trigger]`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Event: ${event || "N/A"}`);
    console.log(`Webhook ID: ${webhookId || "N/A"}`);
    console.log(`Signature Header: ${signatureHeader || "N/A"}`);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("==========================================");

    if (event === "order.settled") {
      console.log(
        `✅ [ElementPay Webhook] Order ${payload.order_id} SETTLED — Fiat: ${payload.amount_fiat} ${payload.currency}, Crypto: ${payload.amount_crypto} USDC, TxHash: ${payload.settlement_transaction_hash || "N/A"}`
      );
      await prisma.transaction.updateMany({
        where: { chargeId: payload.order_id },
        data: {
          status: "completed",
          usdAmount: payload.amount_crypto ? Number(payload.amount_crypto) : null,
        },
      });
    } else if (event === "order.failed") {
      console.log(
        `❌ [ElementPay Webhook] Order ${payload.order_id} FAILED — Reason: ${payload.reason || payload.failure_reason || "UNKNOWN"}`
      );
      await prisma.transaction.updateMany({
        where: { chargeId: payload.order_id },
        data: { status: "failed" },
      });
    } else if (event === "order.processing") {
      console.log(
        `⏳ [ElementPay Webhook] Order ${payload.order_id} PROCESSING on payment rail.`
      );
    } else if (event === "order.refunded") {
      console.log(
        `↩️ [ElementPay Webhook] Order ${payload.order_id} REFUNDED.`
      );
    } else {
      console.log(
        `🔔 [ElementPay Webhook] Received unhandled event "${event}" for order ${payload.order_id}`
      );
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook Error", error);
    return NextResponse.json({ error: "Internal Webhook Error" }, { status: 500 });
  }
}
