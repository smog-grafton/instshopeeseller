"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getBuyerLoginUrl } from "@/lib/utils";
import { resolveSellerPortalEntry } from "@/lib/portal-access";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      // Not logged in - redirect to buyer site login
      const nextUrl = window.location.href;
      window.location.href = getBuyerLoginUrl(nextUrl);
      return;
    }

    const destination = resolveSellerPortalEntry(user);

    if (destination.type === "external") {
      window.location.href = destination.href;
      return;
    }

    router.replace(destination.href);
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
