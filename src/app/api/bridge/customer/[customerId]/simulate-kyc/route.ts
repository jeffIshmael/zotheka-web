import { BridgeApiError, getBridgeCustomer, simulateBridgeKycApproval } from "@/lib/bridge/server";
import { corsJson, corsOptions } from "@/lib/bridge/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;
    await simulateBridgeKycApproval(customerId);
    const customer = await getBridgeCustomer(customerId);

    return corsJson({
      status: "success",
      customer,
      message: "KYC simulated as approved (sandbox demo).",
    });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to simulate KYC approval";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson({ status: "error", message }, { status });
  }
}
