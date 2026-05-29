"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getBuyerLoginUrl } from "@/lib/utils";
import { rememberMerchantApplicationEntry, resolveSellerPortalRoute } from "@/lib/portal-access";

/**
 * Ensures only authenticated users see seller portal routes. Unauthenticated
 * visitors are sent to the main storefront login with ?next= back to this app.
 */
export function PortalAuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const nextUrl = typeof window !== "undefined" ? window.location.href : "";
      window.location.href = getBuyerLoginUrl(nextUrl);
      return;
    }

    const search = typeof window !== "undefined" ? window.location.search : "";
    const allowMerchantApplication = rememberMerchantApplicationEntry(search);
    const redirect = resolveSellerPortalRoute(user, pathname, allowMerchantApplication);

    if (!redirect) {
      return;
    }

    if (redirect.type === "external") {
      window.location.href = redirect.href;
      return;
    }

    if (redirect.href !== pathname) {
      router.replace(redirect.href);
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-4 text-gray-600">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  if (resolveSellerPortalRoute(user, pathname, rememberMerchantApplicationEntry(typeof window !== "undefined" ? window.location.search : ""))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-4 text-gray-600">Redirecting…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
