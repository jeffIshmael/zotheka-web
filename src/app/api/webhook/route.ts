import { NextResponse } from "next/server";
import crypto from "crypto";

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
    const payload = JSON.parse(rawBodyBuffer.toString());

    if (event === "order.settled") {
      console.log(`✅ [ElementPay] Order ${payload.order_id} settled — hash ${payload.settlement_transaction_hash}`);
      // Future logic: update user balance or notify user
    } else if (event === "order.failed") {
      console.log(`❌ [ElementPay] Order ${payload.order_id} failed — reason: ${payload.reason || payload.failure_reason || "UNKNOWN"}`);
    } else if (event === "order.processing") {
      console.log(`⏳ [ElementPay] Order ${payload.order_id} is processing on the payment rail.`);
    } else {
      console.log(`🔔 [ElementPay] Received unhandled event ${event} for order ${payload.order_id}`);
    }

    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("Webhook Error", error);
    return NextResponse.json({ error: "Internal Webhook Error" }, { status: 500 });
  }
}
