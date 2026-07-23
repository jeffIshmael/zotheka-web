"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getTransactions, type Transaction } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PurchasesPage() {
  const { email } = useAuth();
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const data = await getTransactions(email, "PURCHASE");
      setOrders(data.transactions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-extrabold">My purchases</h1>
      <p className="mt-1 text-sm text-muted">Gift cards bought through the app</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-4xl opacity-30">🛍</p>
          <p className="mt-4 text-lg font-bold">No purchases yet</p>
          <p className="mt-2 text-sm text-muted">
            Your gift card codes will appear here after checkout.
          </p>
          <Link href="/app" className="mt-6 inline-block text-sm font-semibold text-brand-green">
            Browse gift cards →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at || order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <li key={order.id} className="rounded-2xl bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{order.productName || "Gift"} card</p>
                    <p className="text-sm text-muted">${order.usdAmount} USD · {dateStr}</p>
                  </div>
                  <span className="rounded-full bg-brand-green-light px-2.5 py-1 text-xs font-bold text-brand-green-dark">
                    {order.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">Paid MK {Number(order.amount).toLocaleString()}</p>
                {order.code ? (
                  <p className="mt-2 rounded-lg bg-background px-3 py-2 font-mono text-sm font-bold text-brand-green-dark">
                    {order.code}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
