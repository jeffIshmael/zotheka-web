"use client";

import { usePrivy } from "@privy-io/react-auth";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { getUserEmail } from "@/lib/user-email";

type AuthContextValue = {
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, ready, authenticated, logout } = usePrivy();

  const value = useMemo(
    () => ({
      email: getUserEmail(user) ?? null,
      isAuthenticated: authenticated,
      isLoading: !ready,
      signOut: logout,
    }),
    [user, ready, authenticated, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
