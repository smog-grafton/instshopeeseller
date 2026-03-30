"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  getSellerAnalyticsOverview,
  getSellerCampaigns,
  getSellerDashboard,
  getSellerDashboardMetrics,
  getSellerVouchers,
} from "@/lib/api-client";
import { SellerWalletWidget } from "@/components/seller-wallet-widget";

type SellerWalletSummary = {
  balance?: number | string | null;
  available_balance?: number | string | null;
  pending_balance?: number | string | null;
  currency?: string | null;
};

type SellerStats = {
  total_products?: number;
  total_orders?: number;
  pending_orders?: number;
};

type SellerOverview = {
  total_orders: number;
  total_items: number;
  total_revenue: number;
  gross_sales: number;
  expected_profit: number;
  realized_profit: number;
  pending_profit: number;
  shipping_absorbed: number;
  funding_needed: number;
  reserved_capital: number;
  order_buckets: {
    awaiting_payment: number;
    to_ship: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
  };
};

type SellerDailyRow = {
  date: string;
  orders: number;
  items: number;
  revenue: number;
  shipping_absorbed: number;
  expected_profit: number;
  realized_profit: number;
};

type SellerCampaign = {
  id: number | string;
  title: string;
  status?: string | null;
  type?: string | null;
};

type SellerVoucher = {
  id: number | string;
  title: string;
  description?: string | null;
  active?: boolean;
  created_at?: string | null;
};

type ToneKey = "orange" | "emerald" | "blue" | "slate" | "rose";

const toneStyles: Record<
  ToneKey,
  {
    accent: string;
    badge: string;
    value: string;
    surface: string;
  }
> = {
  orange: {
    accent: "bg-[#ee4d2d]",
    badge: "border-[#f3c3b5] bg-[#fff4ef] text-[#d9481c]",
    value: "text-[#d9481c]",
    surface: "bg-[linear-gradient(180deg,#fff9f6_0%,#ffffff_100%)]",
  },
  emerald: {
    accent: "bg-[#18875d]",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    surface: "bg-[linear-gradient(180deg,#f5fcf8_0%,#ffffff_100%)]",
  },
  blue: {
    accent: "bg-[#2563eb]",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    value: "text-blue-700",
    surface: "bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)]",
  },
  slate: {
    accent: "bg-[#475569]",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    value: "text-slate-800",
    surface: "bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]",
  },
  rose: {
    accent: "bg-[#be123c]",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    surface: "bg-[linear-gradient(180deg,#fff6f8_0%,#ffffff_100%)]",
  },
};

const cardShell = "overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]";

function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatMoney(value: number | string | null | undefined, currency = "USD"): string {
  return `${currency} ${asNumber(value).toFixed(2)}`;
}

function formatMetricValue(value: string | number, currency?: string): string {
  if (typeof value === "number") {
    return currency ? formatMoney(value, currency) : value.toString();
  }

  return value;
}

function MetricCard({
  title,
  value,
  description,
  footnote,
  tone,
  loading,
  href,
  currency,
}: {
  title: string;
  value: string | number;
  description: string;
  footnote: string;
  tone: ToneKey;
  loading?: boolean;
  href?: string;
  currency?: string;
}) {
  const style = toneStyles[tone];
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`${cardShell} ${style.surface} block min-w-0 transition ${href ? "hover:border-neutral-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]" : ""}`}
    >
      <div className={`h-1 ${style.accent}`} aria-hidden />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {title}
            </div>
            {loading ? (
              <div className="mt-3 h-9 w-32 animate-pulse bg-neutral-100" aria-hidden />
            ) : (
              <div className={`mt-2 text-[1.75rem] font-semibold leading-none tabular-nums ${style.value}`}>
                {formatMetricValue(value, currency)}
              </div>
            )}
          </div>
          <div className={`inline-flex h-9 min-w-9 items-center justify-center border px-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${style.badge}`}>
            KPI
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{description}</p>
        <div className="mt-4 border-t border-black/[0.06] pt-3 text-xs leading-5 text-neutral-500">{footnote}</div>
      </div>
    </Wrapper>
  );
}

function StatusPanel({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  href?: string;
}) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`${cardShell} block min-w-0 p-4 transition ${href ? "hover:border-neutral-300 hover:bg-neutral-50" : ""}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold leading-none tabular-nums text-neutral-900">{value}</div>
      <div className="mt-2 text-xs leading-5 text-neutral-600">{description}</div>
    </Wrapper>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-sm text-neutral-500">{message}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isPending = user?.sellerStatus === "pending";
  const canLoad = Boolean(user?.isSeller && user?.sellerStatus === "approved");

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<SellerWalletSummary | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [overview, setOverview] = useState<SellerOverview | null>(null);
  const [daily, setDaily] = useState<SellerDailyRow[]>([]);
  const [campaigns, setCampaigns] = useState<SellerCampaign[]>([]);
  const [vouchers, setVouchers] = useState<SellerVoucher[]>([]);
  const [productCounts, setProductCounts] = useState({ rejected: 0, hidden: 0, pending: 0, live: 0 });
  const [healthMetrics, setHealthMetrics] = useState<{ lowStock: number; avgRating: number }>({ lowStock: 0, avgRating: 0 });

  const currency = (wallet?.currency || "USD").toUpperCase();
  const isDashboardLoading = canLoad && loading;
  const walletAvailable = asNumber(wallet?.available_balance ?? wallet?.balance);
  const fundingNeeded = asNumber(overview?.funding_needed);
  const fundingGap = Math.max(fundingNeeded - walletAvailable, 0);
  const fundingCovered = fundingNeeded <= 0 || fundingGap <= 0;

  const adsCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.type === "ads"), [campaigns]);
  const runningAds = useMemo(
    () => adsCampaigns.filter((campaign) => campaign.status === "running").length,
    [adsCampaigns]
  );
  const liveVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.active).length,
    [vouchers]
  );
  const recentDaily = useMemo(() => [...daily].slice(-5).reverse(), [daily]);
  const recentVouchers = useMemo(() => {
    const list = [...vouchers];
    list.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : Number(a.id || 0);
      const bTime = b.created_at ? new Date(b.created_at).getTime() : Number(b.id || 0);
      return bTime - aTime;
    });

    return list.slice(0, 3);
  }, [vouchers]);

  const weeklySnapshot = useMemo(
    () =>
      daily.reduce(
        (sum, row) => ({
          revenue: sum.revenue + asNumber(row.revenue),
          shipping: sum.shipping + asNumber(row.shipping_absorbed),
          expectedProfit: sum.expectedProfit + asNumber(row.expected_profit),
          realizedProfit: sum.realizedProfit + asNumber(row.realized_profit),
          orders: sum.orders + asNumber(row.orders),
        }),
        { revenue: 0, shipping: 0, expectedProfit: 0, realizedProfit: 0, orders: 0 }
      ),
    [daily]
  );

  const loadData = async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      getSellerDashboard(),
      getSellerAnalyticsOverview(),
      getSellerDashboardMetrics(),
      getSellerCampaigns(),
      getSellerVouchers(),
    ]);

    const [dashboardRes, analyticsRes, metricsRes, campaignsRes, vouchersRes] = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

    if (dashboardRes) {
      setWallet(dashboardRes.wallet);
      setStats(dashboardRes.stats);
    }

    if (analyticsRes) {
      setOverview(analyticsRes.overview || null);
      setDaily(analyticsRes.daily || []);
    }

    if (campaignsRes) {
      setCampaigns(campaignsRes.campaigns || []);
    }

    if (vouchersRes) {
      setVouchers(vouchersRes.vouchers || []);
    }

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
    if (!canLoad) return;

    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [user, canLoad]);

  const primaryMetrics = [
    {
      title: "Gross Sales",
      value: overview?.gross_sales ?? 0,
      description: "Customer payments already cleared into active orders across paid, processing, shipped, and delivered states.",
      footnote: `${overview?.total_orders ?? stats?.total_orders ?? 0} lifetime orders on record`,
      tone: "orange" as const,
      href: "/portal/data/business-insights",
    },
    {
      title: "Projected Profit",
      value: overview?.expected_profit ?? 0,
      description: "Expected merchant profit after supplier cost and shop-funded shipping have already been accounted for.",
      footnote: `${overview?.total_items ?? 0} items sold across active financial orders`,
      tone: "emerald" as const,
      href: "/portal/orders/my-orders",
    },
    {
      title: "Profit Released",
      value: overview?.realized_profit ?? 0,
      description: "Earnings already unlocked through delivered orders and ready for normal wallet movement.",
      footnote: `${overview?.order_buckets?.delivered ?? 0} delivered orders currently settled`,
      tone: "slate" as const,
      href: "/portal/finance/my-income",
    },
    {
      title: "Funding Needed",
      value: overview?.funding_needed ?? 0,
      description: fundingCovered
        ? "Wallet can currently support orders that are ready for shipment confirmation."
        : "Current available balance is below what your to-ship queue needs for shipping reserve.",
      footnote: fundingCovered
        ? `Shortfall cleared. Available wallet can cover current queue.`
        : `Top up ${formatMoney(fundingGap, currency)} to ship every ready order.`,
      tone: fundingCovered ? ("blue" as const) : ("rose" as const),
      href: "/portal/finance/my-balance",
    },
  ];

  const healthItems = [
    { label: "Pending review", value: productCounts.pending, href: "/portal/products/my-products?status=pending" },
    { label: "Rejected products", value: productCounts.rejected, href: "/portal/shop/appeal-management" },
    { label: "Hidden products", value: productCounts.hidden, href: "/portal/products/my-products?status=hidden" },
    { label: "Live products", value: productCounts.live, href: "/portal/products/my-products?status=live" },
    { label: "Low stock", value: healthMetrics.lowStock, href: "/portal/products/inventory-rules" },
    { label: "Avg rating", value: Number(healthMetrics.avgRating || 0).toFixed(2), href: "/portal/customer-service/review-management" },
  ];

  const quickActions = [
    { label: "Wholesale Centre", href: "/portal/wholesale-centre" },
    { label: "Orders", href: "/portal/orders/my-orders" },
    { label: "Products", href: "/portal/products/my-products" },
    { label: "My Balance", href: "/portal/finance/my-balance" },
  ];

  return (
    <div className="max-w-full space-y-4 overflow-hidden sm:space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,24rem)]">
        <section className={cardShell}>
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.9fr)]">
            <div className="border-b border-neutral-200 px-4 py-4 sm:px-5 sm:py-5 lg:border-b-0 lg:border-r">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Seller Dashboard
                  </div>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.9rem]">
                    {user?.name || "Seller"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                    Run the shop with current supplier cost, shipping reserve, payout pipeline, and product health in one place.
                  </p>
                </div>
                {canLoad && (
                  <button
                    onClick={loadData}
                    className="inline-flex items-center justify-center border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Refresh
                  </button>
                )}
              </div>

              {isPending && (
                <div className="mt-4 border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
                  Your seller application is still under review. Orders, payouts, and wholesale funding controls unlock after approval.
                </div>
              )}

              {!isPending && !isDashboardLoading && overview && (
                <div className="mt-4 border border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f4_100%)] px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-px bg-neutral-200 sm:grid-cols-4">
                    {[
                      {
                        label: "Orders in queue",
                        value: overview.order_buckets.awaiting_payment + overview.order_buckets.to_ship,
                      },
                      {
                        label: "In transit",
                        value: overview.order_buckets.in_transit,
                      },
                      {
                        label: "Products live",
                        value: stats?.total_products ?? productCounts.live,
                      },
                      {
                        label: "Reserved capital",
                        value: formatMoney(overview.reserved_capital, currency),
                      },
                    ].map((item) => (
                      <div key={item.label} className="bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                          {item.label}
                        </div>
                        <div className="mt-2 text-xl font-semibold leading-none text-neutral-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  label: "Awaiting payment",
                  value: overview?.order_buckets?.awaiting_payment ?? 0,
                  description: "Orders still waiting for buyer payment clearance.",
                },
                {
                  label: "Ready to ship",
                  value: overview?.order_buckets?.to_ship ?? 0,
                  description: "Paid orders that still need seller shipping action.",
                },
                {
                  label: "Delivered",
                  value: overview?.order_buckets?.delivered ?? 0,
                  description: "Completed orders already counted in released profit.",
                },
                {
                  label: "Cancelled",
                  value: overview?.order_buckets?.cancelled ?? 0,
                  description: "Orders removed from the active revenue and profit pipeline.",
                },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-4 sm:px-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-[1.65rem] font-semibold leading-none tabular-nums text-neutral-900">
                    {isDashboardLoading ? "—" : item.value}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-neutral-600">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SellerWalletWidget
          balance={wallet?.balance}
          availableBalance={wallet?.available_balance}
          pendingBalance={wallet?.pending_balance}
          currency={wallet?.currency}
          fundingNeeded={overview?.funding_needed}
          loading={isDashboardLoading}
        />
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isPending ? "opacity-70" : ""}`}>
        {primaryMetrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={isDashboardLoading ? "—" : metric.value}
            description={metric.description}
            footnote={metric.footnote}
            tone={metric.tone}
            loading={isDashboardLoading}
            href={metric.href}
            currency={typeof metric.value === "number" ? currency : undefined}
          />
        ))}
      </div>

      <div className={`grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] ${isPending ? "opacity-70" : ""}`}>
        <div className="space-y-4">
          <section className={cardShell}>
            <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    7-Day Ledger
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-900">Profit and shipping movement</h2>
                </div>
                <Link href="/portal/data/business-insights" className="text-sm font-medium text-[#0f62fe] hover:text-[#0b56e8]">
                  Open Business Insights
                </Link>
              </div>
            </div>

            <div className="grid gap-px border-b border-neutral-200 bg-neutral-200 sm:grid-cols-4">
              {[
                { label: "Sales this week", value: formatMoney(weeklySnapshot.revenue, currency) },
                { label: "Shipping absorbed", value: formatMoney(weeklySnapshot.shipping, currency) },
                { label: "Profit pipeline", value: formatMoney(weeklySnapshot.expectedProfit, currency) },
                { label: "Released profit", value: formatMoney(weeklySnapshot.realizedProfit, currency) },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3 sm:px-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold text-neutral-900">{isDashboardLoading ? "—" : item.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {isDashboardLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-14 animate-pulse bg-neutral-100" aria-hidden />
                  ))}
                </div>
              ) : recentDaily.length === 0 ? (
                <EmptyState message="No active financial orders yet." />
              ) : (
                <div className="space-y-3">
                  {recentDaily.map((row) => (
                    <div key={row.date} className="border border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900">{row.date}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {row.orders} orders • {row.items} items
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Gross sales</div>
                            <div className="mt-1 text-sm font-semibold text-neutral-900">
                              {formatMoney(row.revenue, currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Shipping</div>
                            <div className="mt-1 text-sm font-semibold text-neutral-900">
                              {formatMoney(row.shipping_absorbed, currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Profit</div>
                            <div className="mt-1 text-sm font-semibold text-emerald-700">
                              {formatMoney(row.expected_profit, currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={cardShell}>
            <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Fulfilment Queue
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-900">Operational watchlist</h2>
                </div>
                <Link href="/portal/orders/my-orders" className="text-sm font-medium text-[#0f62fe] hover:text-[#0b56e8]">
                  Open Orders
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
              <StatusPanel
                title="Awaiting payment"
                value={isDashboardLoading ? "—" : overview?.order_buckets?.awaiting_payment ?? 0}
                description="Manual and unpaid orders still outside the shipping queue."
                href="/portal/orders/my-orders"
              />
              <StatusPanel
                title="To ship"
                value={isDashboardLoading ? "—" : overview?.order_buckets?.to_ship ?? 0}
                description="Orders that need wallet-backed shipping confirmation."
                href="/portal/orders/my-orders"
              />
              <StatusPanel
                title="In transit"
                value={isDashboardLoading ? "—" : overview?.order_buckets?.in_transit ?? 0}
                description="Orders already marked shipped and still in the delivery pipeline."
                href="/portal/orders/my-orders"
              />
              <StatusPanel
                title="Shipping reserve"
                value={isDashboardLoading ? "—" : formatMoney(overview?.reserved_capital ?? 0, currency)}
                description="Capital already reserved against orders that have moved into shipment."
                href="/portal/finance/my-balance"
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className={cardShell}>
            <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Growth Tools
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-900">Campaigns and voucher activity</h2>
                </div>
                <Link href="/portal/marketing/vouchers" className="text-sm font-medium text-[#0f62fe] hover:text-[#0b56e8]">
                  Open Marketing
                </Link>
              </div>
            </div>

            <div className="grid gap-px bg-neutral-200 sm:grid-cols-3">
              {[
                { label: "Running ads", value: runningAds },
                { label: "Live vouchers", value: liveVouchers },
                { label: "Total campaigns", value: adsCampaigns.length },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3 sm:px-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-neutral-900">{isDashboardLoading ? "—" : item.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {isDashboardLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse bg-neutral-100" aria-hidden />
                  ))}
                </div>
              ) : recentVouchers.length === 0 ? (
                <EmptyState message="No voucher or campaign updates yet." />
              ) : (
                <div className="space-y-3">
                  {recentVouchers.map((voucher) => (
                    <div key={voucher.id} className="border border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#fcfcfc_100%)] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 break-words">{voucher.title}</div>
                          <div className="mt-1 text-xs leading-5 text-neutral-600 break-words">
                            {voucher.description || "Voucher activity"}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            voucher.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-neutral-200 bg-neutral-50 text-neutral-600"
                          }`}
                        >
                          {voucher.active ? "Live" : "Idle"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={cardShell}>
            <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Account Health
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-900">Listing quality and risk watch</h2>
                </div>
                <Link href="/portal/data/account-health" className="text-sm font-medium text-[#0f62fe] hover:text-[#0b56e8]">
                  Open Health
                </Link>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {healthItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="border border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold leading-none text-neutral-900">{isDashboardLoading ? "—" : item.value}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {isPending && (
        <div className="border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-6 text-neutral-600">
          Product listing, wholesale funding, shipping confirmation, and payout movement will fully unlock after approval.
        </div>
      )}
    </div>
  );
}
