import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, walletAddress } = data;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const kyc = await prisma.userKyc.upsert({
      where: { email },
      update: {
        ...(walletAddress ? { smartWalletAddress: walletAddress } : {})
      },
      create: {
        email,
        // @ts-ignore
        smartWalletAddress: walletAddress || null,
      }
    });

    return NextResponse.json({ success: true, kyc });
  } catch (error) {
    console.error("User sync error", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
