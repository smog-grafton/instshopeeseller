"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { logoutApi } from "@/lib/api-client";
import { canUseSellerStoreTools } from "@/lib/portal-access";
import { getBuyerLoginUrl, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

export default function PortalTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const canManageStore = canUseSellerStoreTools(user);

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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openUserMenu = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShowUserMenu(true);
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  const scheduleCloseUserMenu = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setShowUserMenu(false);
      closeTimerRef.current = null;
    }, 150);
  };

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
          className="hidden h-9 w-9 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 sm:inline-flex lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800 hidden md:inline">Shopee Seller Centre</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0 justify-end">
        <div
          className="relative flex-shrink-0"
          ref={menuRef}
          onMouseEnter={() => {
            if (window.matchMedia("(min-width: 768px)").matches) {
              openUserMenu();
            }
          }}
          onMouseLeave={() => {
            if (window.matchMedia("(min-width: 768px)").matches) {
              scheduleCloseUserMenu();
            }
          }}
        >
          <button
            type="button"
            onClick={() => setShowUserMenu((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-label="Account menu"
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
            <span className="text-sm text-gray-700 hidden md:inline max-w-[10rem] truncate">{user?.name || "User"}</span>
            <svg
              className={`w-4 h-4 text-gray-500 hidden md:block transition-transform ${showUserMenu ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full pt-2">
              <div
                className="w-[min(16rem,calc(100vw-2rem))] max-w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-2"
                role="menu"
              >
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500 break-all">{user?.email || ""}</div>
              </div>
              <div className="py-2">
                <Link
                  href="/portal/my-account"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                  onClick={closeUserMenu}
                >
                  {canManageStore ? "My Account" : "Review Status"}
                </Link>
                {canManageStore ? (
                  <Link
                    href="/portal/my-shop"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                    onClick={closeUserMenu}
                  >
                    My Shop
                  </Link>
                ) : null}
                <Link
                  href="/portal/my-message"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                  onClick={closeUserMenu}
                >
                  My Message
                </Link>
                {canManageStore ? (
                  <>
                    <Link
                      href="/portal/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={closeUserMenu}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/portal/finance/my-balance"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={closeUserMenu}
                    >
                      My Balance
                    </Link>
                    <Link
                      href="/portal/shop/shop-information"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={closeUserMenu}
                    >
                      Shop Information
                    </Link>
                    <Link
                      href="/portal/shop/shop-setting"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={closeUserMenu}
                    >
                      Shop Settings
                    </Link>
                  </>
                ) : null}
              </div>
              <div className="border-t border-gray-100">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
