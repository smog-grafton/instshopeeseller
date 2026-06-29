"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  getSellerAnalyticsOverview,
  getSellerCampaigns,
  getSellerDashboard,
  getSellerDashboardMetrics,
  getSellerVouchers,
  getUiBlocksSafe,
  type ApiUiBlock,
} from "@/lib/api-client";
import { SellerWalletWidget } from "@/components/seller-wallet-widget";
import { formatCurrencyAmount } from "@/lib/utils";

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
  return formatCurrencyAmount(asNumber(value), currency);
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
  const className = `${cardShell} ${style.surface} block min-w-0 transition ${
    href ? "hover:border-neutral-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]" : ""
  }`;
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
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
  const className = `${cardShell} block min-w-0 p-4 transition ${
    href ? "hover:border-neutral-300 hover:bg-neutral-50" : ""
  }`;
  const content = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold leading-none tabular-nums text-neutral-900">{value}</div>
      <div className="mt-2 text-xs leading-5 text-neutral-600">{description}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-sm text-neutral-500">{message}</div>;
}

function QuickActionIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    "Wholesale Centre": "M5 5h14l-1 13H6zM9 5a3 3 0 016 0M8 11h8",
    Orders: "M7 4h10v16H7zM9 8h6M9 12h6M9 16h4",
    Products: "M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10",
    "My Balance": "M4 7h15a1 1 0 011 1v11H5a2 2 0 01-2-2V6a2 2 0 012-2h12M16 13h4",
  };

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#ee4d2d]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={paths[label] || paths.Products} />
      </svg>
    </span>
  );
}

function SellerBanner({ banner }: { banner: ApiUiBlock }) {
  return (
    <Link href={banner.href || "/portal/marketing/centre"} className="relative block overflow-hidden rounded-[10px] bg-[#ee4d2d] px-4 py-4 text-white no-underline shadow-sm sm:px-5">
      {banner.imageSrc ? (
        <img src={banner.imageSrc} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover object-center opacity-90" />
      ) : null}
      <div className="relative z-10 max-w-[62%]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">{banner.subtitle || "Seller growth center"}</div>
        <div className="mt-2 text-xl font-semibold leading-6">{banner.title || "Build a stronger store today"}</div>
      </div>
    </Link>
  );
}

function SellerToolCard({
  label,
  href,
  color,
  path,
  iconSrc,
}: {
  label: string;
  href: string;
  color: string;
  path: string;
  iconSrc?: string;
}) {
  return (
    <Link href={href} className="flex min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center no-underline transition active:bg-neutral-50 hover:bg-neutral-50">
      <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        {iconSrc ? (
          <Image src={iconSrc} alt="" fill sizes="44px" className="object-contain p-2" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={path} />
          </svg>
        )}
      </span>
      <span className="line-clamp-2 min-h-[2.1rem] text-[11px] font-medium leading-4 text-neutral-700 sm:text-xs">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isPending = user?.sellerStatus === "pending";
  const isSuspended = user?.sellerStatus === "suspended";
  const isLimited = isPending || isSuspended;
  const canLoad = Boolean(user?.isSeller && user?.sellerStatus === "approved");

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<SellerWalletSummary | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [overview, setOverview] = useState<SellerOverview | null>(null);
  const [daily, setDaily] = useState<SellerDailyRow[]>([]);
  const [campaigns, setCampaigns] = useState<SellerCampaign[]>([]);
  const [vouchers, setVouchers] = useState<SellerVoucher[]>([]);
  const [dashboardBanners, setDashboardBanners] = useState<ApiUiBlock[]>([]);
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

    const [dashboardResult, analyticsResult, metricsResult, campaignsResult, vouchersResult, bannerResult] = await Promise.allSettled([
      getSellerDashboard(),
      getSellerAnalyticsOverview(),
      getSellerDashboardMetrics(),
      getSellerCampaigns(),
      getSellerVouchers(),
      getUiBlocksSafe({ key: "seller_dashboard_banner" }),
    ] as const);

    if (dashboardResult.status === "fulfilled") {
      setWallet(dashboardResult.value.wallet);
      setStats(dashboardResult.value.stats);
    }

    if (analyticsResult.status === "fulfilled") {
      setOverview(analyticsResult.value.overview || null);
      setDaily(analyticsResult.value.daily || []);
    }

    if (campaignsResult.status === "fulfilled") {
      setCampaigns(campaignsResult.value.campaigns || []);
    }

    if (vouchersResult.status === "fulfilled") {
      setVouchers(vouchersResult.value.vouchers || []);
    }

    if (bannerResult.status === "fulfilled") {
      setDashboardBanners(bannerResult.value || []);
    }

    if (
      metricsResult.status === "fulfilled" &&
      metricsResult.value.metrics?.product_status_counts
    ) {
      setProductCounts({
        rejected: metricsResult.value.metrics.product_status_counts.rejected ?? 0,
        hidden: metricsResult.value.metrics.product_status_counts.hidden ?? 0,
        pending: metricsResult.value.metrics.product_status_counts.pending ?? 0,
        live: metricsResult.value.metrics.product_status_counts.live ?? 0,
      });
      setHealthMetrics({
        lowStock: metricsResult.value.metrics.low_stock_products ?? 0,
        avgRating: metricsResult.value.metrics.average_rating ?? 0,
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
        ? "Wallet can currently support pending orders that need seller processing."
        : "Current available balance is below what your pending order queue needs for shipping reserve.",
      footnote: fundingCovered
        ? `Shortfall cleared. Available wallet can cover current queue.`
        : `Top up ${formatMoney(fundingGap, currency)} to process every pending order.`,
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

  const sellerTools = [
    { label: "Wholesale", href: "/portal/wholesale-centre", color: "bg-sky-100 text-sky-600", path: "M5 5h14l-1 13H6zM9 5a3 3 0 016 0M8 11h8", iconSrc: "/assets/images/icons/wholesale.png" },
    { label: "Store Details", href: "/portal/my-shop", color: "bg-pink-100 text-pink-600", path: "M4 10h16l-1.5-5h-13zM6 10v10h12V10M9 20v-6h6v6", iconSrc: "/assets/images/icons/store.png" },
    { label: "Goods", href: "/portal/products/my-products", color: "bg-fuchsia-100 text-fuchsia-600", path: "M6 8h12l-1 12H7zM9 8a3 3 0 016 0", iconSrc: "/assets/images/icons/product.png" },
    { label: "Store Orders", href: "/portal/orders/my-orders", color: "bg-cyan-100 text-cyan-600", path: "M7 4h10v16H7zM9 8h6M9 12h6M9 16h4", iconSrc: "/assets/images/icons/store-orders.png" },
    { label: "Shipping", href: "/portal/shipping-address-management", color: "bg-orange-100 text-orange-600", path: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 18a2 2 0 100-4 2 2 0 000 4Zm11 0a2 2 0 100-4 2 2 0 000 4Z" },
    { label: "Marketing", href: "/portal/marketing/centre", color: "bg-rose-100 text-rose-600", path: "M5 19V5l14 4-14 4M5 13l14 4" },
    { label: "Customer Service", href: "/portal/customer-service/chat-management", color: "bg-red-100 text-red-600", path: "M5 12a7 7 0 1114 0v3a2 2 0 01-2 2h-2M5 12v3a2 2 0 002 2h1M9 18h6", iconSrc: "/assets/images/icons/customer-support.png" },
    { label: "Store News", href: "/portal/store-news", color: "bg-blue-100 text-blue-600", path: "M5 5h14v14H5zM8 9h8M8 12h8M8 15h5" },
    { label: "Wallet address", href: "/portal/wallet-management", color: "bg-purple-100 text-purple-600", path: "M4 7h15a1 1 0 011 1v11H5a2 2 0 01-2-2V6a2 2 0 012-2h12M16 13h4", iconSrc: "/assets/images/icons/wallet.png" },
    { label: "Top up", href: "/portal/finance/my-balance", color: "bg-teal-100 text-teal-600", path: "M12 5v14M5 12h14" },
    { label: "Withdraw", href: "/portal/withdraw", color: "bg-amber-100 text-amber-600", path: "M12 4v10M8 10l4 4 4-4M5 20h14", iconSrc: "/assets/images/icons/withdraw.png" },
    { label: "Settings", href: "/portal/my-account", color: "bg-indigo-100 text-indigo-600", path: "M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2", iconSrc: "/assets/images/icons/security.png" },
  ];

  if (isLimited) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 overflow-hidden pb-10">
        <section className="overflow-hidden rounded-[14px] bg-gradient-to-br from-[#ff4d33] via-[#ff6428] to-[#ff8a26] text-white shadow-sm">
          <div className="px-4 pb-6 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-lg font-semibold">
                  {(user?.name || "S").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">ID: {user?.id ? String(user.id).padStart(7, "0") : "0000000"}</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-[#17335f] px-2.5 py-1 text-[11px] font-medium text-white">
                    {isPending ? "Pending merchant" : "Limited account"}
                  </div>
                </div>
              </div>
              <Link href="/portal/my-account" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#ee4d2d] no-underline shadow-sm">
                Status
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className={`${isPending ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-900"} px-5 py-5 sm:px-6`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Merchant review status</div>
            <h1 className="mt-2 text-2xl font-bold tracking-normal">
              {isPending ? "Application under review" : "Account access limited"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6">
              {isPending
                ? "Thank you for your submission. Your account is currently under review by our verification team. This process may take up to 24 hours to complete."
                : "Your seller account is currently suspended. Store management tools will remain unavailable until the account is restored."}
            </p>
          </div>
          <div className="grid gap-px bg-neutral-200 sm:grid-cols-3">
            {[
              { label: "Current step", value: isPending ? "Verification in progress" : "Access review" },
              { label: "Estimated time", value: isPending ? "Up to 24 hours" : "Contact support" },
              { label: "Store tools", value: "Locked until approved" },
            ].map((item) => (
              <div key={item.label} className="bg-white px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{item.label}</div>
                <div className="mt-2 text-sm font-semibold text-neutral-900">{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden sm:space-y-5">
      <section className="overflow-hidden rounded-[14px] bg-gradient-to-br from-[#ff4d33] via-[#ff6428] to-[#ff8a26] text-white shadow-sm">
        <div className="px-4 pb-6 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-lg font-semibold">
                {(user?.name || "S").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">ID: {user?.id ? String(user.id).padStart(7, "0") : "0000000"}</div>
                <div className="mt-1 inline-flex items-center rounded-full bg-[#17335f] px-2.5 py-1 text-[11px] font-medium text-white">
                  Platform merchant
                </div>
              </div>
            </div>
            <Link href="/portal/finance/my-balance" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#ee4d2d] no-underline shadow-sm">
              Wallet
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { label: "Products", value: stats?.total_products ?? productCounts.live ?? 0 },
              { label: "Orders", value: stats?.total_orders ?? overview?.total_orders ?? 0 },
              { label: "Pending orders", value: overview?.order_buckets?.to_ship ?? 0 },
              { label: "Balance", value: formatMoney(wallet?.available_balance ?? wallet?.balance ?? 0, currency) },
            ].map((item) => (
              <div key={item.label} className="min-w-0 text-center">
                <div className="truncate text-base font-semibold leading-none text-white sm:text-lg">{isDashboardLoading ? "--" : item.value}</div>
                <div className="mt-1 truncate text-[11px] text-white/85">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="-mt-7 grid grid-cols-2 gap-3 px-2 sm:px-0 lg:mt-0">
        <Link href="/portal/finance/my-balance" className="flex min-w-0 items-center justify-between rounded-xl bg-white p-4 text-neutral-900 no-underline shadow-sm">
          <div>
            <div className="text-lg font-semibold">Top up</div>
            <div className="mt-1 text-xs text-neutral-500">Seller wallet</div>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#ee4d2d]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          </span>
        </Link>
        <Link href="/portal/withdraw" className="flex min-w-0 items-center justify-between rounded-xl bg-white p-4 text-neutral-900 no-underline shadow-sm">
          <div>
            <div className="text-lg font-semibold">Withdraw</div>
            <div className="mt-1 text-xs text-neutral-500">Up to 7 business days</div>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 4v10M8 10l4 4 4-4M5 20h14" /></svg>
          </span>
        </Link>
      </section>

      {dashboardBanners[0] ? <SellerBanner banner={dashboardBanners[0]} /> : null}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Seller Tools</h2>
          <Link href="/portal/my-shop" className="text-xs text-neutral-400 no-underline">View</Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {sellerTools.map((tool) => (
            <SellerToolCard key={tool.label} {...tool} />
          ))}
        </div>
      </section>

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

              {isLimited && (
                <div className="mt-4 border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
                  {isPending
                    ? "Your seller application is still under review. Orders, payouts, and wholesale funding controls unlock after approval."
                    : "Your seller account is currently suspended. Dashboard access stays available, but seller tools remain locked until the account is restored."}
                </div>
              )}

              {!isLimited && !isDashboardLoading && overview && (
                <div className="mt-4 border border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f4_100%)] px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex min-w-0 items-center gap-3 border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <QuickActionIcon label={action.label} />
                        <span className="min-w-0 truncate">{action.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-px bg-neutral-200 sm:grid-cols-4">
                    {[
                      {
                        label: "Pending orders",
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
                  label: "Pending orders",
                  value: overview?.order_buckets?.to_ship ?? 0,
                  description: "Paid orders that still need seller processing.",
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

      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isLimited ? "opacity-70" : ""}`}>
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

      <div className={`grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] ${isLimited ? "opacity-70" : ""}`}>
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

      {isLimited && (
        <div className="border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-6 text-neutral-600">
          {isPending
            ? "Product listing, wholesale funding, shipping confirmation, and payout movement will fully unlock after approval."
            : "Product listing, wholesale funding, shipping confirmation, and payout movement stay locked while the seller account is suspended."}
        </div>
      )}
    </div>
  );
}
