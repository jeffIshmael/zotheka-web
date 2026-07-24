"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { getUsdcBalance } from "@/lib/base";
import { AddUsdModal } from "@/components/app/AddUsdModal";
import { SendUsdcModal } from "@/components/app/SendUsdcModal";
import { User, CreditCard, Info, FileText, Shield, MessageCircle, LogOut, ChevronRight, ExternalLink, MoveUpRightIcon, Lock, RefreshCw, AlertTriangle } from "lucide-react";
import { useAppData } from "@/lib/app-data";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function AccountPage() {
  const router = useRouter();
  const { email, signOut } = useAuth();
  const { user } = usePrivy();
  const { client } = useSmartWallets();
  
  const smartWallet = user?.linkedAccounts?.find((account: any) => account.type === 'smart_wallet');
  const walletAddress = (smartWallet as any)?.address || user?.wallet?.address;
  const { kycVerified, kycPhone, kycNetwork, rate, loading: dataLoading, refresh: refreshData } = useAppData();
  
  const [usdBalance, setUsdBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [addUsdOpen, setAddUsdOpen] = useState(false);
  const [sendUsdcOpen, setSendUsdcOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalanceLoading(false);
      return;
    }
    setBalanceLoading(true);
    setError(null);
    try {
      const balance = await getUsdcBalance(walletAddress);
      setUsdBalance(balance);
    } catch {
      setError("Could not load balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const refreshAll = () => {
    refreshData();
    refreshBalance();
  };

  const isMalawi = kycPhone?.startsWith("+265");
  const loading = dataLoading || balanceLoading;
  const mwkBalance = usdBalance * rate;
  const showSendButton = process.env.NEXT_PUBLIC_SHOW_SEND_BUTTON === "true";

  const handleSignOut = () => {
    signOut();
    router.replace("/app/sign-in");
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-2xl font-extrabold text-brand-black">Account</h1>

      <div className="mt-6 rounded-2xl bg-brand-green-dark p-6 text-white shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white/80">Your Balance</p>
            <button
              type="button"
              onClick={refreshAll}
              className={`text-white/60 hover:text-white transition ${loading ? "animate-spin" : ""}`}
              aria-label="Refresh balance"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
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
            <p className="mt-3 text-5xl font-extrabold tracking-tight">$ {usdBalance.toFixed(2)}</p>
            <p className="mt-1 text-xl font-semibold text-white/90">= {Math.round(mwkBalance).toLocaleString()} MKW</p>
          </>
        )}

        <div className={`mt-7 grid gap-2 ${showSendButton ? "grid-cols-3" : "grid-cols-2"}`}>
          {kycVerified ? (
            <>
              <Link
                href="/app/withdraw"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold text-brand-green-dark transition hover:bg-white/90"
              >
                <span className="text-xl leading-none">↓</span>
                Withdraw
              </Link>
              <button
                onClick={() => setAddUsdOpen(true)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold text-brand-green-dark transition hover:bg-white/90"
              >
                <span className="text-xl leading-none">+</span>
                Deposit USD
              </button>
              {showSendButton && (
                <button
                  onClick={() => setSendUsdcOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold text-brand-green-dark transition hover:bg-white/90"
                >
                  <MoveUpRightIcon className="h-4 w-4 mb-0.5" />
                  Send
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/app/kyc"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/50 px-2 py-3 text-center text-xs font-bold text-brand-green-dark/60 transition hover:bg-white/60"
              >
                <Lock className="h-4 w-4" />
                Withdraw
              </Link>
              <Link
                href="/app/kyc"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/50 px-2 py-3 text-center text-xs font-bold text-brand-green-dark/60 transition hover:bg-white/60"
              >
                <Lock className="h-4 w-4" />
                Deposit USD
              </Link>
              {showSendButton && (
                <Link
                  href="/app/kyc"
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/50 px-2 py-3 text-center text-xs font-bold text-brand-green-dark/60 transition hover:bg-white/60"
                >
                  <Lock className="h-4 w-4" />
                  Send
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-brand-red">{error}</p>}

      {!kycVerified && !loading && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/10 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="flex-1 text-sm font-semibold text-brand-yellow">Verify your identity to unlock features</p>
          <Link href="/app/kyc" className="shrink-0 text-xs font-bold underline underline-offset-2 text-brand-yellow hover:opacity-80">
            Verify Now
          </Link>
        </div>
      )}

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Account</p>
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
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-brand-black">Profile Details</span>
              {kycVerified === false && (
                <span className="mt-0.5 w-fit rounded-full bg-brand-yellow/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
                  Incomplete
                </span>
              )}
            </div>
          </div>
          {kycVerified === false ? (
            <Link 
              href="/app/kyc" 
              className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-brand-yellow/90"
              onClick={(e) => e.stopPropagation()}
            >
              Verify
            </Link>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
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
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Legal & Info</p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card flex flex-col divide-y divide-border">
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-brand-red/5 py-4 text-center text-[15px] font-bold text-brand-red transition hover:bg-brand-red/10"
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
          refreshAll(); // Refresh balance after successful onramp
        }}
      />

      <SendUsdcModal
        visible={sendUsdcOpen}
        walletAddress={walletAddress}
        balance={usdBalance}
        onClose={() => setSendUsdcOpen(false)}
        onSuccess={() => {
          setSendUsdcOpen(false);
          refreshAll();
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-white">!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}