import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/images/icon.png" alt="Zotheka Logo" className="h-9 w-9 rounded-md object-contain" />
          <span className="text-base text-2xl font-extrabold tracking-tight text-white">Zotheka</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-white/50 md:flex">
          <a href="/#problem" className="transition hover:text-white">The problem</a>
          <a href="/#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="/#voices" className="transition hover:text-white">Real voices</a>
          <Link href="/about" className="transition hover:text-white">About</Link>
        </nav>

        <Link
          href="/app"
          className="flex items-center gap-1.5 rounded-full bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-green/40 transition hover:bg-brand-green-dark"
        >
          Launch MVP web app
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </Link>
      </div>
    </header>
  );
}