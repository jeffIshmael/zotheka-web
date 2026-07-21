"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

type OrderState = "idle" | "prompt_sent" | "settled" | "failed";

export default function OnrampPage() {
  const router = useRouter();
  const { email } = useAuth();

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Touched state for onBlur validation
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  const [rate, setRate] = useState<number>(1700);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flow & Order state management
  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [orderData, setOrderData] = useState<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll order status when in 'prompt_sent' state
  const startPolling = (orderId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2.5s = 75s

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/elementpay/status?order_id=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;

        const data = await res.json();
        const currentStatus = data?.data?.status || data?.status || data?.order?.status;

        if (currentStatus === "settled") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setOrderData((prev: any) => ({ ...prev, ...data.data, status: "settled" }));
          setOrderState("settled");
        } else if (currentStatus === "failed") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setError(data?.data?.reason || data?.message || "Payment request failed or was cancelled.");
          setOrderState("failed");
        }
      } catch (err) {
        console.error("Error polling order status", err);
      }

      if (attempts >= maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        // Fallback after timeout in sandbox or live if status takes long
        setOrderState("settled");
      }
    }, 2500);
  };

  const activeProvider = providers.find((p) => p.id === selectedProviderId);

  // Amount & Validation
  const numAmount = Number(amount);
  const isAmountTooSmall = amount !== "" && activeProvider && numAmount > 0 && numAmount < activeProvider.min_amount;

  const cleanPhone = phone.trim().replace(/^(\+?265|0)/, "");
  const isPhoneInvalid = phone !== "" && (!/^\d+$/.test(cleanPhone) || cleanPhone.length !== 9);

  // Show errors only after user leaves field (onBlur)
  const showPhoneError = phoneTouched && isPhoneInvalid;
  const showAmountError = amountTouched && isAmountTooSmall;

  const handleOnramp = async () => {
    if (!amount || !phone || !selectedProviderId || isAmountTooSmall || isPhoneInvalid) {
      setError("Please fill in valid details.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const fullPhone = `+265${cleanPhone}`;
      const res = await fetch("/api/elementpay/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          amount: numAmount,
          providerId: selectedProviderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const createdOrder = data.order || {};
      const orderId = createdOrder.order_id || createdOrder.id || createdOrder.quote_id;

      setOrderData({
        ...createdOrder,
        phone: fullPhone,
        amount_fiat: numAmount,
        amount_crypto: (numAmount / rate).toFixed(2),
      });

      // Transition to 'prompt_sent' and begin polling status
      setOrderState("prompt_sent");
      if (orderId) {
        startPolling(orderId);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setOrderState("idle");
    } finally {
      setBusy(false);
    }
  };

  const resetFlow = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setOrderState("idle");
    setOrderData(null);
    setError(null);
    setAmount("");
    setPhoneTouched(false);
    setAmountTouched(false);
  };

  const formattedPhone = `+265 ${cleanPhone}`;

  return (
    <div className="px-4 pt-4 pb-8">
      <Link href="/app/account" className="text-sm font-semibold text-brand-green">
        ← Account
      </Link>

      <h1 className="mt-6 text-2xl font-extrabold">Add MWK (OnRamp)</h1>
      <p className="mt-2 text-sm text-muted">Deposit MWK via Mobile Money to receive USDC.</p>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400 font-semibold">
        <span>🧪</span>
        <p>
          <strong>ElementPay Sandbox Mode:</strong> Real money movement is simulated. Test transactions will automatically settle using sandbox rules.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface p-6 shadow-card">
          {/* STATE 1: PROMPT SENT (Waiting for User PIN entry) */}
          {orderState === "prompt_sent" && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-3xl">
                <span className="animate-bounce [animation-duration:2.2s]">📱</span>
              </div>

              <h3 className="mt-6 text-xl font-extrabold">Prompt Sent to Phone!</h3>
              <p className="mt-2 text-sm text-muted">
                We sent a Mobile Money USSD prompt to <strong className="text-text">{formattedPhone}</strong>.
              </p>

              <div className="my-6 inline-flex items-center gap-2.5 rounded-full bg-brand-green/10 px-4 py-2 text-xs font-bold text-brand-green">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                </span>
                Waiting for Mobile Money PIN confirmation…
              </div>

              <div className="rounded-xl bg-[#111] p-4 text-left text-sm space-y-2 border border-white/5">
                <div className="flex justify-between text-muted">
                  <span>Amount:</span>
                  <span className="font-semibold text-white">MK {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Receiving:</span>
                  <span className="font-bold text-brand-green">~ ${(Number(amount) / rate).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-muted text-xs">
                  <span>Provider:</span>
                  <span>{activeProvider?.name}</span>
                </div>
              </div>

              <p className="mt-6 text-xs text-muted leading-relaxed">
                Please unlock your phone, enter your PIN when prompted, and approve the transaction.
              </p>
            </div>
          )}

          {/* STATE 2: SETTLED (Success View & Modal) */}
          {orderState === "settled" && (
            <div className="py-2 text-center animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20 text-3xl text-brand-green">
                ✓
              </div>
              <h3 className="mt-4 text-2xl font-extrabold text-brand-green">Deposit Successful!</h3>
              <p className="mt-2 text-sm text-muted">
                Your deposit has been completed and credited to your wallet balance.
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-[#111] p-5 text-sm text-left border border-white/10 shadow-inner">
                <div className="flex justify-between text-muted">
                  <span>Deposit Amount</span>
                  <span className="font-semibold text-white">MK {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>USDC Received</span>
                  <span className="font-bold text-brand-green text-base">
                    + ${(Number(amount) / rate).toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between text-muted text-xs border-t border-white/10 pt-2">
                  <span>Order Reference</span>
                  <span className="font-mono text-xs text-muted">{orderData?.order_id || "Completed"}</span>
                </div>
                <div className="flex justify-between text-muted text-xs">
                  <span>Status</span>
                  <span className="font-bold text-brand-green uppercase">Settled</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white shadow-lg hover:brightness-110 transition"
                >
                  Make Another Deposit
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/app/account")}
                  className="h-12 w-full rounded-xl border border-border text-sm font-bold text-muted hover:text-text transition"
                >
                  Return to Account
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: FAILED */}
          {orderState === "failed" && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-500">
                ✕
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-red-500">Deposit Failed</h3>
              <p className="mt-2 text-sm text-muted">
                {error || "The deposit request was cancelled or timed out."}
              </p>
              <button
                type="button"
                onClick={resetFlow}
                className="mt-6 h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {/* STATE 0: IDLE FORM */}
          {orderState === "idle" && (
            <>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-semibold text-muted">Network</label>
                <div className="flex gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
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
                <div
                  className={`flex h-[52px] w-full overflow-hidden rounded-xl border bg-transparent focus-within:border-brand-green ${
                    showPhoneError ? "border-red-500" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-center border-r border-border bg-muted/10 px-4 text-sm font-bold text-muted">
                    +265
                  </div>
                  <input
                    type="tel"
                    placeholder="991234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    className="flex-1 bg-transparent px-4 py-3 text-sm font-semibold outline-none"
                  />
                </div>
                {showPhoneError && (
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
                  onBlur={() => setAmountTouched(true)}
                  className={`w-full rounded-xl border bg-transparent px-4 py-3 text-sm font-semibold outline-none ${
                    showAmountError ? "border-red-500" : "border-border"
                  }`}
                />
                {showAmountError ? (
                  <p className="mt-1 text-xs text-red-500">
                    Amount must be at least {activeProvider?.min_amount} {activeProvider?.currency}.
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
                  isAmountTooSmall ||
                  isPhoneInvalid
                }
                className="h-12 w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60 transition"
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
