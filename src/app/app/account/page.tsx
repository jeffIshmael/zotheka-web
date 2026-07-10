"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMonitor, getUserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DEMO_BYPASS_ONCHAIN, resolveUsdToMwkRate } from "@/lib/config";

export default function AccountPage() {
  const router = useRouter();
  const { email, signOut } = useAuth();
  const [usdBalance, setUsdBalance] = useState(0);
  const [rate, setRate] = useState(1700);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const [profile, monitor] = await Promise.all([
        getUserProfile(email),
        getMonitor().catch(() => null),
      ]);
      setUsdBalance(profile.usd_balance);
      if (monitor) {
        setRate(resolveUsdToMwkRate(monitor.usd_to_mwk_rate));
      }
    } catch {
      setError("Could not load account.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mwkBalance = usdBalance * rate;

  const handleSignOut = () => {
    signOut();
    router.replace("/app/sign-in");
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-extrabold">Account</h1>

      <div className="mt-6 rounded-2xl bg-brand-green-dark p-6 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white/80">Your balance</p>
          <p className="text-xs font-semibold text-white/70">1 USD ≈ {rate.toLocaleString()} MWK</p>
        </div>

        {DEMO_BYPASS_ONCHAIN && (
          <div className="mt-3 flex gap-2 rounded-xl border border-amber-300/45 bg-black/20 p-3 text-xs font-semibold leading-relaxed text-amber-100">
            ⚠ Demo money only. Not real US dollars or Malawian Kwacha. For testing only.
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            <div className="h-10 w-44 animate-pulse rounded-lg bg-white/15" />
            <div className="h-7 w-36 animate-pulse rounded-lg bg-white/10" />
          </div>
        ) : (
          <>
            <p className="mt-2 text-5xl font-extrabold tracking-tight">$ {usdBalance.toFixed(2)}</p>
            <p className="mt-1 text-xl font-semibold">= {Math.round(mwkBalance).toLocaleString()} MKW</p>
          </>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link
            href="/app/withdraw"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-3 py-3 text-center text-xs font-bold text-brand-green-dark"
          >
            <span className="text-xl">↓</span>
            Withdraw to MWK
          </Link>
          <Link
            href="/app/add-usd"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-3 py-3 text-center text-xs font-bold text-brand-green-dark"
          >
            <span className="text-xl">+</span>
            Add USD
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => void refresh()}
        className="mt-4 text-sm font-semibold text-brand-green"
      >
        ↻ Refresh balance
      </button>

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Settings</p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="border-b border-border px-4 py-3.5 text-sm">
          <span className="text-muted">Signed in as</span>
          <p className="font-medium">{email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-4 py-3.5 text-left text-sm font-medium text-red-500"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
