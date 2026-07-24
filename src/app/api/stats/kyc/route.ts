import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalUsers = await prisma.userKyc.count();
    const verifiedUsers = await prisma.userKyc.count({
      where: {
        // @ts-ignore
        firstName: { not: null },
      }
    });

    const unverifiedUsers = totalUsers - verifiedUsers;
    const verifiedPercentage = totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : "0.0";
    const unverifiedPercentage = totalUsers > 0 ? ((unverifiedUsers / totalUsers) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      verifiedPercentage,
      unverifiedPercentage
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
