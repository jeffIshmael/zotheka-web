import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { eip7702Actions } from "viem/experimental";
import crypto from "crypto";

export function getTreasuryAccount() {
  const secret = process.env.WALLET_SECRET;
  if (!secret) {
    throw new Error("WALLET_SECRET is not set");
  }

  // Parse the base64 encoded PEM secret to extract the private key
  const pem = `-----BEGIN EC PRIVATE KEY-----\n${secret}\n-----END EC PRIVATE KEY-----`;
  try {
    const privateKey = crypto.createPrivateKey({
      key: pem,
      format: "pem",
    });

    const jwk = privateKey.export({ format: "jwk" });
    const hex = "0x" + Buffer.from(jwk.d!, "base64url").toString("hex");
    return privateKeyToAccount(hex as `0x${string}`);
  } catch (e) {
    console.error("Failed to parse WALLET_SECRET", e);
    // Fallback to TREASURY_PRIVATE_KEY if WALLET_SECRET fails
    if (process.env.TREASURY_PRIVATE_KEY) {
       return privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);
    }
    throw new Error("Invalid WALLET_SECRET format and no fallback TREASURY_PRIVATE_KEY");
  }
}

export function getClients() {
  const account = getTreasuryAccount();
  const paymasterUrl = process.env.PAYMASTER_URL;
  if (!paymasterUrl) {
    throw new Error("PAYMASTER_URL is not set");
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  // A standard wallet client for the EOA
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  return { account, publicClient, walletClient, paymasterUrl };
}
