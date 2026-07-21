"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

type OrderState = "idle" | "prompt_sent" | "settled" | "failed";

export default function WithdrawPage() {
  const router = useRouter();
  const { email } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  // Touched state for onBlur validation
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [rate, setRate] = useState(1700);

  const [error, setError] = useState<string | null>(null);

  // Flow & Order state management
  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [orderData, setOrderData] = useState<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          setError(data?.data?.reason || data?.message || "Withdrawal failed or was cancelled.");
          setOrderState("failed");
        }
      } catch (err) {
        console.error("Error polling order status", err);
      }

      if (attempts >= maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setOrderState("settled");
      }
    }, 2500);
  };

  const activeProvider = providers.find((p) => p.id === selectedProviderId);

  // Currency & Amounts calculations
  const amountNum = Number(amount);
  const exceedsUsdBalance = amountNum > availableBalance;

  // Provider min amount in MWK converted to USD for withdrawal validation
  const minUsdRequired = activeProvider && rate > 0 ? activeProvider.min_amount / rate : 0;
  const isAmountTooSmall = amount !== "" && amountNum > 0 && minUsdRequired > 0 && amountNum < minUsdRequired;

  // Validation status
  const cleanPhone = phone.trim().replace(/^(\+?265|0)/, "");
  const isPhoneInvalid = phone !== "" && (!/^\d+$/.test(cleanPhone) || cleanPhone.length !== 9);

  // Show errors only after user leaves field (onBlur)
  const showPhoneError = phoneTouched && isPhoneInvalid;
  const showExceedsBalance = amountTouched && exceedsUsdBalance;
  const showAmountTooSmall = amountTouched && isAmountTooSmall;

  // Fee Calculation: 2%
  const platformFee = amountNum > 0 ? amountNum * 0.02 : 0;
  const netAmount = amountNum - platformFee;
  const mwkEstimate = netAmount > 0 && !exceedsUsdBalance ? Math.round(netAmount * rate) : 0;

  const handleWithdraw = async () => {
    if (
      !email ||
      !amount ||
      !phone ||
      exceedsUsdBalance ||
      isAmountTooSmall ||
      isPhoneInvalid ||
      submitting ||
      !selectedProviderId
    )
      return;

    setSubmitting(true);
    setError(null);

    try {
      const fullPhone = `+265${cleanPhone}`;
      const res = await fetch("/api/elementpay/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          phone: fullPhone,
          providerId: selectedProviderId,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      const createdOrder = data.order || {};
      const orderId = createdOrder.order_id || createdOrder.id || createdOrder.quote_id;

      setOrderData({
        ...createdOrder,
        phone: fullPhone,
        amount_usd: amountNum,
        net_amount: netAmount,
        mwk_payout: mwkEstimate,
      });

      setOrderState("prompt_sent");
      if (orderId) {
        startPolling(orderId);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setOrderState("idle");
    } finally {
      setSubmitting(false);
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

      <h1 className="mt-6 text-2xl font-extrabold">Withdraw USDC</h1>
      <p className="mt-2 text-sm text-muted">Send funds to your local Mobile Money account.</p>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400 font-semibold">
        <span>🧪</span>
        <p>
          <strong>ElementPay Sandbox Mode:</strong> Real money movement is simulated. Test payouts will automatically settle using sandbox rules.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface p-6 shadow-card">
          {/* STATE 1: PROMPT SENT */}
          {orderState === "prompt_sent" && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-3xl">
                <span className="animate-bounce [animation-duration:2.2s]">📲</span>
              </div>

              <h3 className="mt-6 text-xl font-extrabold">Payout Instructions Submitted!</h3>
              <p className="mt-2 text-sm text-muted">
                Transferring funds to your Mobile Money account <strong className="text-text">{formattedPhone}</strong>.
              </p>

              <div className="my-6 inline-flex items-center gap-2.5 rounded-full bg-brand-green/10 px-4 py-2 text-xs font-bold text-brand-green">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                </span>
                Processing payout on Mobile Money network…
              </div>

              <div className="rounded-xl bg-[#111] p-4 text-left text-sm space-y-2 border border-white/5">
                <div className="flex justify-between text-muted">
                  <span>Withdrawn:</span>
                  <span className="font-semibold text-white">${amountNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Expected Payout:</span>
                  <span className="font-bold text-brand-green">~ MK {mwkEstimate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted text-xs">
                  <span>Network:</span>
                  <span>{activeProvider?.name}</span>
                </div>
              </div>

              <p className="mt-6 text-xs text-muted leading-relaxed">
                Mobile Money payouts usually arrive in your wallet within a few moments.
              </p>
            </div>
          )}

          {/* STATE 2: SETTLED */}
          {orderState === "settled" && (
            <div className="py-2 text-center animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20 text-3xl text-brand-green">
                ✓
              </div>
              <h3 className="mt-4 text-2xl font-extrabold text-brand-green">Withdrawal Complete!</h3>
              <p className="mt-2 text-sm text-muted">
                Your withdrawal has settled and local MWK funds were sent to your Mobile Money account.
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-[#111] p-5 text-sm text-left border border-white/10 shadow-inner">
                <div className="flex justify-between text-muted">
                  <span>USDC Withdrawn</span>
                  <span className="font-semibold text-white">${amountNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Platform Fee (2%)</span>
                  <span className="text-brand-green/80">- ${platformFee.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>MWK Paid Out</span>
                  <span className="font-bold text-brand-green text-base">
                    ~ MK {mwkEstimate.toLocaleString()}
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
                  Make Another Withdrawal
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
              <h3 className="mt-4 text-xl font-extrabold text-red-500">Withdrawal Failed</h3>
              <p className="mt-2 text-sm text-muted">
                {error || "The withdrawal request failed to complete."}
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
              <p className="mt-2 text-sm font-semibold text-muted">Network</p>
              <div className="mt-2 flex gap-2">
                {providers.map((item) => {
                  const selected = selectedProviderId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedProviderId(item.id)}
                      className={`flex h-14 flex-1 items-center justify-center rounded-xl border px-3 text-sm font-bold ${
                        selected
                          ? "border-brand-green bg-brand-green-light text-brand-green-dark"
                          : "border-border bg-surface text-muted hover:text-text"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-sm font-semibold text-muted">Phone Number</p>
              <div
                className={`mt-2 flex h-[52px] w-full overflow-hidden rounded-xl border bg-surface focus-within:ring-2 ring-brand-green ${
                  showPhoneError ? "border-red-500" : "border-border"
                }`}
              >
                <div className="flex items-center justify-center border-r border-border bg-muted/10 px-4 text-lg font-bold text-muted">
                  +265
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="991234567"
                  disabled={submitting}
                  className="flex-1 bg-transparent px-4 text-lg font-semibold outline-none disabled:opacity-60"
                />
              </div>
              {showPhoneError && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid 9-digit phone number.</p>
              )}

              <p className="mt-6 text-sm font-semibold text-muted">Amount (USDC)</p>
              <div
                className={`mt-2 flex items-center rounded-xl border bg-surface ${
                  showExceedsBalance || showAmountTooSmall ? "border-red-500" : "border-border"
                }`}
              >
                <span className="pl-4 text-lg font-semibold text-muted">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => setAmountTouched(true)}
                  placeholder="0.00"
                  disabled={submitting}
                  className="h-[52px] flex-1 bg-transparent px-2 text-lg font-semibold outline-none disabled:opacity-60"
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted">
                <span>
                  Available: <strong>${availableBalance.toFixed(2)}</strong>
                </span>
                <span>{`1 USD ≈ ${rate.toLocaleString()} MWK`}</span>
              </div>

              {showExceedsBalance ? (
                <p className="mt-1 text-sm text-red-500">Amount exceeds your USD balance.</p>
              ) : showAmountTooSmall ? (
                <p className="mt-1 text-sm text-red-500">
                  Amount must be at least ${minUsdRequired.toFixed(2)} USDC (~ {activeProvider?.min_amount.toLocaleString()} MWK).
                </p>
              ) : activeProvider ? (
                <p className="mt-1 text-xs text-muted">
                  Min: ${minUsdRequired > 0 ? minUsdRequired.toFixed(2) : "0.00"} USDC (~ {activeProvider.min_amount.toLocaleString()} MWK)
                </p>
              ) : null}

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
                disabled={
                  !amount ||
                  !phone ||
                  !email ||
                  exceedsUsdBalance ||
                  isAmountTooSmall ||
                  isPhoneInvalid ||
                  submitting ||
                  !selectedProviderId
                }
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
