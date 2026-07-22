"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

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
        <div className="rounded-2xl bg-surface p-6 space-y-8 text-sm text-brand-black/80">
          
          <div className="flex justify-center pt-2 pb-6 border-b border-border">
            <Image 
              src="/images/icon.png" 
              alt="Zotheka Logo" 
              width={72} 
              height={72} 
              className="rounded-2xl shadow-sm"
            />
          </div>

          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-black">Your Global Financial Passport</h2>
            <p className="mb-4 leading-relaxed">
              At Zotheka, our mission is to make global finance completely accessible and effortless for everyday Malawians. We act as your secure bridge, connecting your local mobile money directly to the wider global economy without the usual friction or delays.
            </p>
            <p className="mb-4 font-semibold text-brand-black">With your Zotheka account, you are equipped to:</p>
            
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-brand-black mb-1">Fund Your Account Seamlessly</h3>
                <p className="leading-relaxed text-muted">You can easily fund your Zotheka wallet with USD by depositing directly from your local MWK mobile money (Airtel or TNM Mpamba). The process is nearly instant and avoids the hassle of traditional banking queues.</p>
              </div>

              <div>
                <h3 className="font-bold text-brand-black mb-1">Access Global Services</h3>
                <p className="leading-relaxed text-muted">Use your wallet balance to instantly purchase global gift cards. This unlocks your ability to pay for international services, apps, and online shopping that were previously out of reach.</p>
              </div>

              <div>
                <h3 className="font-bold text-brand-black mb-1">Withdraw Locally on Demand</h3>
                <p className="leading-relaxed text-muted">Need your funds back in local currency? You can cash out your USD balance straight back to your MWK mobile money wallet within seconds, available anytime you need it.</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-brand-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Coming Soon</span>
                  <h3 className="font-bold text-brand-black">Get a Virtual Card</h3>
                </div>
                <p className="leading-relaxed text-muted">Soon, you will be able to generate your own virtual debit card. You can top it up directly from your balance and use it to securely pay for global subscriptions and services anywhere online.</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-brand-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Coming Soon</span>
                  <h3 className="font-bold text-brand-black">Deposit USD & EUR</h3>
                </div>
                <p className="leading-relaxed text-muted">We are actively working on allowing you to add foreign currencies (USD & EUR) directly into your Zotheka wallet, expanding your options for international funds.</p>
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
