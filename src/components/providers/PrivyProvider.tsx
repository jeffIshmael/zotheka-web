"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { ReactNode } from "react";
import { base } from "viem/chains";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@/lib/privy-config";

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: base,
        supportedChains: [base],
        loginMethods: ["email", "google"],
        appearance: {
          theme: "light",
          accentColor: "#007A33",
        },
        embeddedWallets: {
          createOnLogin: "off",
        },
      }}
    >
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </BasePrivyProvider>
  );
}
