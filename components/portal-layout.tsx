"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PortalSidebar from "@/components/portal-sidebar";
import PortalTopbar from "@/components/portal-topbar";
import PortalRightbar from "@/components/portal-rightbar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/portal/my-onboarding");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("portal_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem("portal_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <PortalSidebar collapsed={collapsed} onToggleCollapse={toggle} />
        <div className="flex-1 min-w-0 relative">
          <PortalTopbar />
          <main className="p-6 pr-20">{children}</main>
          <PortalRightbar />
        </div>
      </div>
    </div>
  );
}
