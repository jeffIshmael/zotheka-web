"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMonitor, getUserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { resolveUsdToMwkRate } from "@/lib/config";

type Provider = {
  id: string;
  name: string;
  code: string;
  min_amount: number;
  max_amount: number;
  currency: string;
};

export default function WithdrawPage() {
  const router = useRouter();
  const { email } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  
  const [availableBalance, setAvailableBalance] = useState(0);
  const [rate, setRate] = useState(1700);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!email) return;
    try {
      const [profileRes, monitorRes, infoRes] = await Promise.all([
        getUserProfile(email).catch(() => null),
        getMonitor().catch(() => null),
        fetch("/api/elementpay/info?order_type=OffRamp").then((r) => r.json()),
      ]);

      if (profileRes) setAvailableBalance(profileRes.usd_balance);
      
      if (monitorRes) {
        setRate(resolveUsdToMwkRate(monitorRes.usd_to_mwk_rate));
      }

      if (infoRes?.rate?.exchange_rate) {
        setRate(infoRes.rate.exchange_rate);
      } else if (infoRes?.rate?.sell) {
        setRate(infoRes.rate.sell);
      }

      if (infoRes?.providers && infoRes.providers.length > 0) {
        setProviders(infoRes.providers);
        setSelectedProviderId(infoRes.providers[0].id);
      }
    } catch (err) {
      console.error("Failed to load offramp info", err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const amountNum = Number(amount);
  const exceedsUsdBalance = amountNum > availableBalance;
  
  // Fee Calculation: 2%
  const platformFee = amountNum > 0 ? amountNum * 0.02 : 0;
  const netAmount = amountNum - platformFee;
  const mwkEstimate = netAmount > 0 && !exceedsUsdBalance ? Math.round(netAmount * rate) : 0;

  const handleWithdraw = async () => {
    if (!email || !amount || !phone || exceedsUsdBalance || submitting || !selectedProviderId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/elementpay/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          phone: `+265${phone.trim().replace(/^(\+?265|0)/, "")}`,
          providerId: selectedProviderId,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      setSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <div className="px-4 pt-4 pb-8">
      <Link href="/app/account" className="text-sm font-semibold text-brand-green">
        ← Account
      </Link>
      
      <h1 className="mt-4 text-2xl font-extrabold">Withdraw to MWK</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Cash out your USD balance to mobile money (Element Pay OffRamp).
      </p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6">
          {success ? (
            <div className="rounded-2xl bg-surface p-6 shadow-card text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-2xl text-brand-green">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-extrabold">Withdrawal Started</h3>
              <p className="mt-4 text-sm text-muted">
                Your withdrawal is being processed. It may take a few minutes for the funds to arrive in your mobile money account.
              </p>
              <button
                type="button"
                onClick={() => router.push("/app/account")}
                className="mt-6 w-full rounded-xl bg-brand-green px-8 py-3 text-sm font-bold text-white"
              >
                Return to Account
              </button>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm font-semibold text-muted">Network</p>
              <div className="mt-2 flex gap-2">
                {providers.map((item) => {
                  const selected = selectedProviderId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedProviderId(item.id)}
                      className={`flex h-14 flex-1 items-center justify-center rounded-xl border px-3 text-sm font-bold ${
                        selected ? "border-brand-green bg-brand-green-light text-brand-green-dark" : "border-border bg-surface text-muted hover:text-text"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-sm font-semibold text-muted">Phone Number</p>
              <div className="mt-2 flex h-[52px] w-full overflow-hidden rounded-xl border border-border bg-surface focus-within:ring-2 ring-brand-green">
                <div className="flex items-center justify-center border-r border-border bg-muted/10 px-4 text-lg font-bold text-muted">
                  +265
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="991234567"
                  disabled={submitting}
                  className="flex-1 bg-transparent px-4 text-lg font-semibold outline-none disabled:opacity-60"
                />
              </div>

              <p className="mt-6 text-sm font-semibold text-muted">Amount (USDC)</p>
              <div
                className={`mt-2 flex items-center rounded-xl border bg-surface ${
                  exceedsUsdBalance ? "border-red-500" : "border-border"
                }`}
              >
                <span className="pl-4 text-lg font-semibold text-muted">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                  className="h-[52px] flex-1 bg-transparent px-2 text-lg font-semibold outline-none disabled:opacity-60"
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted">
                <span>Available: <strong>${availableBalance.toFixed(2)}</strong></span>
                <span>{`1 USD ≈ ${rate.toLocaleString()} MWK`}</span>
              </div>
              
              {exceedsUsdBalance && (
                <p className="mt-1 text-sm text-red-500">Amount exceeds your USD balance.</p>
              )}

              {amountNum > 0 && !exceedsUsdBalance && (
                <div className="mt-6 space-y-3 rounded-xl bg-[#111] p-4 text-sm shadow-inner">
                  <div className="flex justify-between text-muted">
                    <span>Withdrawal Amount</span>
                    <span>${amountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-brand-green/80">
                    <span>Platform Fee (2%)</span>
                    <span>- ${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/10 pt-3">
                    <span>Net Amount</span>
                    <span>${netAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-bold text-brand-green text-lg">
                    <span>You Receive (Est.)</span>
                    <span>~ MK {mwkEstimate.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={!amount || !phone || !email || exceedsUsdBalance || submitting || !selectedProviderId}
                className="mt-8 h-[52px] w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:bg-border disabled:text-muted transition"
              >
                {submitting ? "Processing payout…" : "Confirm withdrawal"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
