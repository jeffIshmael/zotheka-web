"use client";

import { useCallback, useEffect, useState } from "react";
import { getTransactions, type Transaction } from "@/lib/api";

type HistoryKind = "purchase" | "withdrawal" | "deposit";

type DisplayItem = {
  id: string;
  kind: HistoryKind;
  title: string;
  subtitle: string;
  amount: string;
  secondaryAmount?: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

function mapTransaction(txn: Transaction): DisplayItem {
  const isPurchase = txn.type === "CASH_IN";
  const isDeposit = txn.type === "USD_IN";
  const status =
    txn.status === "success" ? "completed" : txn.status === "pending" ? "pending" : "failed";

  const amountValue = Number(txn.amount);
  const formattedAmount = isDeposit
    ? `+$${amountValue.toFixed(2)}`
    : `MK ${Math.round(amountValue).toLocaleString()}`;

  return {
    id: String(txn.id),
    kind: isDeposit ? "deposit" : isPurchase ? "purchase" : "withdrawal",
    title: isDeposit ? "USD deposit" : isPurchase ? "Netflix gift card" : "MWK withdrawal",
    subtitle: txn.charge_id,
    amount: formattedAmount,
    secondaryAmount: isPurchase ? undefined : isDeposit ? txn.email : txn.phone,
    date: new Date(txn.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status,
  };
}

const STATUS_COLOR = {
  completed: "text-brand-green",
  pending: "text-amber-500",
  failed: "text-red-500",
} as const;

export default function HistoryPage() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setItems(data.transactions.map(mapTransaction));
    } catch {
      setError("Could not load history.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-extrabold">History</h1>
      <p className="mt-1 text-sm text-muted">Your previous activity on the platform.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-4xl opacity-30">🕐</p>
          <p className="mt-4 text-lg font-bold">No activity yet</p>
          <p className="mt-2 text-sm text-muted">
            {error ?? "Your gift card purchases and MWK withdrawals will show up here."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded-2xl bg-surface p-4 shadow-card">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                  item.kind === "purchase"
                    ? "bg-red-50"
                    : item.kind === "deposit"
                      ? "bg-green-50"
                      : "bg-brand-green-light"
                }`}
              >
                {item.kind === "purchase" ? "🎁" : item.kind === "deposit" ? "↑" : "↓"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{item.title}</p>
                  <p className="shrink-0 font-bold">{item.amount}</p>
                </div>
                <p className="truncate text-sm text-muted">{item.subtitle}</p>
                {item.secondaryAmount ? (
                  <p className="text-sm font-semibold text-brand-green-dark">{item.secondaryAmount}</p>
                ) : null}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted">{item.date}</span>
                  <span className={`font-semibold capitalize ${STATUS_COLOR[item.status]}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
