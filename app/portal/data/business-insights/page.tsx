"use client";

import { useEffect, useState } from "react";
import { getSellerAnalyticsOverview, getWallet } from "@/lib/api-client";

export default function BusinessInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [overview, setOverview] = useState<{ total_orders: number; total_items: number; total_revenue: number } | null>(null);
  const [daily, setDaily] = useState<{ date: string; revenue: number; items: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ id: number; title: string; units: number; revenue: number }[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSellerAnalyticsOverview(), getWallet()])
      .then(([analytics, wallet]) => {
        setOverview(analytics.overview);
        setDaily(analytics.daily || []);
        setTopProducts(analytics.top_products || []);
        setCurrency(wallet.wallet.currency || "USD");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Data</div>
        <h1 className="text-xl font-semibold text-gray-900">Business Insights</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Total Revenue (All time)</div>
              <div className="text-2xl font-semibold text-gray-900">
                {currency} {(overview?.total_revenue ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Total Orders</div>
              <div className="text-2xl font-semibold text-gray-900">{overview?.total_orders ?? 0}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Total Items Sold</div>
              <div className="text-2xl font-semibold text-gray-900">{overview?.total_items ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-2">
              <div className="text-sm font-semibold text-gray-800 mb-3">Last 7 days</div>
              <div className="divide-y divide-gray-100">
                {daily.length === 0 ? (
                  <div className="text-sm text-gray-500 py-6">No recent orders.</div>
                ) : (
                  daily.map((row) => (
                    <div key={row.date} className="flex items-center justify-between py-2 text-sm">
                      <div className="text-gray-600">{row.date}</div>
                      <div className="text-gray-800">{currency} {Number(row.revenue).toFixed(2)}</div>
                      <div className="text-gray-500">{row.items} items</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Top Products</div>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <div className="text-sm text-gray-500">No sales yet.</div>
                ) : (
                  topProducts.map((p) => (
                    <div key={p.id} className="text-sm">
                      <div className="text-gray-800 truncate">{p.title}</div>
                      <div className="text-xs text-gray-500">{p.units} units • {currency} {Number(p.revenue).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
