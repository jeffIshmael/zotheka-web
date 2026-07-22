import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export async function POST(req: Request) {
  try {
    const { phone, amount, providerId, walletAddress, email } = await req.json();

    if (!phone || !amount || !providerId || !walletAddress || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    // Fetch user KYC from DB
    const userKyc = await prisma.userKyc.findUnique({
      where: { email },
    });

    if (!userKyc) {
      return NextResponse.json({ error: "User KYC not found" }, { status: 404 });
    }

    // Format DOB from "YYYY-MM-DD" to "MM/DD/YYYY"
    let dob = "01/01/1990";
    if (userKyc.dateOfBirth) {
      const parts = userKyc.dateOfBirth.split("-");
      if (parts.length === 3) {
        dob = `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }

    console.log(dob);

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
        local_amount: Number(amount),
        asset: {
          token: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
          currency: "USDC",
          network: "BASE",
        },
        customer: {
          uid: `user-${userKyc.id}`,
          type: "user",
          name: `${userKyc.firstName} ${userKyc.lastName}`,
          country: "MW", // Or map from userKyc.country if ElementPay uses ISO codes
          phone: userKyc.phoneNumber || phone,
          address: userKyc.city,
          dob: dob,
          email: userKyc.email,
          id_number: userKyc.idNumber,
          id_type: userKyc.idType,
        },
        payment_method: {
          type: "mobile_money",
          phone_number: userKyc.phoneNumber || phone,
          network_id: providerId,
        },
        wallet_address: walletAddress,
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
