"use client";

import { useEffect, useState } from "react";
import { getSellerAnalyticsOverview, getWalletTransactions } from "@/lib/api-client";

export default function MyIncomePage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSellerAnalyticsOverview(), getWalletTransactions()])
      .then(([analytics, tx]) => {
        setOverview(analytics.overview || null);
        setTransactions(tx.transactions?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Finance</div>
        <h1 className="text-xl font-semibold text-gray-900">My Income</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading income data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="text-2xl font-semibold text-gray-900">{(overview?.total_revenue ?? 0).toFixed(2)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Total Orders</div>
              <div className="text-2xl font-semibold text-gray-900">{overview?.total_orders ?? 0}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Items Sold</div>
              <div className="text-2xl font-semibold text-gray-900">{overview?.total_items ?? 0}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Wallet Transactions</div>
            {transactions.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No transactions yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between text-sm">
                    <div>
                      <div className="text-gray-800">{tx.type || "Transaction"}</div>
                      <div className="text-xs text-gray-500">{tx.created_at}</div>
                    </div>
                    <div className="text-gray-700">{Number(tx.amount || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
