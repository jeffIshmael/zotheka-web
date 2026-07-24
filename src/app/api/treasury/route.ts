import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { getUsdcBalance } from "@/lib/base";

export const dynamic = "force-dynamic";

export async function GET() {
  const pk = process.env.TREASURY_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json({ error: "Missing TREASURY_PRIVATE_KEY" }, { status: 500 });
  }

  try {
    const formattedPk = pk.startsWith("0x") ? pk : `0x${pk}`;
    const account = privateKeyToAccount(formattedPk as `0x${string}`);
    const address = account.address;
    
    const balanceUsdc = await getUsdcBalance(address);

    return NextResponse.json({
      address,
      balanceUsdc,
      network: "Base (mainnet)"
    });
  } catch (error: any) {
    console.error("Treasury API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch treasury details" }, { status: 500 });
  }
}
