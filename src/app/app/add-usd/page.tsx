"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  createBridgeCustomer,
  createBridgeVirtualAccount,
  getBridgeCustomer,
  isKycApproved,
  loadBridgeCustomerByEmail,
  mergeVirtualAccount,
  simulateBridgeDeposit,
  simulateBridgeKyc,
  BridgeRequestError,
} from "@/lib/bridge/api";
import { loadBridgeState, saveBridgeState } from "@/lib/bridge/store";
import type { BridgeDepositInstructions, BridgeUserState } from "@/lib/bridge/types";
import { BackendRequestError, getUserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type FiatTab = "usd" | "eur";

const USD_SIM_SOURCES = [
  { id: "fiverr", label: "Fiverr payout (ACH)", amount: 100 },
  { id: "paypal", label: "PayPal transfer", amount: 250 },
  { id: "upwork", label: "Upwork payment", amount: 500 },
] as const;

const EUR_SIM_SOURCES = [
  { id: "yoursafe-sepa", label: "Yoursafe SEPA transfer", amount: 30 },
  { id: "fiverr-eur", label: "Fiverr EUR payout", amount: 100 },
  { id: "client-sepa", label: "EU client SEPA", amount: 250 },
] as const;

export default function AddUsdPage() {
  const router = useRouter();
  const { email } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usdBalance, setUsdBalance] = useState(0);
  const [bridgeState, setBridgeState] = useState<BridgeUserState | null>(null);
  const [kycApproved, setKycApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<FiatTab>("usd");
  const [customAmount, setCustomAmount] = useState("");

  const refreshBalance = useCallback(async () => {
    if (!email) return;
    try {
      const profile = await getUserProfile(email);
      setUsdBalance(profile.usd_balance);
    } catch {
      setError("Could not load USD balance.");
    }
  }, [email]);

  const refreshBridge = useCallback(async () => {
    if (!email) return;
    const stored = loadBridgeState(email);
    if (stored) {
      setBridgeState(stored);
      try {
        const result = await getBridgeCustomer(stored.customerId);
        const approved = isKycApproved(result.customer);
        setKycApproved(approved);
        const next = {
          ...stored,
          kycStatus: result.customer.kyc_status,
        };
        setBridgeState(next);
        saveBridgeState(next);
      } catch {
        setKycApproved(isKycApproved({ kyc_status: stored.kycStatus } as never));
      }
      return;
    }

    try {
      const result = await loadBridgeCustomerByEmail(email);
      const next: BridgeUserState = {
        email,
        customerId: result.customer.id,
        kycStatus: result.customer.kyc_status,
        virtualAccounts: {},
      };
      setBridgeState(next);
      saveBridgeState(next);
      setKycApproved(isKycApproved(result.customer));
    } catch {
      setBridgeState(null);
      setKycApproved(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    void Promise.all([refreshBalance(), refreshBridge()]).finally(() => setLoading(false));
  }, [email, refreshBalance, refreshBridge]);

  const handleCreateCustomer = async () => {
    if (!email) return;
    setBusy("create-customer");
    setError(null);
    try {
      const result = await createBridgeCustomer(email);
      const next: BridgeUserState = {
        email,
        customerId: result.customer.id,
        kycStatus: result.customer.kyc_status,
        virtualAccounts: {},
      };
      setBridgeState(next);
      saveBridgeState(next);
      setKycApproved(isKycApproved(result.customer));
    } catch (err) {
      setError(err instanceof BridgeRequestError ? err.message : "Could not create Bridge customer.");
    } finally {
      setBusy(null);
    }
  };

  const handleSimulateKyc = async () => {
    if (!bridgeState) return;
    setBusy("simulate-kyc");
    setError(null);
    try {
      const result = await simulateBridgeKyc(bridgeState.customerId);
      const next = {
        ...bridgeState,
        kycStatus: result.customer.kyc_status ?? "approved",
      };
      setBridgeState(next);
      saveBridgeState(next);
      setKycApproved(true);
    } catch (err) {
      setError(err instanceof BridgeRequestError ? err.message : "KYC simulation failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreateVirtualAccount = async (currency: FiatTab) => {
    if (!bridgeState) return;
    setBusy(`create-va-${currency}`);
    setError(null);
    try {
      const result = await createBridgeVirtualAccount({
        customer_id: bridgeState.customerId,
        currency,
        wallet_address: bridgeState.walletAddress,
      });
      const next = mergeVirtualAccount(
        { ...bridgeState, walletAddress: result.wallet_address },
        result.virtual_account
      );
      setBridgeState(next);
      saveBridgeState(next);
    } catch (err) {
      setError(
        err instanceof BridgeRequestError ? err.message : `Could not create ${currency.toUpperCase()} account.`
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSimulateDeposit = async (amount: number, source: string, currency: FiatTab) => {
    if (!email || !bridgeState) return;
    setBusy(`deposit-${source}`);
    setError(null);
    try {
      const va = currency === "usd" ? bridgeState.virtualAccounts.usd : bridgeState.virtualAccounts.eur;
      const result = await simulateBridgeDeposit({
        email,
        amount,
        currency,
        source,
        customer_id: bridgeState.customerId,
        virtual_account_id: va?.id,
      });
      if (result.usd_balance != null) {
        setUsdBalance(result.usd_balance);
      } else {
        await refreshBalance();
      }
      alert(result.message);
    } catch (err) {
      const message =
        err instanceof BridgeRequestError
          ? err.message
          : err instanceof BackendRequestError
            ? err.message
            : "Deposit simulation failed.";
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const activeVa =
    tab === "usd" ? bridgeState?.virtualAccounts.usd : bridgeState?.virtualAccounts.eur;
  const instructions = activeVa?.source_deposit_instructions;

  return (
    <div className="px-4 pt-4 pb-8">
      <Link href="/app/account" className="text-sm font-semibold text-brand-green">
        ← Account
      </Link>

      <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <span>🧪</span>
        <p>
          Bridge sandbox demo: KYC is simulated, virtual accounts show dummy ACH/SEPA details,
          and deposits credit your USD balance. USDC settles to your wallet on Base in production.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <>
          <KycPanel
            bridgeState={bridgeState}
            kycApproved={kycApproved}
            busy={busy}
            onCreateCustomer={() => void handleCreateCustomer()}
            onSimulateKyc={() => void handleSimulateKyc()}
          />

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          {bridgeState && kycApproved ? (
            <>
              <div className="mt-6 flex rounded-xl border border-border bg-surface p-1">
                {(["usd", "eur"] as const).map((currency) => (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => setTab(currency)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                      tab === currency
                        ? "bg-brand-green text-white"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {currency === "usd" ? "USD (ACH/Wire)" : "EUR (SEPA)"}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-muted">
                {tab === "usd"
                  ? "Receive USD from Fiverr, Upwork, PayPal, or US clients. Bridge converts to USDC on Base."
                  : "Receive EUR via SEPA from EU banks (e.g. Yoursafe). Bridge converts to USDC on Base."}
              </p>

              {!activeVa ? (
                <button
                  type="button"
                  onClick={() => void handleCreateVirtualAccount(tab)}
                  disabled={!!busy}
                  className="mt-4 h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60"
                >
                  {busy === `create-va-${tab}`
                    ? "Creating virtual account…"
                    : `Create ${tab.toUpperCase()} virtual account`}
                </button>
              ) : (
                <DepositCard currency={tab} instructions={instructions} wallet={bridgeState.walletAddress} />
              )}

              <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">
                Simulate incoming {tab === "usd" ? "USD" : "EUR"} deposit
              </p>
              <p className="mt-1 text-sm text-muted">
                Sandbox has no real money movement — tap to mimic a platform payout crediting your balance.
              </p>

              <div className="mt-4 space-y-2">
                {(tab === "usd" ? USD_SIM_SOURCES : EUR_SIM_SOURCES).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!!busy || !activeVa}
                    onClick={() => void handleSimulateDeposit(item.amount, item.id, tab)}
                    className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 disabled:opacity-50"
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-lg font-extrabold text-brand-green">
                      +{tab === "usd" ? "$" : "€"}
                      {item.amount}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-semibold text-muted">
                Custom amount ({tab === "usd" ? "USD" : "EUR"})
              </p>
              <div className="mt-2 flex items-center rounded-xl border border-border bg-surface">
                <span className="pl-4 text-lg font-semibold text-muted">
                  {tab === "usd" ? "$" : "€"}
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!!busy || !activeVa}
                  className="h-[52px] flex-1 bg-transparent px-2 text-lg font-semibold outline-none"
                />
              </div>
              <button
                type="button"
                disabled={!!busy || !activeVa}
                onClick={() => {
                  const amount = Number(customAmount);
                  if (!amount || amount <= 0) {
                    alert("Enter a positive amount.");
                    return;
                  }
                  void handleSimulateDeposit(amount, "custom", tab);
                }}
                className="mt-3 h-12 w-full rounded-xl border-2 border-brand-green text-sm font-bold text-brand-green disabled:opacity-50"
              >
                Simulate custom deposit
              </button>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted">
            USD balance: <strong>${usdBalance.toFixed(2)}</strong>
          </p>

          <button
            type="button"
            onClick={() => router.push("/app/withdraw")}
            className="mt-4 h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white"
          >
            Withdraw to MWK
          </button>
        </>
      )}
    </div>
  );
}

function KycPanel({
  bridgeState,
  kycApproved,
  busy,
  onCreateCustomer,
  onSimulateKyc,
}: {
  bridgeState: BridgeUserState | null;
  kycApproved: boolean;
  busy: string | null;
  onCreateCustomer: () => void;
  onSimulateKyc: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-bold">Bridge identity (KYC demo)</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        In production, users complete hosted KYC before receiving deposit details. In sandbox we
        create a customer via API and simulate approval.
      </p>

      {!bridgeState ? (
        <button
          type="button"
          onClick={onCreateCustomer}
          disabled={busy === "create-customer"}
          className="mt-4 h-11 w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60"
        >
          {busy === "create-customer" ? "Creating…" : "1. Create Bridge customer"}
        </button>
      ) : (
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">Customer ID</dt>
            <dd className="font-mono text-xs break-all">{bridgeState.customerId}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">KYC status</dt>
            <dd className="font-semibold">
              {kycApproved ? (
                <span className="text-brand-green">Approved (simulated)</span>
              ) : (
                <span className="text-amber-600">Pending — simulate approval</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      {bridgeState && !kycApproved ? (
        <button
          type="button"
          onClick={onSimulateKyc}
          disabled={busy === "simulate-kyc"}
          className="mt-4 h-11 w-full rounded-xl border-2 border-brand-green text-sm font-bold text-brand-green disabled:opacity-60"
        >
          {busy === "simulate-kyc" ? "Approving…" : "2. Simulate KYC approval"}
        </button>
      ) : null}

      {bridgeState && kycApproved ? (
        <p className="mt-4 text-sm font-semibold text-brand-green">
          ✓ Ready for virtual accounts below
        </p>
      ) : null}
    </div>
  );
}

function DepositCard({
  currency,
  instructions,
  wallet,
}: {
  currency: FiatTab;
  instructions?: BridgeDepositInstructions;
  wallet?: string;
}) {
  if (!instructions) return null;

  return (
    <div className="mt-6 rounded-2xl bg-surface p-6 shadow-card">
      <h2 className="font-bold">
        Your {currency.toUpperCase()} deposit details
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        {currency === "usd" ? (
          <>
            <Detail label="Bank" value={instructions.bank_name} />
            <Detail label="Beneficiary" value={instructions.bank_beneficiary_name} />
            <Detail label="Routing" value={instructions.bank_routing_number} />
            <Detail label="Account" value={instructions.bank_account_number} mono />
            <Detail label="Address" value={instructions.bank_address} />
          </>
        ) : (
          <>
            <Detail label="IBAN" value={instructions.iban} mono />
            <Detail label="BIC" value={instructions.bic} mono />
            <Detail label="Account holder" value={instructions.account_holder_name} />
            <Detail label="Bank" value={instructions.bank_name} />
            <Detail label="Bank address" value={instructions.bank_address} />
          </>
        )}
      </dl>
      <p className="mt-4 text-xs font-semibold text-brand-green">
        Rails: {(instructions.payment_rails ?? [instructions.payment_rail]).filter(Boolean).join(", ").toUpperCase()}
      </p>
      {wallet ? (
        <p className="mt-3 text-xs text-muted">
          USDC destination (Base): <span className="font-mono break-all">{wallet}</span>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Incoming {currency.toUpperCase()} is auto-converted to USDC and delivered on-chain. Your app
        balance is credited when we detect the deposit (simulated in this demo).
      </p>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${mono ? "font-mono text-sm break-all" : ""}`}>{value}</dd>
    </div>
  );
}
