import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  try {
    const kyc = await prisma.userKyc.findUnique({
      where: { email },
    });
    return NextResponse.json({ 
      verified: !!kyc,
      phone: kyc?.phoneNumber || null,
      network: kyc?.network || null
    });
  } catch (err) {
    console.error("KYC status error", err);
    return NextResponse.json({ verified: false });
  }
}
