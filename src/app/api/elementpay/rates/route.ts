import { NextResponse } from "next/server";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
  }

  try {
    const [mwkRes, kesRes] = await Promise.all([
      fetch(`${ELEMENTPAY_API}/partner/rates/indicative?fiat=MWK`, {
        headers: { "X-API-Key": API_KEY }
      }),
      fetch(`${ELEMENTPAY_API}/partner/rates/indicative?fiat=KES`, {
        headers: { "X-API-Key": API_KEY }
      })
    ]);

    const mwkData = await mwkRes.json();
    const kesData = await kesRes.json();

    return NextResponse.json({
      success: true,
      malawi: mwkData?.data?.rates || [],
      kenya: kesData?.data?.rates || []
    });
  } catch (error) {
    console.error("Rates fetch error", error);
    return NextResponse.json({ error: "Failed to fetch ElementPay rates" }, { status: 500 });
  }
}
