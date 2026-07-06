import Link from "next/link";
import { PROBLEM_POINTS, TWO_PILLARS } from "@/lib/landing-content";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { RedditAttestations } from "@/components/landing/RedditAttestations";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased">
      <LandingNav />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#0A0A0A]">
        {/*
          Signature element: horizontal flag-stripe atmosphere.
          Three bands (black already is bg), red, green — ultra-low opacity,
          heavily blurred — evoking the Malawi flag without being literal.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg,
                transparent 0%,
                transparent 42%,
                rgba(200,16,46,0.09) 42%,
                rgba(200,16,46,0.09) 68%,
                rgba(0,122,51,0.12) 68%,
                rgba(0,122,51,0.12) 100%
              )
            `,
          }}
        />
        {/* Rising-sun arc echo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2"
          style={{
            width: 640,
            height: 320,
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(200,16,46,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-brand-green/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-36">
          {/* Eyebrow */}
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70">
            🇲🇼 Built for Malawi
          </p>

          <div className="max-w-4xl">
            <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tighter sm:text-6xl lg:text-7xl">
              Pay for Netflix, Spotify
              <br />
              <span className="text-brand-green">&amp; more</span>
              <br />
              with your mobile money.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
              Zotheka does two things for Malawi: buy global services like Netflix and Spotify
              using Malawian Kwacha on mobile money, and receive US dollars from platforms like
              Fiverr or Upwork into your wallet, then convert to Kwacha when you need it.
            </p>
          </div>

          {/* Live rate strip */}
          {/* <div className="mt-10 inline-flex items-center gap-6 rounded-2xl border border-white/8 bg-white/4 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-green" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Live rate</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <p className="font-extrabold text-white tracking-tight">
              1 USD <span className="text-white/40 font-normal mx-1">≈</span> 1,734 MWK
            </p>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/30">vs parallel</span>
                <span className="text-xs font-bold text-brand-red">4,000+ MWK</span>
              </div>
            </div>
          </div> */}

          {/* Brand pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2 mt-6">
            <span className="text-xs text-white/30 mr-1">Works with</span>
            {["🎬 Netflix", "🎵 Spotify", "🎮 Google Play", "🛒 Amazon", "🎁 iTunes"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand-green px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
            >
              Try the web app
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/12 px-7 py-3.5 text-sm font-bold text-white/70 transition hover:border-white/25 hover:text-white"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section id="problem" className="relative border-t border-white/6 bg-[#0C0C0C]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red">The problem</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Malawi is online, but global payments aren&apos;t
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
            Millions of Malawians use mobile money every day, but paying for Netflix with Kwacha
            or receiving a Fiverr payout in USD still means foreign cards, forex queues, and weeks
            of waiting.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PROBLEM_POINTS.map((point) => (
              <article
                key={point.title}
                className="group rounded-2xl border border-white/6 bg-white/3 p-6 transition hover:border-brand-red/30 hover:bg-brand-red/5"
              >
                <div className="mb-4 h-0.5 w-8 rounded-full bg-brand-red" />
                <h3 className="text-base font-bold text-white">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{point.body}</p>
              </article>
            ))}
          </div>

          {/* Rate gap callout */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-brand-red/20 bg-brand-red/8">
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red">The rate gap</p>
              <div className="mt-5 flex flex-wrap gap-10">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">~MK 1,700</p>
                  <p className="mt-1 text-xs text-white/40">Official USD rate</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-2 text-white/20">vs</div>
                  <div>
                    <p className="text-3xl font-extrabold tracking-tight text-brand-red">~MK 4,000+</p>
                    <p className="mt-1 text-xs text-white/40">Parallel market (when available)</p>
                  </div>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/40">
                When dollars are scarce, everyday digital purchases (a Netflix subscription, a
                Steam game, an Upwork payout) become a multi-week ordeal.
              </p>
            </div>
            {/* flag-stripe bottom accent */}
            <div className="flex h-1.5">
              <div className="flex-1 bg-[#0A0A0A]" />
              <div className="flex-1 bg-brand-red/60" />
              <div className="flex-1 bg-brand-green/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reddit voices ─── */}
      <section id="voices" className="border-y border-white/6 bg-[#080808]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Real voices</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Malawians talking about the problem
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/50">
            Real discussions from r/Malawi: forex shortages, bank delays, and the struggle to pay
            for or receive money from abroad. We&apos;re not inventing the problem.
          </p>
          <div className="mt-12">
            <RedditAttestations />
          </div>
        </div>
      </section>

      {/* ─── How it works (two pillars) ─── */}
      <section id="how-it-works" className="border-t border-white/6 bg-[#0C0C0C]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green">How it works</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Two ways to use Zotheka
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/50">
            Whether you are subscribing to Netflix or getting paid on Fiverr, Zotheka bridges
            Malawian Kwacha and US dollars to the services you already use.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {TWO_PILLARS.map((pillar) => (
              <article
                key={pillar.id}
                className="group relative rounded-2xl border border-white/6 bg-white/3 p-8 transition hover:border-brand-green/30 hover:bg-brand-green/5"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-brand-green">
                  {pillar.label}
                </p>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{pillar.summary}</p>
                <ol className="mt-6 space-y-2.5">
                  {pillar.steps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm text-white/65">
                      <span className="font-bold text-brand-green">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {pillar.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/55"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-white/40">
            <Link href="/about" className="font-semibold text-brand-green hover:underline">
              Learn more about Zotheka →
            </Link>
          </p>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="border-t border-white/6 bg-[#0C0C0C]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-green">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgba(200,16,46,0.6) 0%, transparent 60%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-black/20 blur-2xl"
            />
            <div className="relative flex flex-col gap-8 px-8 py-10 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  🇲🇼 Made in Malawi, for Malawi
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Ready to see it work?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Try both flows in our web demo: buy a Netflix gift card with MWK mobile money,
                  simulate a Fiverr USD payout, or withdraw to Kwacha.
                </p>
              </div>
              <Link
                href="/app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-brand-green-dark shadow-lg transition hover:bg-brand-green-light"
              >
                Launch web app →
              </Link>
            </div>
            {/* flag stripe footer accent */}
            <div className="flex h-1">
              <div className="flex-1 bg-black/30" />
              <div className="flex-1 bg-brand-red/50" />
              <div className="flex-1 bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}