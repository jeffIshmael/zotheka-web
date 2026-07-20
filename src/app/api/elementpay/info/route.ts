import { NextResponse } from "next/server";

const ELEMENTPAY_API = "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const orderType = searchParams.get("order_type") || "OnRamp";

  try {
    const catalogRes = await fetch(`${ELEMENTPAY_API}/partner/catalog?country=MW&order_type=${orderType}`, {
      headers: { "X-API-Key": API_KEY }
    });
    const catalogData = await catalogRes.json();
    
    let providers = [];
    if (orderType === "OnRamp") {
      providers = catalogData?.data?.onramp?.countries?.MW?.payment_methods?.mobile_money?.providers || [];
    } else {
      providers = catalogData?.data?.offramp?.countries?.MW?.payment_methods?.mobile_money?.providers || [];
    }

    // Also get indicative rate (the URL expects fiat)
    const rateRes = await fetch(`${ELEMENTPAY_API}/partner/rates/indicative?fiat=MWK`, {
      headers: { "X-API-Key": API_KEY }
    });
    const rateData = await rateRes.json();

    return NextResponse.json({ providers, rate: rateData?.data?.rates?.[0] || null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ElementPay info" }, { status: 500 });
  }
}
