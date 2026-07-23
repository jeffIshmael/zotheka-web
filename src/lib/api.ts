import { API_BASE_URL } from "./config";

export type ApiError = {
  status: "error";
  message: string;
};

export type MonitorStatus = {
  mwk: number;
  usdc: number;
  usd_to_mwk_rate: number;
  alerts: string[];
  healthy: boolean;
};

export type BuyResponse =
  | {
      status: "success";
      code: string;
      amount: number;
      currency: string;
      charge_id: string;
    }
  | ApiError;

export type ConvertResponse =
  | {
      status: "success";
      usd_amount: number;
      mwk_amount: number;
      charge_id: string;
      rate: number;
      usd_balance?: number;
    }
  | ApiError;

export type DepositInstructions = {
  mode: string;
  bank_name: string;
  bank_beneficiary_name: string;
  bank_address: string;
  bank_routing_number: string;
  bank_account_number: string;
  payment_rails: string[];
  currency: string;
  instructions: string;
};

export type UserProfile = {
  email: string;
  usd_balance: number;
  deposit_instructions: DepositInstructions;
};

export type SimulateDepositResponse =
  | {
      status: "success";
      usd_balance: number;
      amount: number;
      source: string;
      charge_id: string;
    }
  | ApiError;

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  usdAmount?: number;
  status: string;
  chargeId?: string;
  charge_id?: string;
  productName?: string;
  code?: string;
  network?: string;
  phone?: string;
  email: string;
  createdAt: string;
  created_at?: string;
};

export class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as T | ApiError | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : `Request failed (${response.status})`;
    throw new BackendRequestError(message, response.status);
  }

  return data as T;
}

export function makeChargeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getMonitor() {
  return request<MonitorStatus>("/monitor");
}

export async function getTransactions(email: string, type?: string) {
  const params = new URLSearchParams({ email });
  if (type) params.append("type", type);
  const response = await fetch(`/api/transactions?${params}`);
  if (!response.ok) throw new Error("Failed to get transactions");
  return response.json() as Promise<{ transactions: Transaction[] }>;
}

export async function saveTransaction(input: {
  email: string;
  type: string;
  amount: number;
  usdAmount?: number;
  status: string;
  productName?: string;
  code?: string;
  chargeId?: string;
  network?: string;
  phone?: string;
}) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Failed to save transaction");
  return response.json() as Promise<{ transaction: Transaction }>;
}

export function getUserProfile(email: string) {
  const params = new URLSearchParams({ email });
  return request<UserProfile>(`/api/users/me?${params}`);
}

export function simulateDeposit(input: {
  email: string;
  amount: number;
  source?: string;
}) {
  return request<SimulateDepositResponse>("/api/mock/simulate-deposit", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function buyGiftCard(input: {
  phone: string;
  amount: number;
  charge_id: string;
  email: string;
  name: string;
}) {
  return request<BuyResponse>("/api/buy", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function convertToMwk(input: {
  usd_amount: number;
  phone: string;
  charge_id: string;
  email: string;
  tx_hash?: string;
}) {
  return request<ConvertResponse>("/api/convert", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
