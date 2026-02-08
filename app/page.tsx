"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      // Not logged in - redirect to buyer site login
      const nextUrl = encodeURIComponent(window.location.href);
      window.location.href = `http://instshopee.test:3000/login?next=${nextUrl}`;
      return;
    }

    // Check seller status
    if (!user.isSeller || user.sellerStatus !== "approved") {
      // Not a seller or pending - go to onboarding
      router.push("/portal/my-onboarding");
    } else {
      // Approved seller - go to dashboard
      router.push("/portal/dashboard");
    }
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
