"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { getBuyerLoginUrl } from "@/lib/utils";

/**
 * Ensures only authenticated users see seller portal routes. Unauthenticated
 * visitors are sent to the main storefront login with ?next= back to this app.
 */
export function PortalAuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const nextUrl = typeof window !== "undefined" ? window.location.href : "";
      window.location.href = getBuyerLoginUrl(nextUrl);
    }
  }, [user, isLoading]);

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

  return <>{children}</>;
}
