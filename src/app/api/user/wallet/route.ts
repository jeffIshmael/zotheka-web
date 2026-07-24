import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, walletAddress } = await req.json();

    if (!email || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedUser = await prisma.userKyc.update({
      where: { email },
      data: { smartWalletAddress: walletAddress },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Save wallet error", err);
    return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 });
  }
}
