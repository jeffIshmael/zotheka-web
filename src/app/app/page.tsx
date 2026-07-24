"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { BackendRequestError, buyGiftCard, makeChargeId, saveTransaction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usdToMwk } from "@/lib/config";
import { GIFT_CARDS, GiftCard } from "@/data/gift-cards";
import { BuyGiftCardModal } from "@/components/app/BuyGiftCardModal";
import { useAppData } from "@/lib/app-data";

export default function HomePage() {
  const { email } = useAuth();
  const { rate, kycVerified, kycFirstName, kycPhone, loading: dataLoading } = useAppData();
  const [selectedProduct, setSelectedProduct] = useState<GiftCard | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ code: string; amount: number } | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const handleBuy = useCallback(
    async (payload: { quantity: number; phone: string }) => {
      if (!email || !selectedProduct) return;

      const unitMwk = usdToMwk(selectedProduct.usdAmount, rate);
      const totalMwk = unitMwk * payload.quantity;
      setPaying(true);

      try {
        const result = await buyGiftCard({
          phone: payload.phone,
          amount: totalMwk,
          charge_id: makeChargeId("buy"),
          email,
          name: kycFirstName || email.split("@")[0] || "Zotheka User",
        });

        if (result.status !== "success") {
          alert(result.message);
          return;
        }

        await saveTransaction({
          email,
          type: "PURCHASE",
          amount: totalMwk,
          usdAmount: selectedProduct.usdAmount * payload.quantity,
          status: "completed",
          code: result.code,
          productName: selectedProduct.name,
          chargeId: result.charge_id,
          phone: payload.phone,
        });

        setSelectedProduct(null);
        setSuccess({ code: result.code, amount: totalMwk });
      } catch (error) {
        const message =
          error instanceof BackendRequestError
            ? error.message
            : "Could not reach the backend. Try again.";
        alert(message);
      } finally {
        setPaying(false);
      }
    },
    [email, selectedProduct, rate, kycFirstName]
  );

  const displayName = kycFirstName || (email ? email.split("@")[0] : "there");

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-green text-sm font-extrabold text-white overflow-hidden">
            <Image src="/images/icon.png" alt="Zotheka" width={36} height={36} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Zotheka</p>
            <p className="text-sm font-bold text-brand-black leading-tight">
              Hello, {displayName} 👋
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (kycVerified === false) setVerifyModalOpen(true);
          }}
          className="relative flex items-center transition hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold uppercase text-white border border-border">
            {email ? email.charAt(0) : "U"}
          </div>
          {kycVerified === false && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-[9px] font-black text-white ring-2 ring-background">
              !
            </span>
          )}
        </button>
      </header>

      {/* Promo strip */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12h18M12 3c2.5 2.7 4 6.1 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6.1-4-9s1.5-6.3 4-9z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-brand-black">Pay globally, in MWK</p>
        </div>
      </div>

      {/* Gift cards */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-brand-black">Gift cards</h2>
        <span className="text-sm text-muted">Prices in MWK</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {dataLoading ? (
          <>
            <div className="h-[140px] animate-pulse rounded-2xl bg-surface shadow-card border border-border" />
            <div className="h-[140px] animate-pulse rounded-2xl bg-surface shadow-card border border-border" />
            <div className="h-[140px] animate-pulse rounded-2xl bg-surface shadow-card border border-border" />
            <div className="h-[140px] animate-pulse rounded-2xl bg-surface shadow-card border border-border" />
          </>
        ) : (
          GIFT_CARDS.map((card) => {
            const unitMwk = usdToMwk(card.usdAmount, rate);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  if (kycVerified === false) {
                    setVerifyModalOpen(true);
                    return;
                  }
                  setSelectedProduct(card);
                }}
                className="flex flex-col justify-between overflow-hidden rounded-2xl bg-surface p-3 shadow-card transition hover:border-brand-green border border-border text-left"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-extrabold text-brand-black truncate pr-1">{card.name}</p>
                    {card.badge && (
                      <span className="rounded bg-brand-green/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-green shrink-0">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xl font-extrabold" style={{ color: card.accent }}>
                    ${card.usdAmount}
                  </p>
                  <p className="text-[10px] font-semibold text-muted mt-0.5 line-clamp-2 leading-tight">
                    {card.subtitle}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2 w-full">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted uppercase">You pay</span>
                    <span className="text-xs font-extrabold text-brand-black">{unitMwk.toLocaleString()} MWK</span>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: card.accent }}
                  >
                    Buy →
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedProduct && (
        <BuyGiftCardModal
          visible={!!selectedProduct}
          product={selectedProduct}
          rate={rate}
          kycVerified={kycVerified}
          kycPhone={kycPhone}
          onClose={() => !paying && setSelectedProduct(null)}
          onBuy={handleBuy}
          paying={paying}
        />
      )}

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-extrabold text-brand-black">Success!</h3>
            <p className="mb-6 text-sm font-medium text-muted">
              You paid {success.amount.toLocaleString()} MWK and got your gift card code.
            </p>
            <div className="mb-6 rounded-xl bg-background p-4 border border-border">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Your Code</p>
              <p className="text-xl font-mono font-bold tracking-widest text-brand-black">{success.code}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="w-full rounded-full bg-brand-black px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-brand-black"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-brand-black mb-2">Verify Account</h3>
            <p className="text-sm text-muted mb-6">
              You need to verify your identity to unlock features like adding USD and withdrawing funds.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/app/kyc"
                className="w-full rounded-full bg-brand-yellow px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-yellow/90"
              >
                Verify Now
              </Link>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="w-full rounded-full px-4 py-3 text-sm font-bold text-muted transition hover:bg-background"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}