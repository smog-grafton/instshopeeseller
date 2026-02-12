"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalNav } from "@/components/portal-nav";

type IconName = "order" | "product" | "marketing" | "customer" | "finance" | "data" | "shop" | "dashboard";

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
};

export default function PortalSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const activeGroup = useMemo(() => {
    const match = portalNav.find((group) => group.items.some((item) => pathname.startsWith(item.href)));
    return match?.label ?? "Dashboard";
  }, [pathname]);

  const isOpen = (label: string) => openGroups[label] ?? label === activeGroup;

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-200 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      } transition-all duration-200`}
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
          className="text-gray-500 hover:text-gray-700"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>

      <div className="px-2 py-4 space-y-2 overflow-y-auto h-[calc(100vh-56px)]">
        {portalNav.map((group) => {
          const open = isOpen(group.label);
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
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">{iconMap[group.icon]}</span>
                  {!collapsed && <span>{group.label}</span>}
                </span>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
              {open && (
                <div className={`pl-7 pr-2 ${collapsed ? "hidden" : "block"}`}>
                  {group.items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block text-sm py-1.5 px-2 rounded ${
                          active ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
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
