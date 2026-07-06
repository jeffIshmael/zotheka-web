"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BackendRequestError, convertToMwk, getMonitor, getUserProfile, makeChargeId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DEMO_BYPASS_ONCHAIN, resolveUsdToMwkRate } from "@/lib/config";

const NETWORKS = [
  { id: "airtel" as const, label: "Airtel Money", logo: "/images/Airtel-logo.jpg", height: 32 },
  { id: "mtn" as const, label: "TNM Mpamba", logo: "/images/mtn-yellow-logo.png", height: 36 },
];

type NetworkId = (typeof NETWORKS)[number]["id"];

export default function WithdrawPage() {
  const router = useRouter();
  const { email } = useAuth();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<NetworkId>("airtel");
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [rate, setRate] = useState(1700);

  const refresh = useCallback(async () => {
    if (!email) return;
    try {
      const [profile, monitor] = await Promise.all([
        getUserProfile(email),
        getMonitor().catch(() => null),
      ]);
      setAvailableBalance(profile.usd_balance);
      if (monitor) setRate(resolveUsdToMwkRate(monitor.usd_to_mwk_rate));
    } catch {
      /* ignore */
    }
  }, [email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const amountNum = Number(amount);
  const exceedsUsdBalance = amountNum > availableBalance;
  const mwkEstimate = amount && !exceedsUsdBalance ? Math.round(amountNum * rate) : 0;

  const handleWithdraw = async () => {
    if (!email || !amount || !phone || exceedsUsdBalance || submitting) return;

    setSubmitting(true);
    try {
      const result = await convertToMwk({
        usd_amount: amountNum,
        phone: phone.trim(),
        charge_id: makeChargeId("withdraw"),
        email,
      });

      if (result.status === "success") {
        alert(
          `$${amountNum.toFixed(2)} cashed out. Payout of MK ${result.mwk_amount.toLocaleString()} to your ${network === "airtel" ? "Airtel" : "TNM"} number is processing.`
        );
        router.push("/app/account");
        return;
      }
      alert(result.message);
    } catch (error) {
      const message =
        error instanceof BackendRequestError
          ? error.message
          : "Could not complete withdrawal. Try again.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-4">
      <Link href="/app/account" className="text-sm font-semibold text-brand-green">
        ← Account
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold">Withdraw to MWK</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {DEMO_BYPASS_ONCHAIN
          ? "Cash out your USD balance to mobile money"
          : "Cash out USD by sending USDC to the treasury, then receive MWK on mobile money"}
        {` · 1 USD ≈ ${rate.toLocaleString()} MWK`}.
      </p>

      <p className="mt-6 text-sm font-semibold text-muted">Network</p>
      <div className="mt-2 flex gap-2">
        {NETWORKS.map((item) => {
          const selected = network === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setNetwork(item.id)}
              className={`flex h-14 flex-1 items-center justify-center rounded-xl border px-3 ${
                selected ? "border-brand-green bg-brand-green-light" : "border-border bg-surface"
              }`}
            >
              <Image
                src={item.logo}
                alt={item.label}
                width={120}
                height={item.height}
                className="max-h-9 w-auto object-contain"
              />
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-sm font-semibold text-muted">Phone number</p>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="0991234567"
        disabled={submitting}
        className="mt-2 h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-lg font-semibold outline-none ring-brand-green focus:ring-2"
      />

      <p className="mt-6 text-sm font-semibold text-muted">Amount (USD)</p>
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
          className="h-[52px] flex-1 bg-transparent px-2 text-lg font-semibold outline-none"
        />
      </div>
      <p className="mt-2 text-sm text-muted">
        Available: <strong>${availableBalance.toFixed(2)}</strong>
        {" · "}
        <strong>({Math.round(availableBalance * rate).toLocaleString()} MKW)</strong>
      </p>
      {exceedsUsdBalance && (
        <p className="mt-1 text-sm text-red-500">Amount exceeds your USD balance.</p>
      )}

      {mwkEstimate > 0 && !exceedsUsdBalance && (
        <div className="mt-4 rounded-xl bg-brand-green-light p-4">
          <p className="text-xs text-brand-green-dark">You&apos;ll receive approx.</p>
          <p className="text-2xl font-extrabold text-brand-green-dark">
            MK {mwkEstimate.toLocaleString()}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleWithdraw}
        disabled={!amount || !phone || !email || exceedsUsdBalance || submitting}
        className="mt-8 h-[52px] w-full rounded-xl bg-brand-green text-sm font-bold text-white disabled:bg-border disabled:text-muted"
      >
        {submitting ? "Processing payout…" : "Confirm withdrawal"}
      </button>
    </div>
  );
}
