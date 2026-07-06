import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-base font-extrabold text-white shadow-lg shadow-brand-green/30">
            Z
          </span>
          <span className="text-base font-extrabold tracking-tight text-white">Zotheka</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-white/50 md:flex">
          <a href="/#problem" className="transition hover:text-white">The problem</a>
          <a href="/#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="/#voices" className="transition hover:text-white">Real voices</a>
          <Link href="/about" className="transition hover:text-white">About</Link>
        </nav>

        <Link
          href="/app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-green/40 transition hover:bg-brand-green-dark"
        >
          Launch web app →
        </Link>
      </div>
    </header>
  );
}