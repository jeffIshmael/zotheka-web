"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background px-4 py-4">
        <Link
          href="/app/account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-5 w-5 text-brand-black" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-black">Privacy Policy</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-surface p-6 space-y-6 text-sm text-brand-black/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">1. Information We Collect</h2>
            <p>
              When you use Zotheka, we collect personal information necessary for providing our services and fulfilling our regulatory obligations. This includes your name, email address, phone number, date of birth, and identity documents (such as National ID and selfies) for KYC processing.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">2. How We Use Your Data</h2>
            <p>
              We use your information to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Verify your identity in compliance with AML/KYC regulations.</li>
              <li>Facilitate transactions via our partners (e.g., ElementPay).</li>
              <li>Provide customer support and resolve disputes.</li>
              <li>Improve the security and performance of our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">3. Data Sharing & Security</h2>
            <p>
              We do not sell your personal data. Your information is securely stored and only shared with trusted third parties (such as ElementPay) strictly for the purpose of executing your transactions and verifying your identity.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-brand-black">4. Your Rights</h2>
            <p>
              You have the right to request access to, correction, or deletion of your personal data. Note that certain data may need to be retained for a mandatory period to comply with local financial regulations.
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
