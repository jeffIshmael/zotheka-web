"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "When you use Zotheka, we collect personal information necessary for providing our services and fulfilling our regulatory obligations. This includes your name, email address, phone number, date of birth, and identity documents (such as National ID and selfies) for KYC processing.",
  },
  {
    title: "How We Use Your Data",
    body: "We use your information to:",
    list: [
      "Verify your identity in compliance with AML/KYC regulations.",
      "Facilitate transactions via our partners (e.g., ElementPay).",
      "Provide customer support and resolve disputes.",
      "Improve the security and performance of our platform.",
    ],
  },
  {
    title: "Data Sharing & Security",
    body: "We do not sell your personal data. Your information is securely stored and only shared with trusted third parties (such as ElementPay) strictly for the purpose of executing your transactions and verifying your identity.",
  },
  {
    title: "Your Rights",
    body: "You have the right to request access to, correction, or deletion of your personal data. Note that certain data may need to be retained for a mandatory period to comply with local financial regulations.",
  },
];

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
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-muted">
            We collect only what's needed to verify you and keep your account secure.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 text-sm text-brand-black/80">
          <div className="divide-y divide-border">
            {SECTIONS.map((section, i) => (
              <section key={section.title} className={i === 0 ? "pb-6" : "py-6"}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-[11px] font-extrabold text-brand-green">
                    {i + 1}
                  </span>
                  <h2 className="text-base font-bold text-brand-black">{section.title}</h2>
                </div>
                <p className="leading-relaxed text-muted pl-8">{section.body}</p>
                {section.list && (
                  <ul className="mt-2 list-disc space-y-1 pl-12 text-muted">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="pt-6 mt-6 border-t border-border text-xs font-semibold text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}