"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalNav } from "@/components/portal-nav";
import { getCatalogProducts, getSellerOrders } from "@/lib/api-client";

type IconName =
  | "order"
  | "product"
  | "marketing"
  | "customer"
  | "finance"
  | "data"
  | "shop"
  | "dashboard"
  | "wholesale";

type IndicatorKey = "orders" | "wholesale";

const iconMap: Record<IconName, React.ReactElement> = {
  dashboard: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M3 12l9-9 9 9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 10v10h12V10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  order: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  product: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 10h6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  marketing: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l18-6v14l-18-6v-2z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 15v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  customer: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c1-4 11-4 12 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 8h5v8h-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  finance: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  data: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V6m6 14V4m6 16v-9m4 9v-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  shop: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M3 9h18l-2 11H5L3 9z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9l2-5h6l2 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  wholesale: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 8.5h16v10.5H4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 8.5V5h10v3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 13h3m2 0h3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

const badgeTone: Record<IndicatorKey, string> = {
  orders: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200",
  wholesale: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const getPaginationTotal = (value?: { total?: number; data?: unknown[] }) => {
  if (!value) return 0;
  if (typeof value.total === "number") return value.total;
  if (Array.isArray(value.data)) return value.data.length;
  return 0;
};

const formatBadgeCount = (count: number) => (count > 99 ? "99+" : String(count));

const groupIndicatorKey = (label: string): IndicatorKey | null => {
  if (label === "Orders") return "orders";
  if (label === "Wholesale Centre") return "wholesale";
  return null;
};

export default function PortalSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(portalNav.map((g) => [g.label, true]))
  );
  const [indicators, setIndicators] = useState<Record<IndicatorKey, number>>({
    orders: 0,
    wholesale: 0,
  });

  const activeGroup = useMemo(() => {
    const match = portalNav.find((group) => group.items.some((item) => pathname.startsWith(item.href)));
    return match?.label ?? "Wholesale Centre";
  }, [pathname]);

  const loadIndicators = useCallback(async () => {
    const [processingResult, paidResult, wholesaleResult] = await Promise.allSettled([
      getSellerOrders({ status: "PROCESSING" }),
      getSellerOrders({ status: "PAID" }),
      getCatalogProducts({ listing_type: "wholesale_centre", per_page: 1 }),
    ]);

    const processingOrders =
      processingResult.status === "fulfilled" ? getPaginationTotal(processingResult.value.orders) : 0;
    const paidOrders =
      paidResult.status === "fulfilled" ? getPaginationTotal(paidResult.value.orders) : 0;
    const wholesaleCount =
      wholesaleResult.status === "fulfilled" ? getPaginationTotal(wholesaleResult.value.products) : 0;

    return {
      orders: processingOrders + paidOrders,
      wholesale: wholesaleCount,
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshIndicators = async () => {
      const next = await loadIndicators();
      if (active) {
        setIndicators(next);
      }
    };

    void refreshIndicators();

    const handleFocus = () => {
      void refreshIndicators();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadIndicators, pathname]);

  const isOpen = (label: string) => openGroups[label] ?? true;

  const renderBadge = (indicatorKey: IndicatorKey | null) => {
    if (!indicatorKey) return null;
    const count = indicators[indicatorKey];
    if (count < 1) return null;

    return (
      <span
        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm px-1.5 text-[11px] font-semibold ${badgeTone[indicatorKey]}`}
      >
        {formatBadgeCount(count)}
      </span>
    );
  };

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-200 z-30 transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[240px] max-md:absolute max-md:left-0 max-md:shadow-lg max-md:z-40"
      }`}
    >
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center text-xs font-bold">S</div>
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">Seller Centre</span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none">
            <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>

      <div className="px-2 py-4 space-y-2 overflow-y-auto h-[calc(100vh-56px)]">
        {portalNav.map((group) => {
          const open = isOpen(group.label);
          const indicatorKey = groupIndicatorKey(group.label);
          const firstHref = group.items[0]?.href ?? "/portal/dashboard";
          const groupIsActive = pathname.startsWith(firstHref) || activeGroup === group.label;

          if (group.standalone) {
            return (
              <Link
                key={group.label}
                href={firstHref}
                className={`flex items-center justify-between gap-2 rounded px-2 py-2 text-sm ${
                  groupIsActive ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                }`}
                title={collapsed ? group.label : undefined}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="relative text-gray-400">
                    {iconMap[group.icon]}
                    {collapsed && indicators.wholesale > 0 && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </span>
                  {!collapsed && <span className="truncate">{group.label}</span>}
                </span>
                {!collapsed && renderBadge(indicatorKey)}
              </Link>
            );
          }

          return (
            <div key={group.label} className="text-gray-700">
              <button
                type="button"
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded hover:bg-gray-50 ${
                  open ? "text-gray-900" : "text-gray-500"
                }`}
                title={collapsed ? group.label : undefined}
              >
                <span className="flex items-center gap-2 text-sm min-w-0">
                  <span className="relative text-gray-400">
                    {iconMap[group.icon]}
                    {collapsed && indicatorKey && indicators[indicatorKey] > 0 && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </span>
                  {!collapsed && <span className="truncate">{group.label}</span>}
                </span>
                {!collapsed && (
                  <span className="ml-2 flex items-center gap-2">
                    {renderBadge(indicatorKey)}
                    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                )}
              </button>
              {open && (
                <div className={`pl-7 pr-2 ${collapsed ? "hidden" : "block"}`}>
                  {group.items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const itemBadge = item.label === "My Orders" ? renderBadge(indicatorKey) : null;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded ${
                          active ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-gray-400 flex-shrink-0">{iconMap[group.icon]}</span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {itemBadge}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
