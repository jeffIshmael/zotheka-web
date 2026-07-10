import { corsJson, corsOptions } from "@/lib/bridge/cors";

const EUR_TO_USD_DEMO = 1.08;

export function OPTIONS() {
  return corsOptions();
}

/**
 * Demo deposit: credits the Flask ledger (via existing mock endpoint).
 * Bridge sandbox has no fiat deposit webhooks — we simulate the credit locally.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      amount?: number;
      currency?: string;
      source?: string;
      customer_id?: string;
      virtual_account_id?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const amount = Number(body.amount);
    const currency = (body.currency ?? "usd").toLowerCase();
    const source = body.source ?? "bridge-sandbox";

    if (!email || !amount || amount <= 0) {
      return corsJson(
        { status: "error", message: "email and a positive amount are required" },
        { status: 400 }
      );
    }

    const usdCredit = currency === "eur" ? amount * EUR_TO_USD_DEMO : amount;

    const flaskUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "https://blank-blank-pay.vercel.app"
    ).replace(/\/$/, "");

    const flaskResponse = await fetch(`${flaskUrl}/api/mock/simulate-deposit`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(usdCredit * 100) / 100,
        source: `${source}-${currency}`,
      }),
    });

    const flaskData = (await flaskResponse.json().catch(() => null)) as
      | {
          status?: string;
          usd_balance?: number;
          amount?: number;
          message?: string;
        }
      | null;

    if (!flaskResponse.ok || flaskData?.status !== "success") {
      const message = flaskData?.message ?? `Ledger credit failed (${flaskResponse.status})`;
      return corsJson({ status: "error", message }, { status: 502 });
    }

    return corsJson({
      status: "success",
      message:
        currency === "eur"
          ? `Simulated €${amount.toFixed(2)} SEPA deposit → $${usdCredit.toFixed(2)} credited.`
          : `Simulated $${amount.toFixed(2)} deposit credited.`,
      fiat_amount: amount,
      fiat_currency: currency,
      usd_credited: usdCredit,
      usd_balance: flaskData.usd_balance,
      customer_id: body.customer_id,
      virtual_account_id: body.virtual_account_id,
      demo: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulate deposit failed";
    return corsJson({ status: "error", message }, { status: 500 });
  }
}
