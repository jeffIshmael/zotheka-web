"use client";

import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth";
import { getMonitor } from "./api";
import { resolveUsdToMwkRate } from "./config";

type AppDataContextValue = {
  kycVerified: boolean | null;
  kycPhone: string | null;
  kycNetwork: string | null;
  rate: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { email } = useAuth();
  
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycPhone, setKycPhone] = useState<string | null>(null);
  const [kycNetwork, setKycNetwork] = useState<string | null>(null);
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
          .catch(() => ({ verified: false, phone: null, network: null })),
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
      setKycPhone(kycRes.phone || null);
      setKycNetwork(kycRes.network || null);
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
    <AppDataContext.Provider value={{ kycVerified, kycPhone, kycNetwork, rate, loading, refresh }}>
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
