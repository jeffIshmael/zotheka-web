import { BridgeApiError, getBridgeCustomer } from "@/lib/bridge/server";
import { corsJson, corsOptions } from "@/lib/bridge/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;
    const customer = await getBridgeCustomer(customerId);

    return corsJson({ status: "success", customer });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to fetch Bridge customer";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson({ status: "error", message }, { status });
  }
}
