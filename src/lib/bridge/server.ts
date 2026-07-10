import { randomUUID } from "crypto";

const SANDBOX_BASE = "https://api.sandbox.bridge.xyz";
const PROD_BASE = "https://api.bridge.xyz";

export class BridgeApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "BridgeApiError";
  }
}

function bridgeBaseUrl(): string {
  const key = process.env.BRIDGE_API_KEY ?? "";
  if (process.env.BRIDGE_API_BASE_URL) {
    return process.env.BRIDGE_API_BASE_URL.replace(/\/$/, "");
  }
  return key.startsWith("sk-test") ? SANDBOX_BASE : PROD_BASE;
}

export function isBridgeSandbox(): boolean {
  return bridgeBaseUrl().includes("sandbox");
}

export function requireBridgeApiKey(): string {
  const key = process.env.BRIDGE_API_KEY?.trim();
  if (!key) {
    throw new BridgeApiError("BRIDGE_API_KEY is not configured on the server.", 500);
  }
  return key;
}

export async function bridgeRequest<T>(
  path: string,
  init?: RequestInit & { idempotencyKey?: string }
): Promise<T> {
  const apiKey = requireBridgeApiKey();
  const url = `${bridgeBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    ...(init?.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
  };

  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => null)) as
    | T
    | { message?: string; code?: string; errors?: unknown }
    | null;

  if (!response.ok) {
    throw new BridgeApiError(formatBridgeErrorMessage(data, response.status), response.status, data);
  }

  return data as T;
}

export function newIdempotencyKey(): string {
  return randomUUID();
}

type BridgeErrorBody = {
  message?: string;
  code?: string;
  source?: {
    location?: string;
    key?: Record<string, string> | string;
  };
};

function formatBridgeErrorMessage(data: unknown, status: number): string {
  if (!data || typeof data !== "object") {
    return `Bridge request failed (${status})`;
  }

  const body = data as BridgeErrorBody;
  const key = body.source?.key;

  if (key && typeof key === "object") {
    const detail = Object.entries(key)
      .map(([field, reason]) => `${field}: ${reason}`)
      .join("; ");
    if (detail) return detail;
  }

  if (typeof key === "string" && key.trim()) {
    return key;
  }

  if (body.message) {
    return body.message;
  }

  return `Bridge request failed (${status})`;
}

function isDuplicateCustomerError(error: unknown): boolean {
  if (!(error instanceof BridgeApiError) || error.statusCode !== 400) {
    return false;
  }

  const details = error.details as BridgeErrorBody | undefined;
  const key = details?.source?.key;
  if (key && typeof key === "object" && key.email) {
    return key.email.toLowerCase().includes("already exists");
  }

  return formatBridgeErrorMessage(details, 400).toLowerCase().includes("already exists");
}

export type BridgeAddress = {
  street_line_1?: string | null;
  city?: string | null;
  subdivision?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type BridgeCustomer = {
  id: string;
  email?: string;
  type?: "individual" | "business";
  kyc_status?: string;
  status?: string;
  residential_address?: BridgeAddress;
  physical_address?: BridgeAddress;
  registered_address?: BridgeAddress;
  endorsements?: Array<{
    name: string;
    status: string;
    additional_requirements?: string[];
  }>;
};

export type BridgeVirtualAccount = {
  id: string;
  status: string;
  customer_id: string;
  source_deposit_instructions?: {
    currency: string;
    bank_name?: string;
    bank_address?: string;
    bank_routing_number?: string;
    bank_account_number?: string;
    bank_beneficiary_name?: string;
    bank_beneficiary_address?: string;
    iban?: string;
    bic?: string;
    account_holder_name?: string;
    payment_rail?: string;
    payment_rails?: string[];
  };
  destination?: {
    currency: string;
    payment_rail: string;
    address?: string;
  };
};

export function buildSandboxAddress() {
  return {
    street_line_1: "Area 47",
    city: "Lilongwe",
    subdivision: "Lilongwe",
    postal_code: "000000",
    country: "MWI",
  };
}

export function buildSandboxCustomerPayload(email: string) {
  const local = email.split("@")[0] || "user";
  const nameParts = local.replace(/[._-]/g, " ").split(/\s+/).filter(Boolean);
  const firstName = (nameParts[0] ?? "Zotheka").slice(0, 32);
  const lastName = (nameParts[1] ?? "User").slice(0, 32);

  return {
    type: "individual" as const,
    first_name: firstName,
    last_name: lastName,
    email,
    residential_address: buildSandboxAddress(),
    birth_date: "1995-06-15",
    phone: "+265991234567",
    signed_agreement_id: newIdempotencyKey(),
    identifying_information: [
      {
        type: "national_id",
        issuing_country: "mwi",
        number: "MW000000000",
      },
    ],
  };
}

function isAddressComplete(address?: BridgeAddress | null): boolean {
  if (!address) return false;
  return Boolean(
    address.street_line_1?.trim() &&
      address.city?.trim() &&
      address.country?.trim()
  );
}

export function bridgeCustomerMissingAddress(customer: BridgeCustomer): boolean {
  if (customer.type === "business") {
    return (
      !isAddressComplete(customer.physical_address) ||
      !isAddressComplete(customer.registered_address)
    );
  }

  return !isAddressComplete(customer.residential_address);
}

export async function updateBridgeCustomer(
  customerId: string,
  payload: Record<string, unknown>
): Promise<BridgeCustomer> {
  return bridgeRequest<BridgeCustomer>(`/v0/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Backfill sandbox address data on legacy/incomplete Bridge customers. */
export async function ensureBridgeCustomerReady(customerId: string): Promise<BridgeCustomer> {
  const customer = await getBridgeCustomer(customerId);
  if (!bridgeCustomerMissingAddress(customer)) {
    return customer;
  }

  const address = buildSandboxAddress();

  if (customer.type === "business") {
    return updateBridgeCustomer(customerId, {
      type: "business",
      physical_address: address,
      registered_address: address,
    });
  }

  return updateBridgeCustomer(customerId, {
    type: "individual",
    residential_address: address,
  });
}

export async function findBridgeCustomerByEmail(email: string): Promise<BridgeCustomer | null> {
  const params = new URLSearchParams({ email: email.toLowerCase() });
  const result = await bridgeRequest<{ count?: number; data?: BridgeCustomer[] }>(
    `/v0/customers?${params}`
  );
  return result.data?.[0] ?? null;
}

export async function createBridgeCustomer(email: string): Promise<BridgeCustomer> {
  try {
    return await bridgeRequest<BridgeCustomer>("/v0/customers", {
      method: "POST",
      idempotencyKey: newIdempotencyKey(),
      body: JSON.stringify(buildSandboxCustomerPayload(email)),
    });
  } catch (error) {
    if (isDuplicateCustomerError(error)) {
      const existing = await findBridgeCustomerByEmail(email);
      if (existing) return ensureBridgeCustomerReady(existing.id);
    }
    throw error;
  }
}

/** Create if missing, otherwise return the existing Bridge customer for this email. */
export async function getOrCreateBridgeCustomer(email: string): Promise<{
  customer: BridgeCustomer;
  created: boolean;
}> {
  const existing = await findBridgeCustomerByEmail(email);
  if (existing) {
    const customer = await ensureBridgeCustomerReady(existing.id);
    return { customer, created: false };
  }

  const customer = await createBridgeCustomer(email);
  return { customer, created: true };
}

export async function getBridgeCustomer(customerId: string): Promise<BridgeCustomer> {
  return bridgeRequest<BridgeCustomer>(`/v0/customers/${customerId}`);
}

export async function simulateBridgeKycApproval(customerId: string): Promise<BridgeCustomer> {
  return bridgeRequest<BridgeCustomer>(`/v0/customers/${customerId}/simulate_kyc_approval`, {
    method: "POST",
    idempotencyKey: newIdempotencyKey(),
    body: JSON.stringify({}),
  });
}

export async function listBridgeVirtualAccounts(
  customerId: string
): Promise<{ data: BridgeVirtualAccount[] } | BridgeVirtualAccount[]> {
  return bridgeRequest(`/v0/customers/${customerId}/virtual_accounts`);
}

export async function createBridgeVirtualAccount(
  customerId: string,
  currency: "usd" | "eur",
  walletAddress: string
): Promise<BridgeVirtualAccount> {
  await ensureBridgeCustomerReady(customerId);
  const paymentRail = isBridgeSandbox() ? "ethereum" : "base";

  return bridgeRequest<BridgeVirtualAccount>(`/v0/customers/${customerId}/virtual_accounts`, {
    method: "POST",
    idempotencyKey: newIdempotencyKey(),
    body: JSON.stringify({
      source: { currency },
      destination: {
        payment_rail: paymentRail,
        currency: "usdc",
        address: walletAddress,
      },
      developer_fee_percent: "0.0",
    }),
  });
}

export async function resolveTreasuryWalletAddress(): Promise<string> {
  const flaskUrl = (
    process.env.NEXT_PUBLIC_API_URL ?? "https://blank-blank-pay.vercel.app"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${flaskUrl}/api/usdc/balance`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (response.ok) {
      const data = (await response.json()) as { address?: string };
      if (data.address) return data.address;
    }
  } catch {
    // Fall through to demo placeholder.
  }

  return "0x0000000000000000000000000000000000000001";
}
