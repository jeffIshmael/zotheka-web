import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const type = searchParams.get("type"); // optional filter

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const where: any = { email };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    let allOrders: any[] = [...transactions];

    // If fetching purchases or all, include manual service orders
    if (!type || type === "PURCHASE") {
      // @ts-ignore - Prisma type issue until restart
      const manualOrders = await (prisma as any).manualServiceOrder.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: "desc" },
      });

      // Map manual orders to transaction shape
      const mappedManual = manualOrders.map((m: any) => ({
        id: m.id,
        email: m.userEmail,
        type: "PURCHASE",
        amount: m.amountPaidMwk,
        usdAmount: m.usdAmount,
        status: m.status,
        productName: `Spotify - ${m.package}`,
        code: m.status === "approved" ? "MANUAL_UPGRADE_COMPLETE" : "PENDING_CONCIERGE",
        chargeId: m.txHash,
        network: "concierge",
        phone: null,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));

      allOrders = [...allOrders, ...mappedManual].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json({ transactions: allOrders });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      type,
      amount,
      usdAmount,
      status,
      productName,
      code,
      chargeId,
      network,
      phone,
    } = body;

    if (!email || !type || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        email,
        type,
        amount,
        usdAmount,
        status,
        productName,
        code,
        chargeId,
        network,
        phone,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
