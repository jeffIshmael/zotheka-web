import { NextResponse } from "next/server";

const ELEMENTPAY_API = "https://sandbox.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_SANDBOX_API;
const WALLET_ADDRESS = "0x4821ced48Fb4456055c86E42587f61c1F39c6315";

export async function POST(req: Request) {
  try {
    const { phone, amount, providerId } = await req.json();

    if (!phone || !amount || !providerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    // 1. Create a Quote
    const quoteRes = await fetch(`${ELEMENTPAY_API}/partner/orders/quote`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_type: "OnRamp",
        currency: "MWK",
        country: "MW",
        local_amount: amount,
        asset: {
          token: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
          currency: "USDC",
          network: "BASE",
        },
        customer: {
          uid: `user-${Date.now()}`,
          type: "user",
          name: "Sandbox User",
          country: "MW",
          phone: phone,
          address: "Lilongwe",
          dob: "01/01/1990",
          email: "sandbox@zotheka.com",
          id_number: "12345678",
          id_type: "national_id",
        },
        payment_method: {
          type: "mobile_money",
          phone_number: phone,
          network_id: providerId,
        },
        wallet_address: WALLET_ADDRESS,
      }),
    });

    const quoteData = await quoteRes.json();
    if (quoteData.status === "error") {
      console.error("Quote Error", quoteData);
      return NextResponse.json({ error: quoteData.message, details: quoteData.data }, { status: 400 });
    }

    const quoteId = quoteData.data.quote_id;
    const rate = quoteData.data.exchange_rate;

    // 2. Accept the Quote
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const acceptRes = await fetch(`${ELEMENTPAY_API}/partner/orders/${quoteId}/accept`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const acceptData = await acceptRes.json();
    console.log("Accept Response:", JSON.stringify(acceptData));
    
    if (acceptData.status === "error") {
      console.error("Accept Error", acceptData);
      return NextResponse.json({ error: acceptData.message, details: acceptData.data }, { status: 400 });
    }

    const orderPayload = acceptData.data || {};
    orderPayload.order_id = orderPayload.order_id || orderPayload.id || quoteId;

    return NextResponse.json({ success: true, order: orderPayload, rate: rate });
  } catch (error: any) {
    console.error("ElementPay Exception", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
