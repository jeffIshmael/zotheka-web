import { NextResponse } from "next/server";

const ELEMENTPAY_API = "https://sandbox.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_SANDBOX_API;

export async function POST(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { amount, phone, providerId, email } = body;

    if (!amount || !phone || !providerId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SIMULATED: In a real app, verify user's balance in the DB.
    // For MVP sandbox, we will just simulate a deduction.
    // Fee Calculation: 2%
    const withdrawalAmount = Number(amount);
    const platformFee = withdrawalAmount * 0.02;
    const netAmount = withdrawalAmount - platformFee;

    // Build the OffRamp quote payload using ElementPay sandbox testing details.
    const quotePayload = {
      order_type: "OffRamp",
      customer: {
        uid: email,
        name: "Sandbox User",
        email: email,
        phone_number: phone,
        dob: "01/01/1990",
        address: "123 Main St, Lilongwe",
        country: "MW",
        id_type: "national_id",
        id_number: "MW12345678"
      },
      payment_method: {
        type: "mobile_money",
        phone_number: phone,
        network_id: providerId
      },
      asset: {
        currency: "USDC",
        network: "base",
        token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      },
      crypto_amount: netAmount,
      country: "MW",
      currency: "MWK",
      refund_address: "0x4821ced48Fb4456055c86E42587f61c1F39c6315",
      network_id: providerId
    };

    // 1. Create Quote
    const quoteRes = await fetch(`${ELEMENTPAY_API}/partner/orders/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(quotePayload),
    });

    const quoteData = await quoteRes.json();
    if (!quoteRes.ok) {
      console.error("Quote Error", quoteData);
      return NextResponse.json({ error: quoteData.message || "Failed to create quote" }, { status: 400 });
    }

    const quoteId = quoteData.data.quote_id;

    // 2. Accept Quote Immediately
    const acceptRes = await fetch(`${ELEMENTPAY_API}/partner/orders/${quoteId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
    });

    const acceptData = await acceptRes.json();
    console.log("Accept Response (Withdraw):", JSON.stringify(acceptData));
    
    if (!acceptRes.ok) {
      console.error("Accept Error", acceptData);
      return NextResponse.json({ error: acceptData.message || "Failed to accept quote" }, { status: 400 });
    }

    const orderPayload = acceptData.data || {};
    orderPayload.order_id = orderPayload.order_id || orderPayload.id || quoteId;

    // 3. Return success with the order details
    // The UI can now display that the withdrawal is processing.
    return NextResponse.json({
      status: "success",
      order: orderPayload,
      fees_deducted: platformFee
    });

  } catch (error) {
    console.error("Withdraw Error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
