import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClients } from "@/lib/cdp-paymaster";
import { erc20Abi } from "viem";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

function isAdmin(email: string) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  return adminEmails.split(",").map(e => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicClient, account } = getClients();

    // 1. Get Treasury USDC Balance
    const balanceRaw = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });
    const balanceUsdc = Number(balanceRaw) / 1e6;

    // 2. Get Admin KYC
    const kyc = await prisma.userKyc.findUnique({ where: { email } });

    // 3. Get ElementPay Indicative Rate and Min Amount
    let indicativeRate = 130; // fallback
    let minAmount = 150; // fallback

    if (API_KEY) {
      try {
        const rateRes = await fetch(`${ELEMENTPAY_API}/partner/rates/indicative?pair=USDC_KES&direction=OffRamp`, {
          headers: { "X-API-Key": API_KEY }
        });
        const rateData = await rateRes.json();
        if (rateData?.data?.rate) {
          indicativeRate = rateData.data.rate;
        }

        const catalogRes = await fetch(`${ELEMENTPAY_API}/partner/catalog?country=KE&order_type=OffRamp`, {
          headers: { "X-API-Key": API_KEY }
        });
        const catalogData = await catalogRes.json();
        if (catalogData?.data?.offramp?.countries?.KE?.payment_methods?.mobile_money?.providers) {
           const mpesa = catalogData.data.offramp.countries.KE.payment_methods.mobile_money.providers.find((p: any) => p.name.includes("M-PESA"));
           if (mpesa && mpesa.min_amount) {
              minAmount = mpesa.min_amount;
           }
        }
      } catch (e) {
        console.error("Failed to fetch rate or catalog", e);
      }
    }

    return NextResponse.json({
      balanceUsdc,
      indicativeRate,
      minAmount,
      phone: kyc?.phoneNumber || "",
      network: kyc?.network || "7ea6df5c-6bba-46b2-a7e6-f511959e7edb",
      kycVerified: !!kyc
    });
  } catch (error: any) {
    console.error("Admin Payout GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amountUsdc, phone, providerId } = body;

    if (!email || !isAdmin(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    const kyc = await prisma.userKyc.findUnique({ where: { email } });
    if (!kyc) {
      return NextResponse.json({ error: "Admin KYC not found" }, { status: 404 });
    }

    // Format DOB
    let dob = "01/01/1990";
    if (kyc.dateOfBirth) {
      const parts = kyc.dateOfBirth.split("-");
      if (parts.length === 3) {
        dob = `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }

    // 1. Create ElementPay Quote
    const quotePayload = {
      order_type: "OffRamp",
      customer: {
        uid: `admin-${kyc.id}`,
        name: `${kyc.firstName} ${kyc.lastName}`,
        email: kyc.email,
        phone: phone,
        dob: dob,
        address: "Nairobi",
        country: "KE",       
        id_number: kyc.idNumber,
        id_type: kyc.idType  
      },
      payment_method: {
        type: "mobile_money",
        phone_number: phone,
        network_id: providerId
      },
      asset: {
        currency: "USDC",
        network: "BASE",
        token: USDC_ADDRESS
      },
      crypto_amount: Number(amountUsdc),
      country: "KE",
      currency: "KES", 
      refund_address: getClients().account.address, 
    };

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
      return NextResponse.json({ error: quoteData.message || "Failed to create quote" }, { status: 400 });
    }
    const quoteId = quoteData.data.quote_id;

    // 2. Accept Quote
    const acceptRes = await fetch(`${ELEMENTPAY_API}/partner/orders/${quoteId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    });
    const acceptData = await acceptRes.json();
    if (!acceptRes.ok) {
      return NextResponse.json({ error: acceptData.message || "Failed to accept quote" }, { status: 400 });
    }

    const orderPayload = acceptData.data || {};
    const depositAddress = orderPayload.deposit_address || orderPayload.address;
    if (!depositAddress) {
      return NextResponse.json({ error: "No deposit address returned from ElementPay" }, { status: 500 });
    }

    // 3. EIP-7702 Transaction with viem
    const { publicClient, walletClient, account } = getClients();
    const amountToTransfer = BigInt(Math.floor(Number(amountUsdc) * 1e6)); 

    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "transfer",
      args: [depositAddress as `0x${string}`, amountToTransfer],
      account,
      chain: walletClient.chain
    });

    // 4. Save to Database
    await prisma.transaction.create({
      data: {
        email: email,
        type: "WITHDRAWAL",
        amount: Number(amountUsdc) * (quoteData.data.rate || 130),
        usdAmount: Number(amountUsdc),
        status: "pending",
        productName: "Admin Treasury Payout",
        chargeId: orderPayload.order?.order_id || orderPayload.order_id || quoteId,
        network: "BASE",
        phone: phone || kyc.phoneNumber
      }
    });

    return NextResponse.json({
      status: "success",
      order: orderPayload,
      txHash: hash
    });

  } catch (error: any) {
    console.error("Admin Payout POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
