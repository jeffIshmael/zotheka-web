import type {
  BridgeCustomer,
  BridgeUserState,
  BridgeVirtualAccount,
} from "./types";
import { BridgeRequestError } from "./types";

function bridgeApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_ZOTHEKA_WEB_URL?.replace(/\/$/, "") ?? "";
}

async function bridgeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = bridgeApiBase();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as
    | ({ status: "error"; message?: string } & T)
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : `Bridge request failed (${response.status})`;
    throw new BridgeRequestError(message, response.status);
  }

  return data as T;
}

export function createBridgeCustomer(email: string) {
  return bridgeRequest<{
    status: "success";
    customer: BridgeCustomer;
    sandbox: boolean;
    created: boolean;
    message?: string;
  }>("/api/bridge/customer", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function loadBridgeCustomerByEmail(email: string) {
  const params = new URLSearchParams({ email });
  return bridgeRequest<{
    status: "success";
    customer: BridgeCustomer;
    sandbox: boolean;
    created: boolean;
  }>(`/api/bridge/customer?${params}`);
}

export function getBridgeCustomer(customerId: string) {
  return bridgeRequest<{ status: "success"; customer: BridgeCustomer }>(
    `/api/bridge/customer/${customerId}`
  );
}

export function simulateBridgeKyc(customerId: string) {
  return bridgeRequest<{ status: "success"; customer: BridgeCustomer; message: string }>(
    `/api/bridge/customer/${customerId}/simulate-kyc`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export function createBridgeVirtualAccount(input: {
  customer_id: string;
  currency: "usd" | "eur";
  wallet_address?: string;
}) {
  return bridgeRequest<{
    status: "success";
    virtual_account: BridgeVirtualAccount;
    wallet_address: string;
  }>("/api/bridge/virtual-account", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listBridgeVirtualAccounts(customerId: string) {
  const params = new URLSearchParams({ customer_id: customerId });
  return bridgeRequest<{ status: "success"; virtual_accounts: BridgeVirtualAccount[] }>(
    `/api/bridge/virtual-accounts?${params}`
  );
}

export function simulateBridgeDeposit(input: {
  email: string;
  amount: number;
  currency: "usd" | "eur";
  source?: string;
  customer_id?: string;
  virtual_account_id?: string;
}) {
  return bridgeRequest<{
    status: "success";
    message: string;
    fiat_amount: number;
    fiat_currency: string;
    usd_credited: number;
    usd_balance?: number;
    demo: boolean;
  }>("/api/bridge/simulate-deposit", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function isKycApproved(customer?: BridgeCustomer | null): boolean {
  if (!customer) return false;
  if (customer.kyc_status === "approved") return true;
  return customer.endorsements?.some((e) => e.name === "base" && e.status === "approved") ?? false;
}

export function mergeVirtualAccount(
  state: BridgeUserState,
  account: BridgeVirtualAccount
): BridgeUserState {
  const currency = account.source_deposit_instructions?.currency?.toLowerCase();
  const next = { ...state, virtualAccounts: { ...state.virtualAccounts } };

  if (currency === "usd") next.virtualAccounts.usd = account;
  if (currency === "eur") next.virtualAccounts.eur = account;

  return next;
}

export { BridgeRequestError };
