export type SavedPurchase = {
  id: string;
  usdAmount: number;
  mwk: number;
  status: "delivered" | "pending";
  code: string;
  date: string;
  productName: string;
};

const PURCHASES_KEY = "zotheka_web_purchases";

export function getSavedPurchases(): SavedPurchase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPurchase[];
  } catch {
    return [];
  }
}

export function savePurchase(purchase: SavedPurchase): void {
  const existing = getSavedPurchases();
  existing.unshift(purchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(existing));
}
