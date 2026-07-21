"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getMonitor } from "@/lib/api";
import { resolveUsdToMwkRate } from "@/lib/config";
import { useAuth } from "@/lib/auth";

type Provider = {
  id: string;
  name: string;
  code: string;
  min_amount: number;
  max_amount: number;
  currency: string;
};

export default function OnrampPage() {
  const { email } = useAuth();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [rate, setRate] = useState<number>(1700);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [monitorRes, infoRes] = await Promise.all([
        getMonitor().catch(() => null),
        fetch("/api/elementpay/info").then((r) => r.json()),
      ]);

      if (monitorRes) {
        setRate(resolveUsdToMwkRate(monitorRes.usd_to_mwk_rate));
      }

      if (infoRes?.rate?.sell) {
         setRate(infoRes.rate.sell);
      }

      if (infoRes?.providers && infoRes.providers.length > 0) {
        setProviders(infoRes.providers);
        setSelectedProviderId(infoRes.providers[0].id);
      }
    } catch (err) {
      console.error("Failed to load onramp info", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOnramp = async () => {
    if (!amount || !phone || !selectedProviderId) {
      setError("Please fill in all fields.");
      return;
    }

    const provider = providers.find((p) => p.id === selectedProviderId);
    const numAmount = Number(amount);
    if (provider && numAmount < provider.min_amount) {
      setError(`Minimum amount for ${provider.name} is ${provider.min_amount} ${provider.currency}.`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/elementpay/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+265${phone.trim().replace(/^(\+?265|0)/, "")}`,
          amount: numAmount,
          providerId: selectedProviderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      setSuccess(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const activeProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="mt-6 text-2xl font-extrabold">Add MWK (OnRamp)</h1>
      <p className="mt-2 text-sm text-muted">Deposit MWK via Mobile Money to receive USDC.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface p-6 shadow-card">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-2xl text-brand-green">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-extrabold">Prompt sent to your phone!</h3>
              <p className="mt-4 text-sm text-muted">
                Please check your mobile device and enter your Mobile Money PIN to approve the deposit. Wait for the webhook to settle the transaction.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="mt-6 w-full rounded-xl bg-brand-green px-8 py-3 text-sm font-bold text-white"
              >
                Make Another Deposit
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-semibold text-muted">Network</label>
                <div className="flex gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                        selectedProviderId === p.id
                          ? "bg-brand-green text-white"
                          : "bg-surface border border-border text-muted hover:text-text"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-semibold text-muted">Phone Number</label>
                <div className={`flex h-[52px] w-full overflow-hidden rounded-xl border bg-transparent focus-within:border-brand-green ${
                  phone !== "" && (!/^\\d+$/.test(phone.trim().replace(/^(\\+?265|0)/, "")) || phone.trim().replace(/^(\\+?265|0)/, "").length !== 9)
                    ? "border-red-500" 
                    : "border-border"
                }`}>
                  <div className="flex items-center justify-center border-r border-border bg-muted/10 px-4 text-sm font-bold text-muted">
                    +265
                  </div>
                  <input
                    type="tel"
                    placeholder="991234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 text-sm font-semibold outline-none"
                  />
                </div>
                {phone !== "" && (!/^\d+$/.test(phone.trim().replace(/^(\+?265|0)/, "")) || phone.trim().replace(/^(\+?265|0)/, "").length !== 9) && (
                  <p className="mt-1 text-xs text-red-500">Please enter a valid 9-digit phone number.</p>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-semibold text-muted">Amount (MWK)</label>
                <input
                  type="number"
                  placeholder="2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full rounded-xl border bg-transparent px-4 py-3 text-sm font-semibold outline-none ${
                    amount !== "" && activeProvider && Number(amount) < activeProvider.min_amount
                      ? "border-red-500"
                      : "border-border"
                  }`}
                />
                {amount !== "" && activeProvider && Number(amount) < activeProvider.min_amount ? (
                  <p className="mt-1 text-xs text-red-500">
                    Amount must be at least {activeProvider.min_amount} {activeProvider.currency}.
                  </p>
                ) : activeProvider ? (
                  <p className="mt-1 text-xs text-muted">
                    Min: {activeProvider.min_amount} {activeProvider.currency}
                  </p>
                ) : null}
              </div>

              <div className="mb-6 rounded-lg bg-[#111] p-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Indicative Rate</span>
                  <span>1 USD ≈ {rate.toLocaleString()} MWK</span>
                </div>
                {amount && !isNaN(Number(amount)) && (
                  <div className="mt-2 flex justify-between font-bold text-brand-green">
                    <span>You Get (Est.)</span>
                    <span>~ ${(Number(amount) / rate).toFixed(2)} USDC</span>
                  </div>
                )}
              </div>

              {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

              <button
                type="button"
                onClick={handleOnramp}
                disabled={
                  busy || 
                  !amount || 
                  !phone || 
                  (activeProvider && Number(amount) < activeProvider.min_amount) || 
                  (!/^\d+$/.test(phone.trim().replace(/^(\+?265|0)/, "")) || phone.trim().replace(/^(\+?265|0)/, "").length !== 9)
                }
                className="h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Processing..." : "Continue"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
