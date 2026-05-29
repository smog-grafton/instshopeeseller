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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("portal_sidebar_collapsed");
    if (saved !== null) {
      setDesktopCollapsed(saved === "1");
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
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
      setMobileMenuOpen(false);
    }
  }, [isDesktop]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-gray-50">
      <div className="relative flex min-w-0 max-w-full overflow-x-hidden">
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
        <div className="relative min-w-0 flex-1 overflow-x-hidden">
          <PortalTopbar onOpenMenu={openMobileMenu} />
          <main className="max-w-full overflow-x-hidden p-4 pr-4 sm:p-6 sm:pr-20">{children}</main>
          <PortalRightbar />
        </div>
      </div>
    </div>
  );
}
