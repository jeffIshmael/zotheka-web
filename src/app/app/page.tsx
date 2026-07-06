"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BackendRequestError, buyGiftCard, getMonitor, makeChargeId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { resolveUsdToMwkRate, usdToMwk } from "@/lib/config";
import { GIFT_CARDS } from "@/data/gift-cards";
import { savePurchase } from "@/lib/storage";
import { BuyGiftCardModal } from "@/components/app/BuyGiftCardModal";

export default function HomePage() {
  const netflix = GIFT_CARDS[0];
  const { email } = useAuth();
  const [rate, setRate] = useState(1700);
  const [buyOpen, setBuyOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ code: string; amount: number } | null>(null);

  const unitMwk = usdToMwk(netflix.usdAmount, rate);

  useEffect(() => {
    getMonitor()
      .then((m) => setRate(resolveUsdToMwkRate(m.usd_to_mwk_rate)))
      .catch(() => undefined);
  }, []);

  const handleBuy = useCallback(
    async (payload: { quantity: number; phone: string }) => {
      if (!email) return;

      const totalMwk = unitMwk * payload.quantity;
      setPaying(true);

      try {
        const result = await buyGiftCard({
          phone: payload.phone,
          amount: totalMwk,
          charge_id: makeChargeId("buy"),
          email,
          name: email.split("@")[0] || "Zotheka User",
        });

        if (result.status !== "success") {
          alert(result.message);
          return;
        }

        const purchaseDate = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        savePurchase({
          id: result.charge_id,
          usdAmount: netflix.usdAmount * payload.quantity,
          mwk: totalMwk,
          status: "delivered",
          code: result.code,
          date: purchaseDate,
          productName: netflix.name,
        });

        setBuyOpen(false);
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
    [email, netflix, unitMwk]
  );

  return (
    <div className="px-4 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Hello 👋</p>
          <h1 className="text-2xl font-extrabold">Pay globally</h1>
        </div>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-brand-green-light p-6">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-brand-red" />
        <p className="text-[11px] font-bold tracking-widest text-brand-green-dark">ZOTHEKA</p>
        <h2 className="mt-1 text-lg font-bold">Global payments without a foreign card</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Pay in MWK.
        </p>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Gift cards</h2>
        <span className="text-sm text-muted">Prices in MWK</span>
      </div>

      <button
        type="button"
        onClick={() => setBuyOpen(true)}
        className="w-full overflow-hidden rounded-2xl bg-surface text-left shadow-card transition hover:opacity-95"
      >
        <div className="relative flex h-[152px] items-stretch bg-black">
          <div className="z-10 flex flex-col justify-between p-4">
            <p className="text-lg font-extrabold text-white">Netflix Gift Card</p>
            <p className="text-3xl font-extrabold text-netflix">${netflix.usdAmount} USD</p>
            <p className="text-xs font-semibold text-netflix">Redeem at netflix.com/redeem</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-[62%] overflow-hidden">
            <Image
              src="/images/netflix-black.jpg"
              alt="Netflix"
              width={280}
              height={380}
              className="absolute -right-16 top-1/2 h-[380px] w-[280px] -translate-y-1/2 object-contain"
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <div>
            <p className="text-xs text-muted">You pay</p>
            <p className="text-2xl font-extrabold">MK {unitMwk.toLocaleString()}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-netflix px-4 py-2.5 text-sm font-bold text-white">
            Buy →
          </span>
        </div>
      </button>

      <BuyGiftCardModal
        visible={buyOpen}
        product={netflix}
        rate={rate}
        onClose={() => !paying && setBuyOpen(false)}
        onBuy={handleBuy}
        paying={paying}
      />

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-[430px] rounded-2xl bg-surface p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-2xl text-brand-green">
              ✓
            </div>
            <h3 className="mt-4 text-xl font-extrabold">Payment confirmed</h3>
            <p className="mt-2 text-sm text-muted">
              MK {success.amount.toLocaleString()} paid. Your Netflix code:
            </p>
            <p className="mt-3 text-lg font-extrabold tracking-wide text-brand-green-dark">
              {success.code}
            </p>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-6 rounded-xl bg-brand-green px-8 py-3 text-sm font-bold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
