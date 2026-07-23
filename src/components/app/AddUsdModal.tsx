"use client";

import { useEffect, useState } from "react";

type Props = {
  visible: boolean;
  email: string | null;
  phone: string | null;
  network: string | null;
  walletAddress: string | undefined;
  rate: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddUsdModal({ visible, email, phone, network, walletAddress, rate, onClose, onSuccess }: Props) {
  const [mwkAmount, setMwkAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState<number>(2000); // Default fallback

  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<"pending" | "success" | "failed" | null>(null);

  const isMalawi = phone?.startsWith("+265");

  useEffect(() => {
    if (visible && network) {
      // Fetch catalog info to get the dynamic min_amount for the user's network
      fetch("/api/elementpay/info?order_type=OnRamp")
        .then(res => res.json())
        .then(data => {
          if (data && data.providers && Array.isArray(data.providers)) {
            // Find the provider that matches the user's network (using old UUIDs or new labels)
            const provider = data.providers.find((p: any) => 
              p.id === network || 
              (network === "airtel" && p.name?.toLowerCase().includes("airtel")) ||
              (network === "tnm" && p.name?.toLowerCase().includes("tnm"))
            );
            
            if (provider && provider.min_amount) {
              setMinAmount(Number(provider.min_amount));
            }
          }
        })
        .catch(err => console.error("Failed to fetch provider min amount", err));
    }
  }, [visible, network]);


  useEffect(() => {
    if (!visible) {
      setMwkAmount("");
      setError(null);
      setOrderId(null);
      setPollStatus(null);
    }
  }, [visible]);

  // When amount changes, clear quote & polling state
  useEffect(() => {
    setError(null);
    setOrderId(null);
    setPollStatus(null);
  }, [mwkAmount]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pollStatus === "pending" && orderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/elementpay/status?order_id=${orderId}`);
          const data = await res.json();
          
          if (data && data.data) {
            const status = data.data.status?.toLowerCase();
            
            if (status === "successful" || status === "completed" || status === "success") {
              setPollStatus("success");
              setTimeout(() => {
                onSuccess();
              }, 2000); // Wait 2s to show success message before closing
            } else if (status === "failed" || status === "cancelled" || status === "canceled") {
              setPollStatus("failed");
              setError(`Transaction failed: ${data.data.reason || "Unknown reason"}`);
            }
            // If pending/processing, it will just poll again
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollStatus, orderId, onSuccess]);

  const handleGetQuote = async () => {
    if (!mwkAmount || mwkAmount < minAmount) return;
    if (!phone) {
      setError("No phone number registered with KYC");
      return;
    }
    if (!network) {
      setError("No mobile network registered with KYC");
      return;
    }
    if (!walletAddress) {
      setError("No wallet connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/elementpay/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          amount: Number(mwkAmount),
          providerId: network, // Now uses the KYC network UUID
          walletAddress: walletAddress
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process via ElementPay");
      
      if (data.order?.order_id) {
        setOrderId(data.order.order_id);
        setPollStatus("pending");
      } else {
        // Fallback if no order ID is returned
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-extrabold">Buy USD with MWK</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          <p className="mb-2 text-sm font-semibold text-muted">Phone number</p>
          <div className="mb-4 flex h-12 w-full overflow-hidden rounded-xl border border-border bg-background opacity-70">
            <input
              type="text"
              value={phone || "No phone found"}
              disabled
              className="flex-1 bg-transparent px-4 text-base font-semibold outline-none text-brand-black"
            />
          </div>
          <p className="text-[11px] text-muted -mt-2 mb-4">Phone number and network are locked to your KYC profile.</p>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-muted">Amount to pay (MWK)</p>
            <p className="text-xs font-semibold text-brand-green">1 USD ≈ {rate.toLocaleString()} MWK</p>
          </div>
          <div className="mb-4 flex h-16 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 ring-brand-green">
            <div className="flex items-center justify-center bg-muted/10 px-4 text-sm font-bold text-muted">
              MWK
            </div>
            <input
              type="number"
              value={mwkAmount}
              onChange={(e) => setMwkAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              disabled={loading || pollStatus === "pending"}
              className="flex-1 bg-transparent px-3 text-2xl font-black outline-none text-brand-black disabled:opacity-50"
            />
          </div>
          
          {typeof mwkAmount === "number" && mwkAmount < minAmount && (
            <p className="text-xs text-red-500 font-semibold mb-4 -mt-2">Minimum amount is {minAmount.toLocaleString()} MWK</p>
          )}

          {error && <p className="mb-4 text-sm text-red-500 font-semibold">{error}</p>}
          
          {!isMalawi ? (
            <div className="mt-4 text-center">
              <p className="mb-2 text-xs font-semibold text-red-500">
                Depositing USD is currently limited to Malawi users (+265).
              </p>
              <button
                type="button"
                disabled
                className="h-[52px] w-full rounded-xl bg-border text-base font-bold text-muted"
              >
                Unavailable
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading || !mwkAmount || mwkAmount < minAmount || pollStatus === "pending" || pollStatus === "success"}
              onClick={handleGetQuote}
              className={`mt-2 h-[52px] w-full rounded-xl text-base font-bold transition-all ${
                (!loading && mwkAmount && mwkAmount >= minAmount && !pollStatus)
                  ? "bg-brand-green text-white hover:bg-brand-green-dark"
                  : pollStatus === "success"
                  ? "bg-brand-green text-white"
                  : "bg-border text-brand-black/40"
              }`}
            >
              {pollStatus === "success" ? (
                "Payment Successful! ✓"
              ) : pollStatus === "pending" ? (
                <span className="flex items-center justify-center gap-2 animate-pulse">
                  <span className="h-4 w-4 rounded-full border-2 border-brand-black/40 border-t-brand-black animate-spin" />
                  Prompt sent, waiting for approval...
                </span>
              ) : loading ? (
                "Processing ..."
              ) : (
                `Buy ~ $${((Number(mwkAmount) || 0) / rate).toFixed(2)}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
