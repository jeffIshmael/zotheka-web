"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMonitor } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { resolveUsdToMwkRate } from "@/lib/config";
import { usePrivy } from "@privy-io/react-auth";
import { getUsdcBalance } from "@/lib/base";
import { AddUsdModal } from "@/components/app/AddUsdModal";
import { User, CreditCard, Info, FileText, Shield, MessageCircle, LogOut, ChevronRight, ExternalLink, MoveUpRightIcon } from "lucide-react";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function AccountPage() {
  const router = useRouter();
  const { email, signOut } = useAuth();
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  
  const [usdBalance, setUsdBalance] = useState(0);
  const [rate, setRate] = useState(1700);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycPhone, setKycPhone] = useState<string | null>(null);
  const [kycNetwork, setKycNetwork] = useState<string | null>(null);
  
  const [addUsdOpen, setAddUsdOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const [monitor, kycRes, balance, elementPayInfo] = await Promise.all([
        getMonitor().catch(() => null),
        fetch(`/api/kyc/status?email=${encodeURIComponent(email)}`).then(r => r.json()).catch(() => ({ verified: false, phone: null })),
        walletAddress ? getUsdcBalance(walletAddress) : Promise.resolve(0),
        fetch(`/api/elementpay/info`).then(r => r.json()).catch(() => null)
      ]);
      setUsdBalance(balance);
      
      // Prioritize ElementPay live rate, fallback to monitor rate, then config default
      if (elementPayInfo?.rate?.buy) {
        setRate(elementPayInfo.rate.buy);
      } else if (monitor) {
        setRate(resolveUsdToMwkRate(monitor.usd_to_mwk_rate));
      }
      setKycVerified(kycRes.verified);
      setKycPhone(kycRes.phone || null);
      setKycNetwork(kycRes.network || null);
    } catch {
      setError("Could not load account.");
    } finally {
      setLoading(false);
    }
  }, [email, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mwkBalance = usdBalance * rate;

  const handleSignOut = () => {
    signOut();
    router.replace("/app/sign-in");
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-2xl font-extrabold">Account</h1>

      <div className="mt-6 rounded-2xl bg-brand-green-dark p-6 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white/80">Your Balance</p>
          {loading ? (
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="text-xs font-semibold text-white/70">1 USD ≈ {rate.toLocaleString()} MWK</p>
          )}
        </div>

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

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="h-[76px] animate-pulse rounded-xl bg-white/10" />
            <div className="h-[76px] animate-pulse rounded-xl bg-white/10" />
          </div>
        ) : kycVerified ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              href="/app/withdraw"
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold text-brand-green-dark"
            >
              <span className="text-xl">↓</span>
              Withdraw
            </Link>
            <button
              onClick={() => setAddUsdOpen(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold text-brand-green-dark"
            >
              <span className="text-xl">+</span>
              Deposit USD
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/10 p-4 text-center">
            <p className="text-sm font-medium text-white/90">Verify your identity to activate Add USD & Withdraw features</p>
            <Link
              href="/app/kyc"
              className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-brand-green-dark transition hover:bg-white/90"
            >
              Verify Account
            </Link>
          </div>
        )}
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
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card flex flex-col divide-y divide-border">
        {/* Profile Details */}
        <button
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <User className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Profile Details</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>

        {/* Virtual Card */}
        <button
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-brand-black">Get Virtual Card</span>
              <span className="text-xs font-medium text-muted">Cost: $2.00</span>
            </div>
          </div>
          <span className="rounded-full bg-brand-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Coming Soon</span>
        </button>

        {/* About */}
        <Link
          href="/app/about"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <Info className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">About Zotheka</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* T&C */}
        <Link
          href="/app/terms"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Terms & Conditions</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* Privacy */}
        <Link
          href="/app/privacy"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Privacy Policy</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* X (Twitter) */}
        <Link
          href="https://x.com/zotheka_xyz"
          target="_blank"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <XIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-brand-black">Follow us on X</span>
              <span className="text-xs font-medium text-muted">@zotheka_xyz</span>
            </div>
          </div>
          <ExternalLink className="h-5 w-5 text-muted" />
        </Link>

        {/* Contact Us */}
        <Link
          href="https://chat.whatsapp.com/LTDWDk77lSc886A8fPGzgk?mode=gi_t"
          target="_blank"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center">
              <Image src="/images/icons8-whatsapp.svg" alt="WhatsApp" width={32} height={32} />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Contact Us</span>
          </div>
          <ExternalLink className="h-5 w-5 text-muted" />
        </Link>

      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-4 text-center text-[15px] font-bold text-red-500 transition hover:bg-red-500/10"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>

      <AddUsdModal 
        visible={addUsdOpen}
        email={email || null}
        phone={kycPhone}
        network={kycNetwork}
        walletAddress={walletAddress}
        rate={rate}
        onClose={() => setAddUsdOpen(false)}
        onSuccess={() => {
          setAddUsdOpen(false);
          refresh(); // Refresh balance after successful onramp
        }}
      />

      {/* Profile Details Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
          <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => setProfileModalOpen(false)} />
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl p-6">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border absolute top-2 left-1/2 -translate-x-1/2" />
            
            <div className="flex items-center justify-between mt-4 mb-6">
              <h2 className="text-xl font-extrabold text-brand-black">Profile Details</h2>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-muted"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Email</p>
                <p className="text-[15px] font-semibold text-brand-black truncate">{email}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Phone Number</p>
                <p className="text-[15px] font-semibold text-brand-black truncate">{kycPhone || "Not set"}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Wallet Address</p>
                <p className="text-[15px] font-mono font-semibold text-brand-black break-all">{walletAddress || "Not set"}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">KYC Status</p>
                  <p className="text-[15px] font-semibold text-brand-black">
                    {kycVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                {kycVerified ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-white">✓</span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
