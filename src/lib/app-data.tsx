"use client";

import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth";
import { getMonitor } from "./api";
import { resolveUsdToMwkRate } from "./config";

type AppDataContextValue = {
  kycVerified: boolean | null;
  kycFirstName: string | null;
  kycPhone: string | null;
  kycNetwork: string | null;
  kycWalletAddress: string | null;
  rate: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { email } = useAuth();
  
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycFirstName, setKycFirstName] = useState<string | null>(null);
  const [kycPhone, setKycPhone] = useState<string | null>(null);
  const [kycNetwork, setKycNetwork] = useState<string | null>(null);
  const [kycWalletAddress, setKycWalletAddress] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1700);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [monitor, kycRes, elementPayInfo] = await Promise.all([
        getMonitor().catch(() => null),
        fetch(`/api/kyc/status?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .catch(() => ({ verified: false, firstName: null, phone: null, network: null, walletAddress: null })),
        fetch(`/api/elementpay/info`)
          .then(r => r.json())
          .catch(() => null)
      ]);

      if (elementPayInfo?.rate?.buy) {
        setRate(elementPayInfo.rate.buy);
      } else if (monitor) {
        setRate(resolveUsdToMwkRate(monitor.usd_to_mwk_rate));
      }

      setKycVerified(kycRes.verified);
      setKycFirstName(kycRes.firstName || null);
      setKycPhone(kycRes.phone || null);
      setKycNetwork(kycRes.network || null);
      setKycWalletAddress(kycRes.walletAddress || null);
    } catch (err) {
      console.error("Failed to load app data", err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppDataContext.Provider value={{ kycVerified, kycFirstName, kycPhone, kycNetwork, kycWalletAddress, rate, loading, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}
