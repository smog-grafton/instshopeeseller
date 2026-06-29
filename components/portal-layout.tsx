"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PortalSidebar from "@/components/portal-sidebar";
import PortalTopbar from "@/components/portal-topbar";
import PortalRightbar from "@/components/portal-rightbar";
import PortalBottomNav from "@/components/portal-bottom-nav";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const m = window.matchMedia(query);
    const h = () => setMatches(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, [query]);

  return matches;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/portal/my-onboarding");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    typeof window === "undefined" ? false : window.localStorage.getItem("portal_sidebar_collapsed") === "1"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  const toggleDesktopCollapse = () => {
    setDesktopCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("portal_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  const openMobileMenu = () => {
    if (!isDesktop) {
      setMobileMenuOpen(true);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (isDesktop) {
      const timeout = window.setTimeout(() => setMobileMenuOpen(false), 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isDesktop]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen max-w-full overflow-hidden bg-gray-50">
      <div className="relative flex h-screen min-w-0 max-w-full overflow-hidden">
        {!isDesktop && mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[35] bg-black/30 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}
        <PortalSidebar
          collapsed={desktopCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={closeMobileMenu}
          onToggleCollapse={toggleDesktopCollapse}
        />
        <div className="relative h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <PortalTopbar onOpenMenu={openMobileMenu} />
          <main className="max-w-full overflow-x-hidden p-4 pb-28 pr-4 sm:p-6 sm:pb-28 sm:pr-20 md:pb-6">{children}</main>
          <PortalRightbar />
        </div>
      </div>
      <PortalBottomNav />
    </div>
  );
}
