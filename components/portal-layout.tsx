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
    <div className="min-h-screen bg-gray-50">
      <div className="flex relative">
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
        <div className="flex-1 min-w-0 relative">
          <PortalTopbar onOpenMenu={openMobileMenu} />
          <main className="p-4 sm:p-6 pr-4 sm:pr-20">{children}</main>
          <PortalRightbar />
        </div>
      </div>
    </div>
  );
}
