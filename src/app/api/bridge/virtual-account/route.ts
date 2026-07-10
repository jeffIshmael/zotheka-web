import {
  BridgeApiError,
  createBridgeVirtualAccount,
  resolveTreasuryWalletAddress,
} from "@/lib/bridge/server";
import { corsJson, corsOptions } from "@/lib/bridge/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customer_id?: string;
      currency?: string;
      wallet_address?: string;
    };

    const customerId = body.customer_id?.trim();
    const currency = body.currency?.toLowerCase();

    if (!customerId) {
      return corsJson({ status: "error", message: "customer_id is required" }, { status: 400 });
    }

    if (currency !== "usd" && currency !== "eur") {
      return corsJson(
        { status: "error", message: "currency must be usd or eur" },
        { status: 400 }
      );
    }

    const walletAddress =
      body.wallet_address?.trim() || (await resolveTreasuryWalletAddress());

    const virtualAccount = await createBridgeVirtualAccount(
      customerId,
      currency,
      walletAddress
    );

    return corsJson({
      status: "success",
      virtual_account: virtualAccount,
      wallet_address: walletAddress,
    });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to create virtual account";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson({ status: "error", message }, { status });
  }
}
