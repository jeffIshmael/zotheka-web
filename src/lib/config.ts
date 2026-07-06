export const DEFAULT_USD_TO_MWK_RATE = 1700;

export function resolveUsdToMwkRate(rate?: number | null): number {
  return typeof rate === "number" && rate > 0 ? rate : DEFAULT_USD_TO_MWK_RATE;
}

export function usdToMwk(usd: number, rate?: number | null): number {
  return Math.round(usd * resolveUsdToMwkRate(rate));
}

/** Browser calls same-origin `/backend/*`; Next.js rewrites to NEXT_PUBLIC_API_URL. */
export const API_BASE_URL = "/backend";

export const DEMO_BYPASS_ONCHAIN =
  process.env.NEXT_PUBLIC_DEMO_BYPASS_ONCHAIN !== "false";
