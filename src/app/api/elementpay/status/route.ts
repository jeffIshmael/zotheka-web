import { NextResponse } from "next/server";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://sandbox.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_SANDBOX_API;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${ELEMENTPAY_API}/partner/orders/${orderId}`, {
      headers: { "X-API-Key": API_KEY },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Order status fetch error", error);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
