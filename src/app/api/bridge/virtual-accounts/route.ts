import { BridgeApiError, listBridgeVirtualAccounts } from "@/lib/bridge/server";
import { corsJson, corsOptions } from "@/lib/bridge/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  try {
    const customerId = new URL(request.url).searchParams.get("customer_id")?.trim();

    if (!customerId) {
      return corsJson({ status: "error", message: "customer_id is required" }, { status: 400 });
    }

    const result = await listBridgeVirtualAccounts(customerId);
    const virtualAccounts = Array.isArray(result) ? result : (result.data ?? []);

    return corsJson({ status: "success", virtual_accounts: virtualAccounts });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to list virtual accounts";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson({ status: "error", message }, { status });
  }
}
