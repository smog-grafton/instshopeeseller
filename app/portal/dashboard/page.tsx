"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  getSellerAnalyticsOverview,
  getSellerCampaigns,
  getSellerDashboard,
  getSellerDashboardMetrics,
  getSellerOrders,
  getSellerVouchers,
} from "@/lib/api-client";

type Paginated<T> = { data?: T[]; total?: number };

const getTotal = (pagination?: Paginated<unknown>) => {
  if (!pagination) return 0;
  if (typeof pagination.total === "number") return pagination.total;
  if (Array.isArray(pagination.data)) return pagination.data.length;
  return 0;
};

const formatMoney = (value: number | string | null | undefined, currency = "USD") => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toFixed(2)}`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isPending = user?.sellerStatus === "pending";
  const canLoad = Boolean(user?.isSeller && user?.sellerStatus === "approved");

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [orderCounts, setOrderCounts] = useState({ toProcess: 0, shipped: 0, cancelled: 0 });
  const [productCounts, setProductCounts] = useState({ rejected: 0, hidden: 0, pending: 0, live: 0 });
  const [healthMetrics, setHealthMetrics] = useState<{ lowStock: number; avgRating: number }>({ lowStock: 0, avgRating: 0 });

  const adsCampaigns = useMemo(() => campaigns.filter((c) => c.type === "ads"), [campaigns]);
  const runningAds = useMemo(() => adsCampaigns.filter((c) => c.status === "running").length, [adsCampaigns]);
  const recentDaily = useMemo(() => daily.slice(0, 3), [daily]);
  const recentVouchers = useMemo(() => {
    const list = [...vouchers];
    list.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : Number(a.id || 0);
      const bTime = b.created_at ? new Date(b.created_at).getTime() : Number(b.id || 0);
      return bTime - aTime;
    });
    return list.slice(0, 2);
  }, [vouchers]);

  const loadData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getSellerDashboard(),
      getSellerAnalyticsOverview(),
      getSellerDashboardMetrics(),
      getSellerCampaigns(),
      getSellerVouchers(),
      getSellerOrders({ status: "PROCESSING" }),
      getSellerOrders({ status: "PAID" }),
      getSellerOrders({ status: "SHIPPED" }),
      getSellerOrders({ status: "CANCELLED" }),
    ]);

    const [
      dashboardRes,
      analyticsRes,
      metricsRes,
      campaignsRes,
      vouchersRes,
      processingRes,
      paidRes,
      shippedRes,
      cancelledRes,
    ] = results.map((res) => (res.status === "fulfilled" ? res.value : null));

    if (dashboardRes) {
      setWallet(dashboardRes.wallet);
      setStats(dashboardRes.stats);
    }

    if (analyticsRes) {
      setOverview(analyticsRes.overview || null);
      setDaily(analyticsRes.daily || []);
    }

    if (campaignsRes) setCampaigns(campaignsRes.campaigns || []);
    if (vouchersRes) setVouchers(vouchersRes.vouchers || []);

    const toProcess = getTotal(processingRes?.orders) + getTotal(paidRes?.orders);
    setOrderCounts({
      toProcess,
      shipped: getTotal(shippedRes?.orders),
      cancelled: getTotal(cancelledRes?.orders),
    });

    if (metricsRes?.metrics?.product_status_counts) {
      setProductCounts({
        rejected: metricsRes.metrics.product_status_counts.rejected ?? 0,
        hidden: metricsRes.metrics.product_status_counts.hidden ?? 0,
        pending: metricsRes.metrics.product_status_counts.pending ?? 0,
        live: metricsRes.metrics.product_status_counts.live ?? 0,
      });
      setHealthMetrics({
        lowStock: metricsRes.metrics.low_stock_products ?? 0,
        avgRating: metricsRes.metrics.average_rating ?? 0,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    if (!canLoad) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user, canLoad]);

  const todoItems = [
    { label: "To-Process Shipment", value: orderCounts.toProcess },
    { label: "Processed Shipment", value: orderCounts.shipped },
    { label: "Return/Refund/Cancel", value: orderCounts.cancelled },
    { label: "Banned / De-boosted Products", value: productCounts.rejected + productCounts.hidden },
  ];

  const healthItems = [
    { label: "Pending review", value: productCounts.pending, href: "/portal/products/my-products?status=pending" },
    { label: "Rejected products", value: productCounts.rejected, href: "/portal/shop/appeal-management" },
    { label: "Hidden products", value: productCounts.hidden, href: "/portal/products/my-products?status=hidden" },
    { label: "Live products", value: productCounts.live, href: "/portal/products/my-products?status=live" },
    { label: "Low stock", value: healthMetrics.lowStock, href: "/portal/products/inventory-rules" },
    { label: "Avg rating", value: Number(healthMetrics.avgRating || 0).toFixed(2), href: "/portal/customer-service/review-management" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-semibold text-gray-800">Seller Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome, {user?.name || "Seller"}
          {wallet && <span className="ml-2">• Wallet {formatMoney(wallet.balance, wallet.currency || "USD")}</span>}
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-amber-800">Application under review</h2>
            <p className="text-sm text-amber-700 mt-1">
              Your seller application has been submitted. You will get full access once an admin approves your application.
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        You can now submit a form to rearrange pickups if the logistics provider fails to show up or misses parcels.
      </div>

      <div className={`grid grid-cols-12 gap-6 ${isPending ? "opacity-70" : ""}`}>
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">To Do List</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {stats && (
                  <span>
                    Total orders: {stats.total_orders ?? 0} • Products: {stats.total_products ?? 0}
                  </span>
                )}
                {canLoad && (
                  <button onClick={loadData} className="text-blue-600 hover:text-blue-700">
                    Refresh
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {todoItems.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-semibold text-gray-800">{loading ? "—" : item.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Business Insights</h2>
              <Link href="/portal/data/business-insights" className="text-sm text-blue-600 hover:text-blue-700">
                More
              </Link>
            </div>
            <div className="text-xs text-gray-500 mt-1">Real-time data until GMT +8 23:00 (Data changes compared to yesterday)</div>
            {loading ? (
              <div className="mt-4 text-sm text-gray-500">Loading analytics...</div>
            ) : !overview ? (
              <div className="mt-4 text-sm text-gray-500">No analytics data yet.</div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-sm">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatMoney(overview.total_revenue ?? 0, wallet?.currency || "USD")}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-gray-500">Total Orders</div>
                    <div className="text-lg font-semibold text-gray-900">{overview.total_orders ?? 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-gray-500">Items Sold</div>
                    <div className="text-lg font-semibold text-gray-900">{overview.total_items ?? 0}</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 text-sm">
                  {recentDaily.length === 0 ? (
                    <div className="py-2 text-gray-500">No recent sales.</div>
                  ) : (
                    recentDaily.map((row) => (
                      <div key={row.date} className="flex items-center justify-between py-2">
                        <div className="text-gray-600">{row.date}</div>
                        <div className="text-gray-800">
                          {formatMoney(row.revenue ?? 0, wallet?.currency || "USD")}
                        </div>
                        <div className="text-gray-500">{row.items} items</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Shopee Ads</h2>
              <Link href="/portal/marketing/ads" className="text-sm text-blue-600 hover:text-blue-700">
                More
              </Link>
            </div>
            {loading ? (
              <div className="mt-4 text-sm text-gray-500">Loading campaigns...</div>
            ) : adsCampaigns.length === 0 ? (
              <div className="mt-4 text-sm text-gray-500">No ads campaigns yet.</div>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                <div className="text-xs text-gray-500">Active campaigns: {runningAds}</div>
                {adsCampaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div className="text-gray-700">{campaign.title}</div>
                    <div className="text-xs text-gray-500">{campaign.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Announcements</h2>
              <Link href="/portal/marketing/vouchers" className="text-sm text-blue-600 hover:text-blue-700">
                More
              </Link>
            </div>
            {loading ? (
              <div className="mt-4 text-sm text-gray-500">Loading updates...</div>
            ) : recentVouchers.length === 0 ? (
              <div className="mt-4 text-sm text-gray-500">No voucher updates yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentVouchers.map((voucher) => (
                  <div key={voucher.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-800">{voucher.title}</div>
                    <div className="text-xs text-gray-500">{voucher.description || "Voucher update"}</div>
                    <div className="text-xs text-gray-400 mt-1">{voucher.active ? "Active" : "Inactive"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Account Health</h2>
              <Link href="/portal/data/account-health" className="text-sm text-blue-600 hover:text-blue-700">
                More
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {healthItems.map((item) => (
                <Link key={item.label} href={item.href} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                  <div className="text-lg font-semibold text-gray-800">{loading ? "—" : item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Product listing, orders, and payouts will be available after approval.
        </div>
      )}
    </div>
  );
}
