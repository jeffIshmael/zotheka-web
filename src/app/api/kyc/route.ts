import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      network,
      dateOfBirth,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      idType,
      idNumber,
      idImageFront,
      idImageBack,
      selfieImage,
      tosAccepted,
    } = data;

    if (!email || !firstName || !lastName || !dateOfBirth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const kyc = await prisma.userKyc.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phoneNumber,
        network,
        dateOfBirth,
        streetAddress,
        city,
        state,
        postalCode,
        country,
        idType,
        idNumber,
        idImageFront,
        idImageBack,
        selfieImage,
        tosAccepted
      },
      create: {
        email,
        firstName,
        lastName,
        phoneNumber,
        network,
        dateOfBirth,
        streetAddress,
        city,
        state,
        postalCode,
        country,
        idType,
        idNumber,
        idImageFront,
        idImageBack,
        selfieImage,
        tosAccepted
      }
    });

    // TODO: Later, call Bridge API to create customer here and save bridgeCustomerId

    return NextResponse.json({ success: true, kyc });
  } catch (error) {
    console.error("KYC submit error", error);
    return NextResponse.json({ error: "Failed to submit KYC" }, { status: 500 });
  }
}
