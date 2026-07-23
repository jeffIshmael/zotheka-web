"use client";

import Image from "next/image";
import Link from "next/link";
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
  kycVerified?: boolean | null;
  kycPhone?: string | null;
};

export function BuyGiftCardModal({ visible, product, rate, onClose, onBuy, paying = false, kycVerified, kycPhone }: Props) {
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
  const isMalawi = kycVerified && kycPhone?.startsWith("+265");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-extrabold text-brand-black">Checkout</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          <div className="mb-4 rounded-xl bg-background p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white"
                style={{ backgroundColor: product.accent }}
              >
                {product.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-brand-black">{product.name} gift card</p>
                <p className="text-lg font-extrabold" style={{ color: product.accent }}>
                  ${product.usdAmount} USD
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold text-brand-green-dark">
                  1 USD ≈ {rate.toLocaleString()} MWK
                </p>
                <p className="text-sm font-semibold text-muted">{unitMwk.toLocaleString()} MWK each</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold text-muted">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-35"
                >
                  −
                </button>
                <span className="min-w-[20px] text-center font-bold text-brand-black">{quantity}</span>
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
          <div className="mb-4 flex h-12 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 ring-brand-green">
            <div className="flex items-center justify-center border-r border-border bg-muted/10 px-4 text-base font-bold text-muted">
              +265
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="991234567"
              disabled={paying}
              className="flex-1 bg-transparent px-3 text-base font-semibold outline-none"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-muted">Total</span>
            <span className="text-2xl font-extrabold text-brand-black">{totalMwk.toLocaleString()} MWK</span>
          </div>

          {kycVerified === false ? (
            <Link
              href="/app/kyc"
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow/10 text-base font-bold text-brand-yellow transition hover:bg-brand-yellow/20"
            >
              🔒 Verify Account to Buy
            </Link>
          ) : !isMalawi ? (
            <div className="mt-4 text-center">
              <p className="mb-2 text-xs font-semibold text-red-500">
                Purchasing gift cards is currently limited to Malawi users (+265).
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
              disabled={!canPay || paying}
              onClick={() => void onBuy({ quantity, network, phone: `+265${phone.trim().replace(/^(\+?265|0)/, "")}` })}
              className={`mt-4 h-[52px] w-full rounded-xl text-base font-bold transition ${
                canPay && !paying
                  ? "bg-brand-green text-white hover:bg-brand-green-dark"
                  : "bg-border text-muted"
              }`}
            >
              {paying ? "Processing…" : canPay ? `Pay (${totalMwk.toLocaleString()} MWK)` : "Pay"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}