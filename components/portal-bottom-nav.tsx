"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/portal/my-account", icon: "/assets/images/icons/home.svg" },
  { label: "Chat", href: "/portal/my-message", icon: "/assets/images/icons/chat.svg" },
  { label: "Messages", href: "/portal/site-message", icon: "/assets/images/icons/messages.png" },
  { label: "Wallet", href: "/portal/wallet-management", icon: "/assets/images/icons/wallet.png" },
  { label: "Orders", href: "/portal/orders/my-orders", icon: "/assets/images/icons/store-orders.png" },
  { label: "Mine", href: "/portal/my-shop", icon: "/assets/images/icons/shop.svg" },
];

export default function PortalBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
      <Link
        href="/portal/wholesale-centre"
        className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#ee4d2d] shadow-[0_12px_28px_rgba(238,77,45,0.35)]"
        aria-label="Wholesale Center"
      >
        <Image src="/assets/images/icons/add-wholecenter.svg" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      </Link>

      <div className="grid grid-cols-[1fr_1fr_1fr_4rem_1fr_1fr_1fr] items-end gap-1">
        {navItems.slice(0, 3).map((item) => (
          <BottomNavItem key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
        <div className="h-14" aria-hidden />
        {navItems.slice(3).map((item) => (
          <BottomNavItem key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </div>
    </nav>
  );
}

function BottomNavItem({
  item,
  active,
}: {
  item: { label: string; href: string; icon: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-end gap-1 rounded-lg px-0.5 pb-1 pt-2 text-center no-underline transition ${
        active ? "bg-orange-50 text-[#ee4d2d]" : "text-neutral-600"
      }`}
    >
      <Image src={item.icon} alt="" width={26} height={26} className="h-6 w-6 object-contain" />
      <span className="w-full truncate text-[9px] font-bold leading-3">{item.label}</span>
    </Link>
  );
}
