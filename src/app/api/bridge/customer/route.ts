import { BridgeApiError, getOrCreateBridgeCustomer, isBridgeSandbox } from "@/lib/bridge/server";
import { corsJson, corsOptions } from "@/lib/bridge/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return corsJson({ status: "error", message: "email is required" }, { status: 400 });
    }

    const { customer, created } = await getOrCreateBridgeCustomer(email);

    return corsJson({
      status: "success",
      customer,
      created,
      sandbox: isBridgeSandbox(),
    });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to load Bridge customer";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson(
      {
        status: "error",
        message,
        details: error instanceof BridgeApiError ? error.details : undefined,
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return corsJson({ status: "error", message: "email is required" }, { status: 400 });
    }

    const { customer, created } = await getOrCreateBridgeCustomer(email);

    return corsJson({
      status: "success",
      customer,
      created,
      sandbox: isBridgeSandbox(),
      message: created
        ? "Bridge customer created."
        : "Bridge customer already exists for this email — loaded existing record.",
    });
  } catch (error) {
    const message =
      error instanceof BridgeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to create Bridge customer";
    const status = error instanceof BridgeApiError ? error.statusCode : 500;
    return corsJson(
      {
        status: "error",
        message,
        details: error instanceof BridgeApiError ? error.details : undefined,
      },
      { status }
    );
  }
}
