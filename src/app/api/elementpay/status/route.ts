import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 });
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { chargeId: orderId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        status: transaction.status,
        reason: transaction.status === "failed" ? "Transaction failed" : undefined,
      }
    });
  } catch (error) {
    console.error("Order status fetch error", error);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
