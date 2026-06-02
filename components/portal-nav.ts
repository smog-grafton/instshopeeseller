export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  icon:
    | "account"
    | "order"
    | "product"
    | "message"
    | "finance"
    | "shop"
    | "wallet"
    | "card"
    | "address"
    | "history"
    | "news"
    | "wholesale";
  items: NavItem[];
  standalone?: boolean;
  important?: boolean;
  defaultOpen?: boolean;
};

export const portalNav: NavGroup[] = [
  {
    label: "My account",
    icon: "account",
    standalone: true,
    important: true,
    defaultOpen: true,
    items: [{ label: "My account", href: "/portal/my-account" }],
  },
  {
    label: "Current balance",
    icon: "finance",
    standalone: true,
    items: [{ label: "Current balance", href: "/portal/current-balance" }],
  },
  {
    label: "My Order",
    icon: "order",
    standalone: true,
    items: [{ label: "My Order", href: "/portal/my-order" }],
  },
  {
    label: "My message",
    icon: "message",
    standalone: true,
    items: [{ label: "My message", href: "/portal/my-message" }],
  },
  {
    label: "Site message",
    icon: "message",
    standalone: true,
    items: [{ label: "Site message", href: "/portal/site-message" }],
  },
  {
    label: "Billing Details",
    icon: "finance",
    standalone: true,
    items: [{ label: "Billing Details", href: "/portal/billing-details" }],
  },
  {
    label: "Recharge record",
    icon: "wallet",
    standalone: true,
    items: [{ label: "Recharge record", href: "/portal/recharge-record" }],
  },
  {
    label: "Withdrawals record",
    icon: "wallet",
    standalone: true,
    items: [{ label: "Withdrawals record", href: "/portal/withdrawals-record" }],
  },
  {
    label: "Withdraw funds",
    icon: "finance",
    standalone: true,
    important: true,
    items: [{ label: "Withdraw funds", href: "/portal/withdraw" }],
  },
  {
    label: "Wallet management",
    icon: "wallet",
    standalone: true,
    items: [{ label: "Wallet management", href: "/portal/wallet-management" }],
  },
  {
    label: "Bank card management",
    icon: "card",
    standalone: true,
    items: [{ label: "Bank card management", href: "/portal/bank-card-management" }],
  },
  {
    label: "Shipping address management",
    icon: "address",
    standalone: true,
    items: [{ label: "Shipping address management", href: "/portal/shipping-address-management" }],
  },
  {
    label: "Stores you follow",
    icon: "shop",
    standalone: true,
    items: [{ label: "Stores you follow", href: "/portal/stores-you-follow" }],
  },
  {
    label: "Browsing history",
    icon: "history",
    standalone: true,
    items: [{ label: "Browsing history", href: "/portal/browsing-history" }],
  },
  {
    label: "Wholesale center",
    icon: "wholesale",
    standalone: true,
    important: true,
    items: [{ label: "Wholesale center", href: "/portal/wholesale-center" }],
  },
  {
    label: "My shop",
    icon: "shop",
    standalone: true,
    important: true,
    items: [{ label: "My shop", href: "/portal/my-shop" }],
  },
  {
    label: "Store news",
    icon: "news",
    standalone: true,
    items: [{ label: "Store news", href: "/portal/store-news" }],
  },
  {
    label: "Product management",
    icon: "product",
    standalone: true,
    important: true,
    items: [{ label: "Product management", href: "/portal/product-management" }],
  },
  {
    label: "Pending orders",
    icon: "order",
    standalone: true,
    important: true,
    items: [{ label: "Pending orders", href: "/portal/store-order-management" }],
  },
];
