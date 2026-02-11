"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getNotifications, logoutApi } from "@/lib/api-client";
import { getBuyerLoginUrl, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

export default function PortalTopbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleNotifications = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
    setLoadingNotifications(true);
    try {
      const res = await getNotifications("wallet");
      setNotifications(res.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const onLogout = async () => {
    await logoutApi();
    const nextUrl = window.location.href;
    window.location.href = getBuyerLoginUrl(nextUrl);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">Shopee Seller Centre</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/portal/marketing/centre" className="text-gray-500 hover:text-gray-700" title="Apps">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M5 5h4v4H5zM10 5h4v4h-4zM15 5h4v4h-4zM5 10h4v4H5zM10 10h4v4h-4zM15 10h4v4h-4zM5 15h4v4H5zM10 15h4v4h-4zM15 15h4v4h-4z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Link>
        <div className="relative" ref={notifRef}>
          <button type="button" onClick={toggleNotifications} className="text-gray-500 hover:text-gray-700" title="Notifications">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 9a6 6 0 1112 0v5l2 2H4l2-2V9z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 19a3 3 0 006 0" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800">Notifications</div>
              <div className="max-h-72 overflow-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-sm text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  notifications.slice(0, 6).map((n: any) => (
                    <div key={n.id} className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm text-gray-800">{n.title || "Notification"}</div>
                      <div className="text-xs text-gray-500 mt-1">{n.message || ""}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
                Showing latest wallet updates.
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700"
          title="Help"
          onClick={() => router.push("/portal/customer-service/chat-management")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 1.5-2.5 3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
        </button>
        <div className="relative" ref={menuRef}>
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
            <span className="text-sm text-gray-700">{user?.name || "User"}</span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500">{user?.email || ""}</div>
              </div>
              <div className="py-2">
                <Link href="/portal/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/portal/finance/my-balance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  My Balance
                </Link>
                <Link href="/portal/shop/shop-information" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Shop Information
                </Link>
                <Link href="/portal/shop/shop-setting" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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
    </header>
  );
}
