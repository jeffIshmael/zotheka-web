"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowDownToLine, Globe2, ArrowUpFromLine, CreditCard, Banknote } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background px-4 py-4">
        <Link
          href="/app/account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-5 w-5 text-brand-black" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-black">About Zotheka</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-surface p-6 text-sm text-brand-black/80">

          {/* Logo */}
          <div className="flex justify-center pb-6 border-b border-border">
            <div className="flex h-20 w-20 items-center justify-center rounded-md">
              <Image
                src="/images/icon.png"
                alt="Zotheka Logo"
                width={56}
                height={56}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Mission */}
          <section className="pt-6">
            <h2 className="mb-3 text-lg font-bold text-brand-black">Your Global Financial Passport</h2>
            <p className="leading-relaxed text-muted">
              At Zotheka, our mission is to make global finance completely accessible and effortless for
              everyday Malawians. We act as your secure bridge, connecting your local mobile money directly
              to the wider global economy without the usual friction or delays.
            </p>
          </section>

          {/* Features */}
          <section className="mt-6 pt-6 border-t border-border">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted">
              With your Zotheka account, you can
            </p>

            <div className="divide-y divide-border">
              <div className="flex gap-3 pb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Fund Your Account Seamlessly</h3>
                  <p className="leading-relaxed text-muted">
                    Fund your Zotheka wallet with USD by depositing directly from your local MWK mobile
                    money (Airtel or TNM Mpamba) — nearly instant, no banking queues.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Access Global Services</h3>
                  <p className="leading-relaxed text-muted">
                    Use your wallet balance to instantly purchase global gift cards, unlocking payment for
                    international apps, services, and online shopping.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <ArrowUpFromLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Withdraw Locally on Demand</h3>
                  <p className="leading-relaxed text-muted">
                    Cash out your USD balance straight back to your MWK mobile money wallet within seconds,
                    any time you need it.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-black/5 text-brand-black/60">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-brand-black">Get a Virtual Card</h3>
                    <span className="rounded-full bg-brand-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Coming Soon
                    </span>
                  </div>
                  <p className="leading-relaxed text-muted">
                    Generate your own virtual debit card, top it up from your balance, and pay for global
                    subscriptions securely anywhere online.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-black/5 text-brand-black/60">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-brand-black">Deposit USD & EUR</h3>
                    <span className="rounded-full bg-brand-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Coming Soon
                    </span>
                  </div>
                  <p className="leading-relaxed text-muted">
                    Add foreign currencies (USD & EUR) directly into your Zotheka wallet, expanding your
                    options for international funds.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 pt-6 text-center border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}