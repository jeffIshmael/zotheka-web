"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/app-data";

const KSH_TO_USD_RATE = 130;
const CONCIERGE_FEE_USD = 1;
const CONCIERGE_FEE_INTERVAL = 5;

const SPOTIFY_PACKAGES = [
  { id: "individual", name: "Individual", priceKsh: 470, desc: "1 Premium account" },
  { id: "student", name: "Student", priceKsh: 260, desc: "1 verified Premium account" },
  { id: "duo", name: "Duo", priceKsh: 600, desc: "2 Premium accounts" },
  { id: "family", name: "Family", priceKsh: 720, desc: "Up to 6 Premium accounts" },
];

export default function ManualServicePage() {
  const { email } = useAuth();
  const { rate, kycVerified, kycPhone } = useAppData();
  const router = useRouter();

  const [targetEmail, setTargetEmail] = useState("");
  const [targetPassword, setTargetPassword] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState("individual");
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [pollingOrderId, setPollingOrderId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pollStatus === "pending" && pollingOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/elementpay/status?order_id=${pollingOrderId}`);
          const data = await res.json();
          
          if (data && data.data) {
            const status = data.data.status?.toLowerCase();
            
            if (status === "successful" || status === "completed" || status === "success" || status === "paid") {
              setPollStatus("success");
              setShowSuccessModal(true);
              setPaying(false);
            } else if (status === "failed" || status === "cancelled" || status === "canceled") {
              setPollStatus("failed");
              setErrorMsg(`Transaction failed: ${data.data.reason || "Unknown reason"}`);
              setPaying(false);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollStatus, pollingOrderId]);

  const selectedPkg = SPOTIFY_PACKAGES.find((p) => p.id === selectedPkgId)!;
  const baseUsd = selectedPkg.priceKsh / KSH_TO_USD_RATE;
  const serviceFeeUsd = Math.max(1, Math.floor(baseUsd / CONCIERGE_FEE_INTERVAL)) * CONCIERGE_FEE_USD;
  const totalUsd = baseUsd + serviceFeeUsd;
  const totalMwk = totalUsd * rate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    if (kycVerified === false) {
      setErrorMsg("Please verify your account first.");
      return;
    }

    setPaying(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/concierge/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: kycPhone || "",
          amountMwk: totalMwk,
          usdAmount: totalUsd,
          providerId: "airtel", // Defaulting for MVP, would normally be selected
          targetEmail,
          targetPassword,
          service: "Spotify",
          packageName: selectedPkg.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.order?.order_id) {
        setPollingOrderId(data.order.order_id);
        setPollStatus("pending");
      } else {
        setShowSuccessModal(true);
        setPaying(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      setPaying(false);
    }
  };

  const isMalawian = kycPhone && (kycPhone.startsWith("+265") || kycPhone.startsWith("265") || kycPhone.startsWith("0"));
  const isFormValid = targetEmail.trim().length > 0 && targetPassword.length > 0 && kycVerified === true && isMalawian;

  return (
    <div className="px-4 pt-4 pb-20">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Manual Service</h1>
      </header>

      <div className="mb-6 rounded-2xl bg-surface p-4 shadow-card border border-border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
            <Image src="/images/spotify.webp" alt="Spotify" width={48} height={48} className="object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-black">Spotify Premium</h2>
            <p className="text-sm text-muted">Manual upgrade service</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted leading-relaxed">
          Provide your login details securely. We will manually upgrade your account to Premium. Passwords are encrypted and never shared.
        </p>

        {(!kycVerified || !isMalawian) && (
          <div className="mt-3 rounded-lg bg-brand-yellow/20 p-2 text-xs font-semibold text-brand-black">
            {!kycVerified 
              ? "You must complete KYC verification to use this service." 
              : "This service is currently restricted to Malawian phone numbers only."}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-brand-black">Login Details</label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="Spotify Email"
            disabled={paying}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-green"
          />
          <input
            type="password"
            value={targetPassword}
            onChange={(e) => setTargetPassword(e.target.value)}
            placeholder="Spotify Password"
            disabled={paying}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-brand-black">Select Package</label>
          <div className="grid grid-cols-2 gap-3">
            {SPOTIFY_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`relative flex flex-col items-start justify-center rounded-xl border p-4 text-left transition overflow-hidden ${
                  selectedPkgId === pkg.id
                    ? "border-brand-green bg-brand-green/10"
                    : "border-border bg-surface hover:border-brand-green/50"
                }`}
              >
                <span className="font-bold text-brand-black mt-1">{pkg.name}</span>
                <span className="text-[10px] text-muted">{pkg.desc}</span>
                <span className="mt-2 text-xs font-bold text-brand-green">${(pkg.priceKsh / KSH_TO_USD_RATE).toFixed(2)} / mo</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Package Cost</span>
            <span className="font-bold">${baseUsd.toFixed(2)}</span>
          </div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Processing Fee</span>
            <span className="font-bold">${serviceFeeUsd.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-bold text-brand-black">Total (MWK)</span>
            <div className="text-right">
              <span className="text-lg font-black text-brand-green">
                {totalMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK
              </span>
              <p className="text-[9px] text-muted font-semibold mt-0.5">Rate: {rate} MWK/USD</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-500">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={paying || !isFormValid}
          className="w-full rounded-full bg-brand-green px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-50 flex flex-col items-center justify-center"
        >
          {paying ? (
            "Prompt sent. Waiting for payment..."
          ) : !isFormValid ? (
            "Fill details to pay"
          ) : (
            <>
              <span>Pay {totalMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK</span>
              <span className="text-[10px] font-medium text-white/80">via {kycPhone}</span>
            </>
          )}
        </button>
      </form>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20">
              <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-black">Payment Successful</h3>
            <p className="mt-2 text-sm text-muted">
              Your details have been received and are in line for processing. You will see the update in your purchases shortly.
            </p>
            <button
              onClick={() => router.push("/app/purchases")}
              className="mt-6 w-full rounded-full bg-brand-green px-4 py-3 font-bold text-white transition hover:bg-brand-green-dark"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
