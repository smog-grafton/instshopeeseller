export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  icon: "order" | "product" | "marketing" | "customer" | "finance" | "data" | "shop" | "dashboard" | "wholesale";
  items: NavItem[];
  standalone?: boolean;
  important?: boolean;
  defaultOpen?: boolean;
};

export const portalNav: NavGroup[] = [
  {
    label: "Wholesale Centre",
    icon: "wholesale",
    standalone: true,
    important: true,
    defaultOpen: true,
    items: [{ label: "Wholesale Centre", href: "/portal/wholesale-centre" }],
  },
  {
    label: "Dashboard",
    icon: "dashboard",
    important: true,
    defaultOpen: true,
    items: [{ label: "Overview", href: "/portal/dashboard" }],
  },
  {
    label: "Orders",
    icon: "order",
    important: true,
    defaultOpen: true,
    items: [
      { label: "My Orders", href: "/portal/orders/my-orders" },
      { label: "Mass Ship", href: "/portal/orders/mass-ship" },
      { label: "Handover Centre", href: "/portal/orders/handover-centre" },
      { label: "Return/Refund/Cancel", href: "/portal/orders/return-refund-cancel" },
      { label: "Shipping Setting", href: "/portal/orders/shipping-setting" },
    ],
  },
  {
    label: "Product",
    icon: "product",
    important: true,
    defaultOpen: true,
    items: [
      { label: "My Products", href: "/portal/products/my-products" },
      { label: "Add New Product", href: "/portal/products/add-new" },
      { label: "AI Optimiser", href: "/portal/products/ai-optimiser" },
    ],
  },
  {
    label: "Shop",
    icon: "shop",
    important: true,
    defaultOpen: true,
    items: [
      { label: "Shop Information", href: "/portal/shop/shop-information" },
      { label: "Shop Decoration", href: "/portal/shop/shop-decoration" },
      { label: "Shop Setting", href: "/portal/shop/shop-setting" },
      { label: "Appeal Management", href: "/portal/shop/appeal-management" },
    ],
  },
  {
    label: "Finance",
    icon: "finance",
    important: true,
    defaultOpen: true,
    items: [
      { label: "My Income", href: "/portal/finance/my-income" },
      { label: "My Balance", href: "/portal/finance/my-balance" },
      { label: "Bank Accounts", href: "/portal/finance/bank-accounts" },
      { label: "SLoan for Sellers", href: "/portal/finance/sloan" },
    ],
  },
  {
    label: "Marketing Centre",
    icon: "marketing",
    defaultOpen: false,
    items: [
      { label: "Marketing Centre", href: "/portal/marketing/centre" },
      { label: "Cheapest on Shopee", href: "/portal/marketing/cheapest" },
      { label: "Shopee Ads", href: "/portal/marketing/ads" },
      { label: "Affiliate Marketing", href: "/portal/marketing/affiliate" },
      { label: "Live & Video", href: "/portal/marketing/live-video" },
      { label: "Discount", href: "/portal/marketing/discount" },
      { label: "My Shop's Shocking Sale", href: "/portal/marketing/shocking-sale" },
      { label: "Vouchers", href: "/portal/marketing/vouchers" },
      { label: "Campaign", href: "/portal/marketing/campaign" },
    ],
  },
  {
    label: "Customer Service",
    icon: "customer",
    defaultOpen: false,
    items: [
      { label: "Chat Management", href: "/portal/customer-service/chat-management" },
      { label: "Review Management", href: "/portal/customer-service/review-management" },
    ],
  },
  {
    label: "Data",
    icon: "data",
    defaultOpen: false,
    items: [
      { label: "Business Insights", href: "/portal/data/business-insights" },
      { label: "Account Health", href: "/portal/data/account-health" },
    ],
  },
];
