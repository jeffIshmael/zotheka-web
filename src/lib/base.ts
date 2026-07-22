export async function getUsdcBalance(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0;
  
  const USDC_CONTRACT = "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913";
  const BASE_RPC = "https://mainnet.base.org";
  
  // keccak256("balanceOf(address)") = 0x70a08231
  const cleanAddress = walletAddress.startsWith("0x") ? walletAddress.slice(2) : walletAddress;
  const paddedAddress = cleanAddress.padStart(64, "0");
  const data = `0x70a08231${paddedAddress}`;

  try {
    const res = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: USDC_CONTRACT,
            data: data
          },
          "latest"
        ]
      })
    });
    
    const json = await res.json();
    if (json.error) {
      console.error("RPC error:", json.error);
      return 0;
    }
    
    const hexBalance = json.result; 
    if (!hexBalance || hexBalance === "0x") return 0;
    
    const balanceUnits = BigInt(hexBalance);
    // USDC has 6 decimals
    return Number(balanceUnits) / 1_000_000;
  } catch (err) {
    console.error("Failed to fetch USDC balance", err);
    return 0;
  }
}
