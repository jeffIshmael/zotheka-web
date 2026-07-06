"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BackendRequestError,
  getUserProfile,
  simulateDeposit,
  type DepositInstructions,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const DEMO_SOURCES = [
  { id: "fiverr", label: "Fiverr payout", amount: 100 },
  { id: "paypal", label: "PayPal transfer", amount: 250 },
  { id: "upwork", label: "Upwork payment", amount: 500 },
] as const;

export default function AddUsdPage() {
  const router = useRouter();
  const { email } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usdBalance, setUsdBalance] = useState(0);
  const [instructions, setInstructions] = useState<DepositInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [simulating, setSimulating] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await getUserProfile(email);
      setUsdBalance(profile.usd_balance);
      setInstructions(profile.deposit_instructions);
    } catch {
      setError("Could not load deposit details.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runSimulate = async (amount: number, source: string) => {
    if (!email) return;
    setSimulating(source);
    try {
      const result = await simulateDeposit({ email, amount, source });
      if (result.status === "success") {
        await refresh();
        alert(
          `$${result.amount.toFixed(2)} from ${source} credited. Balance: $${result.usd_balance.toFixed(2)}`
        );
        return;
      }
      alert(result.message);
    } catch (err) {
      const message =
        err instanceof BackendRequestError
          ? err.message
          : "Could not reach the backend. Try again.";
      alert(message);
    } finally {
      setSimulating(null);
    }
  };

  const handleCustomSimulate = () => {
    const amount = Number(customAmount);
    if (!amount || amount <= 0) {
      alert("Enter a positive USD amount.");
      return;
    }
    void runSimulate(amount, "custom");
  };

  return (
    <div className="px-4 pt-4">
      <Link href="/app/account" className="text-sm font-semibold text-brand-green">
        ← Account
      </Link>

      <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <span>🧪</span>
        <p>
          Demo mode: mock Bridge virtual account. In production, real ACH/wire from PayPal,
          Fiverr, or Upwork credits this balance.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <>
          {instructions && (
            <div className="mt-6 rounded-2xl bg-surface p-6 shadow-card">
              <h2 className="font-bold">Your USD deposit details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Detail label="Bank" value={instructions.bank_name} />
                <Detail label="Beneficiary" value={instructions.bank_beneficiary_name} />
                <Detail label="Routing (ACH)" value={instructions.bank_routing_number} />
                <Detail label="Account" value={instructions.bank_account_number} mono />
                <Detail label="Address" value={instructions.bank_address} />
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-muted">{instructions.instructions}</p>
              <p className="mt-2 text-xs font-semibold text-brand-green">
                Rails: {instructions.payment_rails.join(", ").toUpperCase()}
              </p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">
            Simulate platform payout
          </p>
          <p className="mt-1 text-sm text-muted">
            Tap a button to mimic USD arriving from a payment platform (MVP only).
          </p>

          <div className="mt-4 space-y-2">
            {DEMO_SOURCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void runSimulate(item.amount, item.id)}
                disabled={!!simulating}
                className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 disabled:opacity-60"
              >
                {simulating === item.id ? (
                  <span className="text-sm text-muted">Processing…</span>
                ) : (
                  <>
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-lg font-extrabold text-brand-green">+${item.amount}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <p className="mt-6 text-sm font-semibold text-muted">Custom amount (USD)</p>
          <div className="mt-2 flex items-center rounded-xl border border-border bg-surface">
            <span className="pl-4 text-lg font-semibold text-muted">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="0.00"
              disabled={!!simulating}
              className="h-[52px] flex-1 bg-transparent px-2 text-lg font-semibold outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomSimulate}
            disabled={!!simulating}
            className="mt-3 h-12 w-full rounded-xl border-2 border-brand-green text-sm font-bold text-brand-green disabled:opacity-50"
          >
            Simulate custom deposit
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            Current balance: <strong>${usdBalance.toFixed(2)}</strong>
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

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
