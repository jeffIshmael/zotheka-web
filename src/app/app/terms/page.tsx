"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background px-4 py-4">
        <Link
          href="/app/account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-5 w-5 text-brand-black" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-black">Terms & Conditions</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-surface p-6 space-y-6 text-sm text-brand-black/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">1. Introduction</h2>
            <p>
              Welcome to Zotheka. By accessing or using our application, you agree to be bound by these Terms and Conditions and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">2. Services Provided</h2>
            <p>
              Zotheka provides a seamless digital wallet service, enabling you to fund your account with USD and withdraw back to your local currency using local mobile money providers in Malawi (Airtel and TNM Mpamba), powered securely by our partners at ElementPay.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">3. Account & KYC Registration</h2>
            <p>
              To use Zotheka's financial services, you must complete our Know Your Customer (KYC) verification process. You agree to provide accurate, current, and complete information, including a valid phone number and government-issued ID.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">4. Transactions & Fees</h2>
            <p>
              Exchange rates are provided dynamically by our partners at ElementPay and are subject to change without notice. A minimum transaction amount may apply to funding and withdrawals. Standard processing fees associated with your mobile money networks are independent of Zotheka.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">5. User Conduct</h2>
            <p>
              You agree not to use the service for any unlawful activities, money laundering, or fraud. We reserve the right to suspend or terminate accounts suspected of violating these terms.
            </p>
          </section>

          <p className="pt-4 text-xs font-semibold text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
