"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GiftCard } from "@/data/gift-cards";
import { usdToMwk } from "@/lib/config";

const MAX_QUANTITY = 10;

const NETWORKS = [
  { id: "airtel" as const, label: "Airtel Money", logo: "/images/Airtel-logo.jpg", height: 26 },
  { id: "mtn" as const, label: "TNM Mpamba", logo: "/images/mtn-yellow-logo.png", height: 30 },
];

type NetworkId = (typeof NETWORKS)[number]["id"];

type Props = {
  visible: boolean;
  product: GiftCard;
  rate: number;
  onClose: () => void;
  onBuy: (payload: { quantity: number; network: NetworkId; phone: string }) => void | Promise<void>;
  paying?: boolean;
};

export function BuyGiftCardModal({ visible, product, rate, onClose, onBuy, paying = false }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [network, setNetwork] = useState<NetworkId>("airtel");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuantity(1);
      setNetwork("airtel");
      setPhone("");
    }
  }, [visible]);

  if (!visible) return null;

  const unitMwk = usdToMwk(product.usdAmount, rate);
  const totalMwk = unitMwk * quantity;
  const canPay = phone.trim().length >= 9;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-extrabold">Checkout</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          <div className="mb-4 flex gap-4 rounded-xl bg-background p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-2xl font-black text-netflix">
              N
            </div>
            <div className="flex flex-1 justify-between gap-2">
              <div>
                <p className="font-bold">{product.name} gift card</p>
                <p className="text-lg font-extrabold">${product.usdAmount} USD</p>
                <p className="text-sm text-muted">MK {unitMwk.toLocaleString()} each</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-brand-green-dark">
                  1 USD ≈ {rate.toLocaleString()} MWK
                </p>
                <p className="mt-2 text-[11px] font-semibold text-muted">Qty</p>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-35"
                  >
                    −
                  </button>
                  <span className="min-w-[20px] text-center font-bold">{quantity}</span>
                  <button
                    type="button"
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-35"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold text-muted">Network</p>
          <div className="mb-4 flex gap-2">
            {NETWORKS.map((item) => {
              const selected = network === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNetwork(item.id)}
                  className={`flex h-12 flex-1 items-center justify-center rounded-xl border px-2 ${
                    selected ? "border-brand-green bg-brand-green-light" : "border-border bg-background"
                  }`}
                >
                  <Image
                    src={item.logo}
                    alt={item.label}
                    width={120}
                    height={item.height}
                    className="max-h-8 w-auto object-contain"
                  />
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-sm font-semibold text-muted">Phone number</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            disabled={paying}
            className="mb-4 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-semibold outline-none ring-brand-green focus:ring-2"
          />

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-muted">Total</span>
            <span className="text-2xl font-extrabold">MK {totalMwk.toLocaleString()}</span>
          </div>

          <button
            type="button"
            disabled={!canPay || paying}
            onClick={() => void onBuy({ quantity, network, phone: phone.trim() })}
            className={`mt-4 h-[52px] w-full rounded-xl text-base font-bold ${
              canPay && !paying
                ? "bg-brand-green text-white"
                : "bg-border text-muted"
            }`}
          >
            {paying ? "Processing…" : canPay ? `Pay (${totalMwk.toLocaleString()} MKW)` : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
