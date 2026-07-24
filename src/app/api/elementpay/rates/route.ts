import { NextResponse } from "next/server";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
  }

  try {
    const [ratesRes, onRampCatRes, offRampCatRes] = await Promise.all([
      fetch(`${ELEMENTPAY_API}/partner/rates/indicative?fiat=MWK`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store"
      }),
      fetch(`${ELEMENTPAY_API}/partner/catalog?country=MW&order_type=OnRamp`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store"
      }),
      fetch(`${ELEMENTPAY_API}/partner/catalog?country=MW&order_type=OffRamp`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store"
      })
    ]);

    const ratesData = await ratesRes.json();
    const onRampCatData = await onRampCatRes.json();
    const offRampCatData = await offRampCatRes.json();

    const rateInfo = ratesData?.data?.rates?.[0] || {};
    
    // Safely extract minimum amounts from catalog providers, fallback to 5000 if not found
    const onRampProviders = onRampCatData?.data?.onramp?.countries?.MW?.payment_methods?.mobile_money?.providers || [];
    const onRampMin = onRampProviders.length > 0 ? onRampProviders[0].min_amount : 5000;

    const offRampProviders = offRampCatData?.data?.offramp?.countries?.MW?.payment_methods?.mobile_money?.providers || [];
    const offRampMin = offRampProviders.length > 0 ? offRampProviders[0].min_amount : 5000;

    return NextResponse.json({
      onRamp: {
        rate: `1 USD = ${rateInfo.buy || 4650} MWK`,
        minimumAmount: onRampMin,
        updatedAt: rateInfo.updatedAt || new Date().toISOString()
      },
      offRamp: {
        rate: `1 USD = ${rateInfo.sell || 3850} MWK`,
        minimumAmount: offRampMin,
        updatedAt: rateInfo.updatedAt || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Rates fetch error", error);
    return NextResponse.json({ error: "Failed to fetch ElementPay rates" }, { status: 500 });
  }
}
