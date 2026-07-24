"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ArrowRightLeft, Wallet, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function AdminPayoutPage() {
  const { email } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Data from backend
  const [balanceUsdc, setBalanceUsdc] = useState(0);
  const [indicativeRate, setIndicativeRate] = useState(0);
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [minAmount, setMinAmount] = useState(150);

  // Input state
  const [inputType, setInputType] = useState<"USDC" | "KES">("KES");
  const [amount, setAmount] = useState("");
  
  // Payout state
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollStatus, setPollStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [pollingOrderId, setPollingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/admin-payout?email=${encodeURIComponent(email)}`)
      .then(res => {
        if (res.status === 401) {
          setUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setBalanceUsdc(data.balanceUsdc || 0);
          setIndicativeRate(data.indicativeRate || 130);
          setPhone(data.phone || "");
          setNetwork(data.network || "");
          if (data.minAmount) setMinAmount(data.minAmount);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setUnauthorized(true);
        setLoading(false);
      });
  }, [email]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (pollStatus === "pending" && pollingOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/elementpay/status?order_id=${pollingOrderId}`);
          const data = await res.json();
          if (data && data.data) {
            const status = data.data.status?.toLowerCase();
            if (["successful", "completed", "success", "paid"].includes(status)) {
              setPollStatus("success");
              setPaying(false);
            } else if (["failed", "cancelled", "canceled"].includes(status)) {
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
    return () => clearInterval(intervalId);
  }, [pollStatus, pollingOrderId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-black text-brand-black">404</h1>
        <p className="mt-4 text-lg font-medium text-muted">Page not found</p>
        <button onClick={() => router.push("/")} className="mt-8 rounded-full bg-brand-green px-6 py-3 font-bold text-white transition hover:bg-brand-green-dark">
          Return Home
        </button>
      </div>
    );
  }

  const parsedAmount = parseFloat(amount) || 0;
  const usdcAmount = inputType === "USDC" ? parsedAmount : parsedAmount / indicativeRate;
  const kesAmount = inputType === "KES" ? parsedAmount : parsedAmount * indicativeRate;

  const isFormValid = parsedAmount > 0 && kesAmount >= minAmount && usdcAmount <= balanceUsdc && !!phone;

  const handleWithdraw = async () => {
    if (!isFormValid) return;
    setPaying(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amountUsdc: usdcAmount.toFixed(6),
          phone,
          providerId: network
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payout failed");

      if (data.order?.order_id) {
        setPollingOrderId(data.order.order_id);
        setPollStatus("pending");
      } else {
        setPollStatus("success");
        setPaying(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <header className="mb-6 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-brand-gray/30 transition">
            <ArrowLeft className="w-6 h-6 text-brand-black" />
          </button>
          <h1 className="text-2xl font-extrabold text-brand-black">Admin Payout</h1>
        </header>

      {/* Treasury Card */}
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-brand-black to-gray-900 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
        <div className="flex items-center gap-2 text-white/70 mb-2">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide">TREASURY BALANCE</span>
        </div>
        <div className="flex items-end gap-3">
          <h2 className="text-4xl font-black">${balanceUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <span className="text-brand-green font-bold mb-1">USDC</span>
        </div>
        <div className="mt-2 text-sm font-medium text-white/50">
          ≈ {(balanceUsdc * indicativeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} KES
        </div>
      </div>

      {pollStatus === "success" ? (
         <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
           <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/20">
             <CheckCircle2 className="h-10 w-10 text-brand-green" />
           </div>
           <h3 className="text-2xl font-black text-brand-black">Payout Successful!</h3>
           <p className="mt-3 text-muted">
             {usdcAmount.toFixed(2)} USDC has been sent to {phone}. It should reflect in your M-Pesa shortly.
           </p>
           <button
             onClick={() => {
               setAmount("");
               setPollStatus(null);
               setPollingOrderId(null);
             }}
             className="mt-8 w-full rounded-full bg-brand-black px-6 py-4 font-bold text-white transition hover:bg-gray-800"
           >
             Make Another Payout
           </button>
         </div>
      ) : (
        <div className="space-y-6">
          {/* Amount Input */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-brand-black">You Send</label>
              <button 
                onClick={() => {
                  setInputType(t => t === "USDC" ? "KES" : "USDC");
                  setAmount("");
                }}
                className="flex items-center gap-1.5 rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-bold text-brand-black transition hover:bg-brand-yellow/40"
              >
                <ArrowRightLeft className="w-3 h-3" />
                Switch to {inputType === "USDC" ? "KES" : "USDC"}
              </button>
            </div>
            
            <div className="flex items-center relative">
              <span className="absolute left-4 text-2xl font-black text-brand-black">
                {inputType === "USDC" ? "$" : "KSh"}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={paying || pollStatus === "pending"}
                className={`w-full rounded-2xl border-none bg-brand-gray/30 py-4 pr-4 text-3xl font-black text-brand-black outline-none focus:ring-2 focus:ring-brand-green ${inputType === "USDC" ? "pl-10" : "pl-[4.5rem]"}`}
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center px-1 text-sm font-medium">
              <span className="text-muted">Equivalent to</span>
              <span className="font-bold text-brand-black">
                {inputType === "USDC" 
                  ? `${kesAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} KES` 
                  : `${usdcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
              </span>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-brand-black">Recipient Details</h3>
            
            <div className="flex items-center justify-between rounded-xl bg-brand-gray/30 p-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Mobile Money Number</p>
                <p className="font-black text-brand-black">{phone || "Not Set"}</p>
              </div>
              <img src="/images/mpesa.png" alt="M-Pesa" className="h-10 object-contain" />
            </div>
            
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Exchange Rate</span>
                <span className="text-sm font-bold text-brand-black">1 USDC = {indicativeRate} KES</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Minimum Amount</span>
                <span className="text-sm font-bold text-brand-black">{minAmount} KES</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{errorMsg}</p>
            </div>
          )}

          {usdcAmount > balanceUsdc && (
             <div className="flex items-start gap-3 rounded-2xl bg-brand-yellow/20 p-4 text-brand-black">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-yellow" />
             <p className="text-sm font-bold">Insufficient treasury balance. You only have {balanceUsdc.toFixed(2)} USDC available.</p>
           </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={!isFormValid || paying || pollStatus === "pending"}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-4 text-center font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pollStatus === "pending" || paying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Payout...
              </>
            ) : !parsedAmount ? (
              "Enter an amount"
            ) : usdcAmount > balanceUsdc ? (
              "Insufficient Funds"
            ) : (
              `Send ${kesAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} KES`
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
