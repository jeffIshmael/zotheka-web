import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export async function POST(req: Request) {
  try {
    const { 
      email, 
      phone, 
      amountMwk, 
      usdAmount,
      providerId, 
      targetEmail, 
      targetPassword, 
      service, 
      packageName 
    } = await req.json();

    if (!email || !phone || !amountMwk || !providerId || !targetEmail || !targetPassword || !service || !packageName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    if (!process.env.TREASURY_PRIVATE_KEY) {
      return NextResponse.json({ error: "Treasury Private Key not configured" }, { status: 500 });
    }

    // Derive treasury address
    let walletAddress = "";
    try {
      const pKey = process.env.TREASURY_PRIVATE_KEY.startsWith("0x") 
        ? process.env.TREASURY_PRIVATE_KEY 
        : `0x${process.env.TREASURY_PRIVATE_KEY}`;
      const account = privateKeyToAccount(pKey as `0x${string}`);
      walletAddress = account.address;
    } catch (e) {
      return NextResponse.json({ error: "Invalid Treasury Private Key" }, { status: 500 });
    }

    // Fetch user KYC from DB
    const userKyc = await prisma.userKyc.findUnique({
      where: { email },
    });

    if (!userKyc) {
      return NextResponse.json({ error: "User KYC not found" }, { status: 404 });
    }

    let dob = "01/01/1990";
    if (userKyc.dateOfBirth) {
      const parts = userKyc.dateOfBirth.split("-");
      if (parts.length === 3) {
        dob = `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }

    // 1. Fetch Catalog to get exact network_id
    const catalogRes = await fetch(`${ELEMENTPAY_API}/partner/catalog?country=MW&order_type=OnRamp`, {
      headers: { "X-API-Key": API_KEY }
    });
    const catalogData = await catalogRes.json();
    const providers = catalogData?.data?.onramp?.countries?.MW?.payment_methods?.mobile_money?.providers || [];
    const matchedProvider = providers.find((p: any) => 
      p.id === providerId || p.name?.toLowerCase().includes(providerId?.toLowerCase() || "")
    );
    const networkId = matchedProvider ? matchedProvider.id : providerId;

    // 2. Create a Quote
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
        local_amount: amountMwk,
        asset: {
          token: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
          currency: "USDC",
          network: "BASE",
        },
        customer: {
          uid: `user-${userKyc.id}`,
          type: "user",
          name: `${userKyc.firstName} ${userKyc.lastName}`,
          country: "MW",
          phone: userKyc.phoneNumber || phone,
          address: "Lilongwe",
          dob: dob,
          email: userKyc.email,
          id_number: userKyc.idNumber,
          id_type: userKyc.idType,
        },
        payment_method: {
          type: "mobile_money",
          phone_number: userKyc.phoneNumber || phone,
          network_id: networkId,
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

    // 3. Accept the Quote
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
    if (acceptData.status === "error") {
      console.error("Accept Error", acceptData);
      return NextResponse.json({ error: acceptData.message, details: acceptData.data }, { status: 400 });
    }

    const orderPayload = acceptData.data || {};
    orderPayload.order_id = orderPayload.order_id || orderPayload.id || quoteId;

    // Save ManualServiceOrder to DB
    await (prisma as any).manualServiceOrder.create({
      data: {
        userEmail: userKyc.email,
        targetEmail: targetEmail,
        targetPassword: targetPassword,
        service: service,
        package: packageName,
        amountPaidMwk: Number(amountMwk),
        usdAmount: Number(usdAmount),
        orderId: orderPayload.order_id,
        paymentStatus: "pending",
        status: "pending", // Fulfillment status
      },
    });

    return NextResponse.json({ success: true, order: orderPayload });
  } catch (error: any) {
    console.error("Manual Service Exception", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
