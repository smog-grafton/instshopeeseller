"use client";

import { useEffect, useState } from "react";
import { getSellerAnalyticsOverview, getSellerDashboardMetrics } from "@/lib/api-client";

export default function AccountHealthPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [metrics, setMetrics] = useState<{ lowStock: number; rejected: number; avgRating: number }>({
    lowStock: 0,
    rejected: 0,
    avgRating: 0,
  });

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([getSellerAnalyticsOverview(), getSellerDashboardMetrics()])
      .then(([overviewRes, metricsRes]) => {
        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value.overview || null);
        }
        if (metricsRes.status === "fulfilled") {
          const data = metricsRes.value.metrics || {};
          setMetrics({
            lowStock: data.low_stock_products ?? 0,
            rejected: data.product_status_counts?.rejected ?? 0,
            avgRating: data.average_rating ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Data</div>
        <h1 className="text-xl font-semibold text-gray-900">Account Health</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading account health...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Low Stock Products</div>
              <div className="text-2xl font-semibold text-gray-900">{metrics.lowStock}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Rejected Products</div>
              <div className="text-2xl font-semibold text-gray-900">{metrics.rejected}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Average Rating</div>
              <div className="text-2xl font-semibold text-gray-900">{Number(metrics.avgRating || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">Performance Summary</div>
            <div className="text-sm text-gray-600">
              Total orders: {overview?.total_orders ?? 0} • Items sold: {overview?.total_items ?? 0}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
