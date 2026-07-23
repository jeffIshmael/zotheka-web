"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { MOBILE_MAX_WIDTH, MobileShell } from "@/components/app/MobileShell";
import { PrivyProvider } from "@/components/providers/PrivyProvider";
import { AuthProvider, useAuth } from "@/lib/auth";

import { AppDataProvider, useAppData } from "@/lib/app-data";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: HomeIcon },
  { href: "/app/purchases", label: "My purchases", icon: BagIcon },
  { href: "/app/history", label: "History", icon: ClockIcon },
  { href: "/app/account", label: "Account", icon: UserIcon },
];

function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { kycVerified } = useAppData();

  const isSignIn = pathname === "/app/sign-in";
  const isKyc = pathname === "/app/kyc";
  const isAbout = pathname === "/app/about";
  const isTerms = pathname === "/app/terms";
  const isPrivacy = pathname === "/app/privacy";
  const showNav = !isSignIn && !isKyc && !isAbout && !isTerms && !isPrivacy;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isSignIn) {
      router.replace("/app/sign-in");
    }
  }, [isAuthenticated, isLoading, isSignIn, router]);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      </MobileShell>
    );
  }

  if (!isAuthenticated && !isSignIn) {
    return null;
  }

  return (
    <MobileShell>
      <div className="relative flex min-h-screen flex-col">
        <main className={`flex-1 ${showNav ? "pb-24" : ""}`}>{children}</main>

        {showNav && (
          <nav
            className="fixed bottom-0 left-1/2 z-40 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]"
            style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
          >
            <div className="flex">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/app" ? pathname === "/app" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                      active ? "text-brand-green" : "text-muted"
                    }`}
                  >
                    <Icon active={active} showBadge={href === "/app/account" && kycVerified === false} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </MobileShell>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <AuthProvider>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </AuthProvider>
    </PrivyProvider>
  );
}

function HomeIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}

function BagIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M6 7h12l-1 14H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ClockIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UserIcon({ active, showBadge }: { active: boolean; showBadge?: boolean }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-yellow border border-surface" />
      )}
    </div>
  );
}

function PlusIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
