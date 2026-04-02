"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { logoutApi } from "@/lib/api-client";
import { getBuyerLoginUrl, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

export default function PortalTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = (() => {
    if (!user?.avatarUrl) return null;
    return resolveBackendAssetUrl(user.avatarUrl);
  })();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const onLogout = async () => {
    await logoutApi();
    const nextUrl = window.location.href;
    window.location.href = getBuyerLoginUrl(nextUrl);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between gap-2 px-3 sm:px-4 sticky top-0 z-20 min-w-0">
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800 hidden md:inline">Shopee Seller Centre</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 overflow-x-auto overflow-y-hidden flex-1 justify-end md:flex-initial [scrollbar-width:thin]">
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link href="/portal/wholesale-centre" className="text-gray-500 hover:text-gray-700 flex-shrink-0" title="Wholesale Centre">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 8.5h16v10.5H4z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 8.5V5h10v3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 13h3m2 0h3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            title="Help"
            onClick={() => router.push("/portal/customer-service/chat-management")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 1.5-2.5 3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </button>
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((s) => !s)}
              className="flex items-center gap-2"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user?.name || "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                  unoptimized={isBackendImage(avatarUrl)}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">
                  {user?.name?.slice(0, 1).toUpperCase() || "U"}
                </div>
              )}
              <span className="text-sm text-gray-700 hidden md:inline">{user?.name || "User"}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-[min(16rem,calc(100vw-2rem))] max-w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-800">{user?.name || "User"}</div>
                  <div className="text-xs text-gray-500 break-all">{user?.email || ""}</div>
                </div>
                <div className="py-2">
                  <Link href="/portal/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                    Dashboard
                  </Link>
                  <Link href="/portal/finance/my-balance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                    My Balance
                  </Link>
                  <Link href="/portal/shop/shop-information" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                    Shop Information
                  </Link>
                  <Link href="/portal/shop/shop-setting" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                    Shop Settings
                  </Link>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
