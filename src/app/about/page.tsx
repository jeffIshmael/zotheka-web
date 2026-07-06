import Link from "next/link";
import { ABOUT_SECTIONS, TWO_PILLARS } from "@/lib/landing-content";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export const metadata = {
  title: "About Zotheka",
  description:
    "Zotheka helps Malawians buy global services with Kwacha and receive USD from platforms like Fiverr and Upwork, then withdraw to mobile money.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased">
      <LandingNav />

      <section className="relative overflow-hidden border-b border-white/6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-brand-green/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green">About</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Two ways Zotheka moves money for Malawi
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/60">
            Zotheka connects Malawian Kwacha and US dollars to the global digital economy, whether
            you are paying for Netflix with mobile money or cashing out a Fiverr payout to Kwacha.
          </p>
        </div>
      </section>

      <section className="border-b border-white/6 bg-[#0C0C0C]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {TWO_PILLARS.map((pillar) => (
              <article
                key={pillar.id}
                className="rounded-2xl border border-white/6 bg-white/3 p-8"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-brand-green">
                  {pillar.label}
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{pillar.title}</h2>
                <p className="mt-4 leading-relaxed text-white/55">{pillar.summary}</p>
                <ol className="mt-6 space-y-3">
                  {pillar.steps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/70">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-xs font-bold text-brand-green">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {pillar.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808]">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="space-y-12">
            {ABOUT_SECTIONS.map((section) => (
              <article key={section.heading}>
                <h2 className="text-xl font-extrabold tracking-tight">{section.heading}</h2>
                <p className="mt-3 leading-relaxed text-white/55">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap gap-3">
            <Link
              href="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand-green px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
            >
              Try the web app
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/12 px-7 py-3.5 text-sm font-bold text-white/70 transition hover:border-white/25 hover:text-white"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
