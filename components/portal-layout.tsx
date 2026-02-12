"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PortalSidebar from "@/components/portal-sidebar";
import PortalTopbar from "@/components/portal-topbar";
import PortalRightbar from "@/components/portal-rightbar";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const h = () => setMatches(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, [query]);
  return matches;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/portal/my-onboarding");
  const [collapsed, setCollapsed] = useState(false);
  const isMobileOrTablet = useMediaQuery("(max-width: 1023px)");

  useEffect(() => {
    const saved = window.localStorage.getItem("portal_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "1");
      return;
    }
    const m = window.matchMedia("(max-width: 1023px)");
    setCollapsed(m.matches);
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
      <div className="flex relative">
        {isMobileOrTablet && !collapsed && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/30 z-[35] md:hidden"
            onClick={toggle}
          />
        )}
        <PortalSidebar collapsed={collapsed} onToggleCollapse={toggle} />
        <div className="flex-1 min-w-0 relative">
          <PortalTopbar />
          <main className="p-4 sm:p-6 pr-4 sm:pr-20">{children}</main>
          <PortalRightbar />
        </div>
      </div>
    </div>
  );
}
