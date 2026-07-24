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

    if (transaction) {
      return NextResponse.json({
        data: {
          status: transaction.status,
          reason: transaction.status === "failed" ? "Transaction failed" : undefined,
        }
      });
    }

    const manualOrder = await (prisma as any).manualServiceOrder.findUnique({
      where: { orderId: orderId },
    });

    if (manualOrder) {
      return NextResponse.json({
        data: {
          status: manualOrder.paymentStatus === "paid" ? "completed" : manualOrder.paymentStatus,
          reason: manualOrder.paymentStatus === "failed" ? "Transaction failed" : undefined,
        }
      });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Order status fetch error", error);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
