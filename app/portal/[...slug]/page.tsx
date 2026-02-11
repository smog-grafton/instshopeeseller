"use client";

import { usePathname } from "next/navigation";

export default function PortalPlaceholderPage() {
  const pathname = usePathname();
  const title = pathname.replace("/portal/", "").split("/").map((s) => s.replace(/-/g, " ")).join(" / ");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title || "Portal Page"}</h1>
      <p className="text-sm text-gray-600 mt-2">
        This page is a placeholder. We will implement the full feature set here next.
      </p>
    </div>
  );
}
