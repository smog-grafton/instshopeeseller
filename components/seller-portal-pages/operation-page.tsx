"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  CreditCard,
  ImageIcon,
  KeyRound,
  Landmark,
  MessageCircle,
  Package,
  PackageCheck,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Upload,
  Users,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  createSellerWalletAddress,
  getCatalogProducts,
  getDepositPaymentMethods,
  getCountries,
  getBrowsingHistory,
  getFollowedStores,
  getSellerPasswordVerificationCode,
  getSellerAccount,
  getSellerBankAccounts,
  getSellerBillingRecords,
  getSellerRechargeRecords,
  getSellerShippingProfile,
  getSellerShop,
  getSellerSiteMessages,
  getSellerWalletAddresses,
  getSellerWithdrawalRecords,
  getUiBlocksSafe,
  getWallet,
  requestWalletTopup,
  updateSellerAccountProfile,
  updateSellerLoginPassword,
  updateSellerShop,
  updateSellerShippingProfile,
  updateSellerTransactionPassword,
  uploadSellerShopCover,
  uploadSellerShopLogo,
} from "@/lib/api-client";
import type { ApiUiBlock, CountryOption } from "@/lib/api-client";
import { formatCurrencyAmount, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

export type OperationPageKind =
  | "account"
  | "current-balance"
  | "site-message"
  | "billing"
  | "recharge-record"
  | "withdrawals-record"
  | "bank-card"
  | "shipping-address"
  | "followed-stores"
  | "browsing-history"
  | "my-shop"
  | "store-news"
  | "wallet-management";

type RecordMap = Record<string, unknown>;

const titles: Record<OperationPageKind, string> = {
  account: "My account",
  "current-balance": "Current balance",
  "site-message": "Site message",
  billing: "Billing Details",
  "recharge-record": "Recharge record",
  "withdrawals-record": "Withdrawals record",
  "bank-card": "Bank card management",
  "shipping-address": "Shipping address management",
  "followed-stores": "Stores you follow",
  "browsing-history": "Browsing history",
  "my-shop": "My shop",
  "store-news": "Store news",
  "wallet-management": "Wallet management",
};

const panel = "border border-neutral-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]";
const input = "h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 placeholder:text-neutral-400 outline-none caret-red-600 focus:border-red-500";
const redButton = "inline-flex h-11 items-center justify-center bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50";
const lightButton = "inline-flex h-11 items-center justify-center border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 hover:border-neutral-900";

function isRecord(value: unknown): value is RecordMap {
  return typeof value === "object" && value !== null;
}

function rows(page: unknown): RecordMap[] {
  if (Array.isArray(page)) return page.filter(isRecord);
  if (isRecord(page) && Array.isArray(page.data)) return page.data.filter(isRecord);
  return [];
}

function total(page: unknown): number {
  return Number(isRecord(page) ? page.total ?? rows(page).length : rows(page).length);
}

function lastPage(page: unknown): number {
  return Number(isRecord(page) ? page.last_page ?? 1 : 1);
}

function money(value: unknown, currency = "$") {
  return formatCurrencyAmount(value as number | string | null | undefined, currency);
}

function formatValue(value: unknown, fallback = "0") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email: string) {
  if (!email.includes("@")) return email || "Not bound";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}****@${domain}`;
}

function objectValue(value: unknown): RecordMap {
  return isRecord(value) ? value : {};
}

function paymentConfig(method: RecordMap): RecordMap {
  const config = method.config;
  if (typeof config === "string") {
    try {
      const parsed = JSON.parse(config);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return objectValue(config);
}

function PageHeader({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  return (
    <header className="border-b border-neutral-200 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-normal text-neutral-900">{title}</h1>
        {onRefresh ? (
          <button type="button" onClick={onRefresh} className={lightButton}>
            Refresh
          </button>
        ) : null}
      </div>
    </header>
  );
}

function ReviewStatusPanel({ status }: { status?: string | null }) {
  if (status !== "pending" && status !== "suspended") {
    return null;
  }

  const isPending = status === "pending";

  return (
    <section className={`${panel} overflow-hidden`}>
      <div className={`${isPending ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-900"} px-5 py-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Merchant review status</div>
            <h2 className="mt-2 text-2xl font-bold tracking-normal">
              {isPending ? "Application under review" : "Account access limited"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6">
              {isPending
                ? "Thank you for your submission. Your account is currently under review by our verification team. This process may take up to 24 hours to complete."
                : "Your seller account is currently suspended. Store management tools will remain unavailable until the account is restored."}
            </p>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${isPending ? "bg-white/80 text-amber-700" : "bg-white/80 text-red-700"}`}>
            {isPending ? "Pending review" : "Suspended"}
          </span>
        </div>
      </div>
      <div className="grid gap-px bg-neutral-200 sm:grid-cols-3">
        <div className="bg-white px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Current step</div>
          <div className="mt-2 text-sm font-semibold text-neutral-900">{isPending ? "Verification in progress" : "Access review"}</div>
        </div>
        <div className="bg-white px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Estimated time</div>
          <div className="mt-2 text-sm font-semibold text-neutral-900">{isPending ? "Up to 24 hours" : "Contact support"}</div>
        </div>
        <div className="bg-white px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Store tools</div>
          <div className="mt-2 text-sm font-semibold text-neutral-900">Locked until approved</div>
        </div>
      </div>
    </section>
  );
}

function Pager({ page, data, onPage }: { page: number; data: unknown; onPage: (page: number) => void }) {
  return (
    <div className="mt-5 flex items-center gap-3 text-sm text-neutral-600">
      <span>Total {total(data)}</span>
      <button className="h-9 w-10 border border-neutral-200 bg-neutral-50 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹
      </button>
      <span className="flex h-9 min-w-10 items-center justify-center bg-red-600 px-3 font-semibold text-white">{page}</span>
      <button className="h-9 w-10 border border-neutral-200 bg-neutral-50 disabled:opacity-40" disabled={page >= lastPage(data)} onClick={() => onPage(page + 1)}>
        ›
      </button>
    </div>
  );
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-neutral-100 py-4 sm:grid-cols-[190px_1fr_auto] sm:items-center">
      <div className="text-sm font-semibold text-neutral-500">{label}</div>
      <div className="text-base text-neutral-950">{value}</div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

type MetricTone = "red" | "orange" | "green" | "blue" | "slate";

const metricToneStyles: Record<MetricTone, string> = {
  red: "from-red-50 via-white to-white text-red-600 ring-red-100",
  orange: "from-orange-50 via-white to-white text-orange-600 ring-orange-100",
  green: "from-emerald-50 via-white to-white text-emerald-700 ring-emerald-100",
  blue: "from-sky-50 via-white to-white text-sky-700 ring-sky-100",
  slate: "from-slate-50 via-white to-white text-slate-800 ring-slate-100",
};

function ApprovedBadge({ status }: { status?: string | null }) {
  if (status !== "approved") {
    return <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold capitalize">{status || "review"}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.7a1 1 0 0 0-1.4-1.4L9 10.17 7.7 8.88a1 1 0 1 0-1.4 1.41l2 2a1 1 0 0 0 1.4 0l4-4Z"
          clipRule="evenodd"
        />
      </svg>
      Approved
    </span>
  );
}

function AccountAvatar({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] ring-4 ring-white/30 sm:h-24 sm:w-24">
      {imageUrl ? (
        <img src={imageUrl} alt="Seller avatar" className="h-full w-full object-cover" />
      ) : (
        // Fallback avatar is intentionally visual only; uploaded avatars take precedence.
        <Image src="/assets/images/icons/avatar.png" alt="Seller avatar" fill sizes="96px" className="object-cover" />
      )}
    </div>
  );
}

function MetricCell({ label, value, tone = "red" }: { label: string; value: string | number; tone?: MetricTone }) {
  return (
    <div className={`relative min-h-28 overflow-hidden rounded-lg border border-white bg-gradient-to-br p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ${metricToneStyles[tone]}`}>
      <div className="absolute right-4 top-4 h-9 w-9 rounded-full bg-current opacity-[0.08]" aria-hidden />
      <div className="relative flex h-full min-h-20 flex-col justify-between">
        <div className="break-words text-2xl font-black leading-none tabular-nums">{value}</div>
        <div className="mt-5 text-sm font-bold text-neutral-700">{label}</div>
      </div>
    </div>
  );
}

function AccountToolGrid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)] sm:p-4">
      <h2 className="px-1 text-sm font-black text-neutral-950 sm:text-base">{title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function CompactTool({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center no-underline transition hover:bg-orange-50">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#ee4d2d] ring-1 ring-orange-100">
        {icon}
      </span>
      <span className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-neutral-700">{label}</span>
    </Link>
  );
}

function resolveProductImage(product: RecordMap): string | null {
  const direct = formatValue(product.thumbnail_url || product.image_url || product.image, "");
  if (direct) return resolveBackendAssetUrl(direct) || direct;
  const images = Array.isArray(product.images) ? product.images : [];
  const first = objectValue(images[0]);
  const fromImage = formatValue(first.image_path || first.url || first.path, "");
  return fromImage ? resolveBackendAssetUrl(fromImage) || fromImage : null;
}

function moneyFromProduct(value: unknown, currency = "$") {
  return money(value, currency);
}

function LandingProductCard({ product, currency }: { product: RecordMap; currency: string }) {
  const imageUrl = resolveProductImage(product);
  const price = Number(product.base_price ?? product.price ?? product.wholesale_price ?? 0);
  const originalPrice = Number(product.compare_at_price ?? product.market_price ?? product.original_price ?? 0);
  const title = formatValue(product.title || product.name, "Wholesale product");
  const categoryRecord = objectValue(product.category);
  const category = formatValue(product.category_slug || categoryRecord.name || product.supplier_name, "Wholesale");
  const href = `/portal/wholesale-centre?product=${formatValue(product.id, "")}`;

  return (
    <Link href={href} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-black/[0.09] bg-white no-underline shadow-sm transition hover:-translate-y-px hover:border-red-500 hover:shadow-md">
      <div className="relative aspect-square bg-neutral-50">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain p-1" unoptimized={isBackendImage(imageUrl)} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">No image</div>
        )}
        <span className="absolute left-2 top-2 max-w-[80%] truncate rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-red-600 shadow-sm">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2">
        <div className="min-h-10 line-clamp-2 text-xs font-semibold leading-5 text-neutral-900 sm:text-sm">{title}</div>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-sm font-black text-red-500 sm:text-base">{moneyFromProduct(price, currency)}</span>
          {originalPrice > price ? (
            <span className="mb-0.5 truncate text-[11px] text-neutral-400 line-through">{moneyFromProduct(originalPrice, currency)}</span>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="truncate text-[11px] text-neutral-500">Supplier pick</span>
          <span className="rounded bg-red-500 px-2 py-1 text-[11px] font-bold text-white">View</span>
        </div>
      </div>
    </Link>
  );
}

function SellerAccountBanner({ banner }: { banner: ApiUiBlock }) {
  const content = (
    <div className="relative min-h-32 overflow-hidden rounded-lg bg-[#ee4d2d] px-5 py-5 text-white shadow-[0_12px_30px_rgba(238,77,45,0.18)]">
      {banner.imageSrc ? (
        <Image src={banner.imageSrc} alt="" fill sizes="100vw" className="object-cover" unoptimized={isBackendImage(banner.imageSrc)} />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" aria-hidden />
      <div className="relative z-10 max-w-lg">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/85">{banner.subtitle || "Merchant opportunity"}</div>
        <div className="mt-2 text-2xl font-black leading-tight">{banner.title || "Discover products ready to sell"}</div>
        <div className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-black text-[#ee4d2d]">
          {String(banner.meta?.ctaText || "Open now")}
        </div>
      </div>
    </div>
  );

  if (!banner.href || banner.href === "#") return content;
  return <Link href={banner.href} className="block no-underline">{content}</Link>;
}

function ShopActionCard({
  href,
  label,
  detail,
  icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 no-underline shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition hover:border-red-200 hover:bg-red-50/40">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ee4d2d] ring-1 ring-orange-100">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-neutral-950">{label}</span>
        <span className="mt-0.5 block truncate text-xs font-medium text-neutral-500">{detail}</span>
      </span>
    </Link>
  );
}

export function OperationPage({ kind }: { kind: OperationPageKind }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<RecordMap>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [walletModal, setWalletModal] = useState(false);
  const [fundsModal, setFundsModal] = useState(false);
  const [fundsStep, setFundsStep] = useState<"details" | "proof">("details");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [submittingFunds, setSubmittingFunds] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [walletForm, setWalletForm] = useState({ currency: "USDT", network: "ERC-20", address: "" });
  const [fundsForm, setFundsForm] = useState({ amount: "", methodId: "", reference: "", notes: "", proof: null as File | null });
  const [loginPasswordForm, setLoginPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "", password_verification_code: "" });
  const [passwordCode, setPasswordCode] = useState("");
  const [passwordCodeLoading, setPasswordCodeLoading] = useState(false);
  const [transactionPasswordForm, setTransactionPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [shippingForm, setShippingForm] = useState({ shipping_address: "", telephone: "", consignee_name: "" });
  const [shopForm, setShopForm] = useState({ name: "", description: "", status_text: "", store_news: "" });
  const [shopUploading, setShopUploading] = useState<"logo" | "cover" | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [accountModal, setAccountModal] = useState<"username" | "invitation-code" | "phone" | "email" | "login-password" | "transaction-password" | null>(null);
  const [usernameForm, setUsernameForm] = useState("");
  const [invitationCodeForm, setInvitationCodeForm] = useState("");
  const [phoneBindForm, setPhoneBindForm] = useState({ countryCode: "", phone: "", code: "" });
  const [phoneCode, setPhoneCode] = useState("");
  const [emailBindForm, setEmailBindForm] = useState({ oldCode: "", newEmail: "", newCode: "" });
  const [oldEmailCode, setOldEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [landingProducts, setLandingProducts] = useState<RecordMap[]>([]);
  const [accountBanners, setAccountBanners] = useState<ApiUiBlock[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      if (kind === "account") {
        const [res, productsRes, banners] = await Promise.all([
          getSellerAccount(),
          getCatalogProducts({ listing_type: "wholesale_centre", per_page: 8 }).catch(() => null),
          getUiBlocksSafe({ key: "seller_my_account" }),
        ]);
        setData({ account: res.account });
        setLandingProducts((productsRes?.products?.data || []).slice(0, 8).filter(isRecord));
        setAccountBanners(banners);
      } else if (kind === "current-balance") {
        const res = await getWallet();
        setData({ wallet: res.wallet });
      } else if (kind === "billing") {
        const res = await getSellerBillingRecords(page);
        setData({ records: res.records });
      } else if (kind === "recharge-record") {
        const res = await getSellerRechargeRecords(status, page);
        setData({ records: res.records });
      } else if (kind === "withdrawals-record") {
        const res = await getSellerWithdrawalRecords(status, page);
        setData({ records: res.records });
      } else if (kind === "site-message") {
        const res = await getSellerSiteMessages(page);
        setData({ messages: res.messages });
      } else if (kind === "bank-card") {
        const res = await getSellerBankAccounts();
        setData({ accounts: res.accounts || [] });
      } else if (kind === "shipping-address") {
        const res = await getSellerShippingProfile();
        setData({ shipping: res.shipping });
        setShippingForm({
          shipping_address: res.shipping?.shipping_address || "",
          telephone: res.shipping?.telephone || "",
          consignee_name: res.shipping?.consignee_name || "",
        });
      } else if (kind === "followed-stores") {
        const res = await getFollowedStores();
        setData({ stores: res.stores || [] });
      } else if (kind === "browsing-history") {
        const res = await getBrowsingHistory();
        setData({ history: res.items || [] });
      } else if (kind === "my-shop" || kind === "store-news") {
        const [shopRes, walletRes] = await Promise.all([getSellerShop(), getWallet().catch(() => null)]);
        setData({ shop: shopRes.shop, wallet: walletRes?.wallet });
        setShopForm({
          name: formatValue(shopRes.shop?.name, ""),
          description: formatValue(shopRes.shop?.description, ""),
          status_text: formatValue(shopRes.shop?.status_text, ""),
          store_news: formatValue(shopRes.shop?.store_news, ""),
        });
      } else if (kind === "wallet-management") {
        const [walletRes, addressRes, methodsRes] = await Promise.all([getWallet(), getSellerWalletAddresses(), getDepositPaymentMethods().catch(() => ({ methods: [] }))]);
        setData({ wallet: walletRes.wallet, addresses: addressRes.addresses || [], methods: methodsRes.methods || [] });
      }
    } finally {
      setLoading(false);
    }
  }, [kind, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (kind !== "account") return;
    getCountries()
      .then((res) => {
        const items = (res.countries || []).filter((country) => country.callingCode);
        setCountries(items);
        setPhoneBindForm((form) => ({
          ...form,
          countryCode: form.countryCode || items.find((country) => country.code === "UG")?.code || items[0]?.code || "",
        }));
      })
      .catch(() => setCountries([]));
  }, [kind]);

  const account = objectValue(data.account);
  const stats = objectValue(account.stats);
  const shop = objectValue(data.shop);
  const shopStats = objectValue(shop.display_stats);
  const wallet = objectValue(data.wallet);
  const walletCurrency = formatValue(wallet.currency, "$");
  const accountAvatarUrl = resolveBackendAssetUrl(
    formatValue(user?.avatarUrl || account.avatar_url || account.avatar, "")
  );
  const records = data.records;
  const selectedFundsMethod = rows(data.methods).find((method) => Number(method.id) === Number(fundsForm.methodId));
  const selectedFundsConfig = selectedFundsMethod ? paymentConfig(selectedFundsMethod) : {};
  const selectedFundsAddress = formatValue(selectedFundsConfig.address, "");
  const selectedFundsNetwork = formatValue(selectedFundsConfig.network, "");
  const selectedFundsQr = resolveBackendAssetUrl(formatValue(selectedFundsConfig.qr_code_url || selectedFundsConfig.qr_code_path, ""));
  const selectedFundsInstructions = formatValue(selectedFundsConfig.instructions || selectedFundsConfig.note, "");
  const tabOptions = [
    { key: "all", label: "All" },
    { key: "pending", label: "Under review" },
    { key: "approved", label: "Success" },
    { key: "rejected", label: "Fail" },
  ];

  const submitPhoneBinding = async () => {
    if (!phoneCode || phoneBindForm.code !== phoneCode) {
      setNotice("Verification code does not match.");
      return;
    }
    const country = countries.find((item) => item.code === phoneBindForm.countryCode);
    const number = `${country?.callingCode || ""}${phoneBindForm.phone}`.replace(/\s+/g, "");
    await updateSellerAccountProfile({ email: formatValue(account.email, ""), phone: number || null });
    setAccountModal(null);
    setPhoneCode("");
    setPhoneBindForm((form) => ({ ...form, phone: "", code: "" }));
    setNotice("Phone number bound.");
    await load();
  };

  const submitUsername = async () => {
    const username = usernameForm.trim();
    if (!username) {
      setNotice("Please enter a username.");
      return;
    }

    await updateSellerAccountProfile({
      email: formatValue(account.email, ""),
      phone: account.phone ? String(account.phone) : null,
      username,
    });
    setAccountModal(null);
    setNotice("Username updated.");
    await load();
  };

  const submitInvitationCode = async () => {
    const code = invitationCodeForm.trim().toUpperCase();
    if (!code) {
      setNotice("Please enter your invitation code or contact support for help.");
      return;
    }

    await updateSellerAccountProfile({
      email: formatValue(account.email, ""),
      phone: account.phone ? String(account.phone) : null,
      invitation_code: code,
    });
    setAccountModal(null);
    setNotice("Invitation code saved.");
    await load();
  };

  const submitEmailBinding = async () => {
    if (!oldEmailCode || emailBindForm.oldCode !== oldEmailCode || !newEmailCode || emailBindForm.newCode !== newEmailCode) {
      setNotice("Verification code does not match.");
      return;
    }
    await updateSellerAccountProfile({ email: emailBindForm.newEmail, phone: account.phone ? String(account.phone) : null });
    setAccountModal(null);
    setOldEmailCode("");
    setNewEmailCode("");
    setEmailBindForm({ oldCode: "", newEmail: "", newCode: "" });
    setNotice("Email address bound.");
    await load();
  };

  const submitLoginPassword = async () => {
    if (!loginPasswordForm.password_verification_code.trim()) {
      setNotice("Enter the verification code shown above.");
      return false;
    }
    await updateSellerLoginPassword(loginPasswordForm);
    setLoginPasswordForm({ current_password: "", password: "", password_confirmation: "", password_verification_code: "" });
    setPasswordCode("");
    setNotice("Login password updated.");
    return true;
  };

  const refreshPasswordCode = async () => {
    setPasswordCodeLoading(true);
    try {
      const res = await getSellerPasswordVerificationCode();
      setPasswordCode(res.code);
      setLoginPasswordForm((form) => ({ ...form, password_verification_code: "" }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load verification code.");
    } finally {
      setPasswordCodeLoading(false);
    }
  };

  const submitTransactionPassword = async () => {
    await updateSellerTransactionPassword(transactionPasswordForm);
    setTransactionPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    setNotice("Transaction password updated.");
    await load();
    return true;
  };

  const submitShipping = async () => {
    await updateSellerShippingProfile(shippingForm);
    setNotice("Shipping address saved.");
    await load();
  };

  const submitShopProfile = async () => {
    await updateSellerShop(shopForm);
    setNotice("Shop profile saved.");
    await load();
  };

  const uploadShopMedia = async (event: ChangeEvent<HTMLInputElement>, type: "logo" | "cover") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShopUploading(type);
    try {
      if (type === "logo") {
        await uploadSellerShopLogo(file);
        setNotice("Shop logo updated.");
      } else {
        await uploadSellerShopCover(file);
        setNotice("Shop cover updated.");
      }
      await load();
    } finally {
      setShopUploading(null);
      event.target.value = "";
    }
  };

  const submitWalletAddress = async () => {
    await createSellerWalletAddress({ ...walletForm, is_default: true });
    setWalletForm({ currency: "USDT", network: "ERC-20", address: "" });
    setWalletModal(false);
    await load();
  };

  const submitFunds = async () => {
    const methodId = Number(fundsForm.methodId);
    const amount = Number(fundsForm.amount);
    if (!methodId || !amount) {
      setNotice("Enter an amount and select a payment method.");
      return;
    }
    setSubmittingFunds(true);
    try {
      await requestWalletTopup({
        amount,
        payment_method_id: methodId,
        reference: fundsForm.reference || undefined,
        notes: fundsForm.notes || undefined,
        proof: fundsForm.proof,
      });
      setFundsForm({ amount: "", methodId: "", reference: "", notes: "", proof: null });
      setFundsStep("details");
      setFundsModal(false);
      setNotice("Top-up request submitted.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Top-up request failed.");
    } finally {
      setSubmittingFunds(false);
    }
  };

  const copyWalletAddress = async () => {
    if (!selectedFundsAddress) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(selectedFundsAddress);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = selectedFundsAddress;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 1800);
    } catch {
      setNotice("Copy failed. Please select and copy the address manually.");
    }
  };

  const accountBalance = Number(stats.account_balance ?? wallet.available_balance ?? wallet.balance ?? 0);
  const lowBalance = accountBalance < 200;
  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12">
      <PageHeader title={titles[kind]} onRefresh={load} />
      {notice ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
      {loading ? <div className={`${panel} p-6 text-sm text-neutral-500`}>Loading...</div> : null}

      {!loading && kind === "account" ? (
        <div className="grid gap-5">
          <ReviewStatusPanel status={user?.sellerStatus} />
          {account.has_invitation_code ? null : (
            <section className={`${panel} border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900`}>
              <div className="text-lg font-bold text-amber-950">Invitation code required</div>
              <p className="mt-1">
                Seller tools are unavailable until a valid invitation code is added to this account. Need help? Get in touch via chat support.
              </p>
              <button
                className={`${redButton} mt-4`}
                onClick={() => {
                  setInvitationCodeForm(formatValue(account.invitation_code, ""));
                  setAccountModal("invitation-code");
                }}
              >
                Add invitation code
              </button>
            </section>
          )}
          <section className="overflow-hidden rounded-lg border border-red-100 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,#e90017_0%,#ff2e3d_52%,#ff7a00_100%)] text-white shadow-[0_18px_48px_rgba(238,77,45,0.22)]">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-4">
                  <AccountAvatar imageUrl={accountAvatarUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-bold">{formatValue(account.store_name, "Shopee Seller")}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/85">
                      <span>Seller ID: {formatValue(account.store_id, "Pending")}</span>
                      <ApprovedBadge status={user?.sellerStatus} />
                    </div>
                  </div>
                </div>
                {lowBalance ? (
                  <div className="mt-5 rounded-lg border border-white/20 bg-white/12 p-3 text-sm leading-6">
                    Your balance is low. Recharge to continue processing orders smoothly.
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg bg-white p-4 text-neutral-950 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Wallet Balance</div>
                <div className="mt-2 text-3xl font-bold text-red-600">{money(accountBalance, walletCurrency)}</div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/portal/wallet-management" className="inline-flex h-11 items-center justify-center rounded bg-red-600 px-4 text-sm font-semibold text-white no-underline">
                    Recharge
                  </Link>
                  <Link href="/portal/withdraw" className="inline-flex h-11 items-center justify-center rounded border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 no-underline">
                    Withdraw
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-4">
            <AccountToolGrid title="Store Tools">
              <CompactTool href="/portal/wholesale-centre" label="Wholesale" icon={<ShoppingBag className="h-5 w-5" />} />
              <CompactTool href="/portal/products/my-products" label="Products" icon={<PackageCheck className="h-5 w-5" />} />
              <CompactTool href="/portal/orders/my-orders" label="Orders" icon={<Truck className="h-5 w-5" />} />
              <CompactTool href="/portal/my-shop" label="My Shop" icon={<Store className="h-5 w-5" />} />
            </AccountToolGrid>
            <AccountToolGrid title="Money">
              <CompactTool href="/portal/wallet-management" label="Wallet" icon={<WalletCards className="h-5 w-5" />} />
              <CompactTool href="/portal/recharge-record" label="Recharge" icon={<CreditCard className="h-5 w-5" />} />
              <CompactTool href="/portal/withdraw" label="Withdraw" icon={<Landmark className="h-5 w-5" />} />
              <CompactTool href="/portal/withdrawals-record" label="Records" icon={<ScrollText className="h-5 w-5" />} />
            </AccountToolGrid>
            <AccountToolGrid title="Communication">
              <CompactTool href="/portal/my-message" label="Chat" icon={<MessageCircle className="h-5 w-5" />} />
              <CompactTool href="/portal/site-message" label="Messages" icon={<ScrollText className="h-5 w-5" />} />
              <CompactTool href="/portal/customer-service/chat-management?support=1" label="Support" icon={<MessageCircle className="h-5 w-5" />} />
              <CompactTool href="/terms-of-service" label="Policies" icon={<ShieldCheck className="h-5 w-5" />} />
            </AccountToolGrid>
            <AccountToolGrid title="Account">
              <CompactTool href="/portal/my-shop" label="Store Details" icon={<Store className="h-5 w-5" />} />
              <CompactTool href="#account-security" label="Password" icon={<KeyRound className="h-5 w-5" />} />
              <CompactTool href="/portal/orders/shipping-setting" label="Rules" icon={<ScrollText className="h-5 w-5" />} />
              <CompactTool href="/portal/bank-card-management" label="Bank Cards" icon={<CreditCard className="h-5 w-5" />} />
            </AccountToolGrid>
          </section>

          {accountBanners[0] ? <SellerAccountBanner banner={accountBanners[0]} /> : null}

          <section className={`${panel} rounded-lg p-4 sm:p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-black text-neutral-950">Landing Products</div>
                <div className="text-sm text-neutral-500">Wholesale products ready for your storefront</div>
              </div>
              <Link href="/portal/wholesale-centre" className="text-sm font-bold text-red-600 no-underline">View all</Link>
            </div>
            {landingProducts.length ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {landingProducts.slice(0, 8).map((product) => (
                  <LandingProductCard key={formatValue(product.id)} product={product} currency={walletCurrency} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm font-medium text-neutral-500">
                No wholesale products available right now.
              </div>
            )}
          </section>

          <section id="account-security" className={`${panel} rounded-lg p-5`}>
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="text-lg font-bold text-neutral-950">Account Security</div>
                <div className="mt-2 divide-y divide-neutral-100">
                  <InfoRow label="Username" value={formatValue(account.username, "Not set")} action={<button className="text-sm font-semibold text-red-700" onClick={() => {
                    setUsernameForm(formatValue(account.username, ""));
                    setAccountModal("username");
                  }}>{account.username ? "Modify" : "Add"}</button>} />
                  <InfoRow label="Phone number" value={account.phone ? String(account.phone) : "Not bound"} action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("phone")}>{account.phone ? "Modify" : "Bind"}</button>} />
                  <InfoRow label="Email" value={maskEmail(formatValue(account.email, ""))} action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("email")}>{account.email ? "Modify" : "Bind"}</button>} />
                  <InfoRow label="Login password" value="******" action={<button className="text-sm font-semibold text-red-700" onClick={() => {
                    setAccountModal("login-password");
                    void refreshPasswordCode();
                  }}>Modify</button>} />
                  <InfoRow label="Transaction password" value="******" action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("transaction-password")}>{account.transaction_password_bound ? "Modify" : "Bind"}</button>} />
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
                <div className="text-lg font-bold text-neutral-950">Need help processing orders?</div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Shopee Support can help with frozen orders, wallet funding, processing deadlines, and payout reviews.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/portal/my-message?support=1" className="inline-flex h-11 items-center justify-center rounded bg-red-600 px-4 text-sm font-semibold text-white no-underline">Contact support</Link>
                  <Link href="/terms-of-service" className="inline-flex h-11 items-center justify-center rounded border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 no-underline">Review seller policy</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!loading && kind === "billing" ? (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {rows(records).map((record) => (
              <div className={`${panel} p-5`} key={formatValue(record.id)}>
                <div className="grid grid-cols-[150px_1fr] gap-y-4 text-xl">
                  <div className="font-semibold text-slate-500">Trading pair</div><div className="text-right font-semibold text-neutral-900">{formatValue(record.trading_pair, "")}</div>
                  <div className="font-semibold text-slate-500">ID:</div><div className="text-right text-neutral-900">{formatValue(record.id, "")}</div>
                  <div className="font-semibold text-slate-500">Amount</div><div className={`text-right text-2xl font-bold ${Number(record.amount) < 0 ? "text-red-600" : "text-emerald-600"}`}>{Number(record.amount).toFixed(2)}</div>
                  <div className="font-semibold text-slate-500">Balance</div><div className="text-right text-neutral-900">{money(record.balance, "$ ")}</div>
                  <div className="font-semibold text-slate-500">Time</div><div className="text-right text-neutral-900">{formatValue(record.time, "")}</div>
                </div>
              </div>
            ))}
          </div>
          <Pager page={page} data={records} onPage={setPage} />
        </>
      ) : null}

      {!loading && (kind === "recharge-record" || kind === "withdrawals-record") ? (
        <>
          <div className="inline-flex bg-neutral-100 p-1">
            {tabOptions.map((tab) => (
              <button
                key={tab.key}
                className={`h-12 px-6 text-lg font-semibold ${status === tab.key ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}
                onClick={() => {
                  setPage(1);
                  setStatus(tab.key);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-lg text-neutral-400">*Click on any item to view details</div>
          <div className="grid gap-5 lg:grid-cols-2">
            {rows(records).map((record) => (
              <div className={`${panel} p-5`} key={formatValue(record.id)}>
                <div className="grid grid-cols-[180px_1fr] gap-y-5 text-xl">
                  <div className="font-semibold text-slate-500">{kind === "recharge-record" ? "Recharge method" : "Withdrawal method"}</div><div className="text-right text-neutral-900">{formatValue(record.method, "")}</div>
                  <div className="font-semibold text-slate-500">Order number</div><div className="text-right text-neutral-900">{formatValue(record.order_number, "")}</div>
                  <div className="font-semibold text-slate-500">Quantity</div><div className="text-right text-neutral-900">{Number(record.quantity).toFixed(2).replace(/\\.00$/, "")}</div>
                  <div className="font-semibold text-slate-500">State</div><div className={`text-right ${record.state === "Success" ? "text-emerald-600" : record.state === "Fail" ? "text-red-600" : "text-amber-600"}`}>{formatValue(record.state, "")}</div>
                  <div className="font-semibold text-slate-500">Time</div><div className="text-right text-neutral-900">{formatValue(record.time, "")}</div>
                </div>
              </div>
            ))}
          </div>
          <Pager page={page} data={records} onPage={setPage} />
        </>
      ) : null}

      {!loading && kind === "wallet-management" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCell label="Available balance" value={money(wallet.available_balance, walletCurrency)} />
            <MetricCell label="Pending balance" value={money(wallet.pending_balance, walletCurrency)} />
            <MetricCell label="Wallet addresses" value={rows(data.addresses).length} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={redButton} onClick={() => setFundsModal(true)}>Add funds</button>
            <button className={lightButton} onClick={() => setWalletModal(true)}>Add wallet</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {rows(data.addresses).map((address: RecordMap) => (
              <div className={`${panel} p-4`} key={formatValue(address.id)}>
                <div className="text-lg font-bold text-neutral-900">{formatValue(address.currency, "")} / {formatValue(address.network, "")}</div>
                <div className="mt-2 break-all text-sm text-neutral-600">{formatValue(address.address, "")}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {!loading && kind === "site-message" ? (
        <>
          <div className="grid gap-4">
            {rows(data.messages).map((message) => (
              <article className={`${panel} p-5`} key={formatValue(message.id)}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-bold text-neutral-900">{formatValue(message.title, "")}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                      <span>{formatValue(message.category, "")}</span>
                      {message.unread ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Unread</span> : null}
                      {message.expires_at ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">Archived after expiry</span> : null}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500">{formatValue(message.sent_at, "")}</div>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{formatValue(message.message, "")}</div>
              </article>
            ))}
          </div>
          <Pager page={page} data={data.messages} onPage={setPage} />
        </>
      ) : null}

      {!loading && kind === "shipping-address" ? (
        <section className={`${panel} max-w-3xl p-6`}>
          <label className="block text-lg font-semibold text-neutral-700">Shipping address:</label>
          <textarea className={`${input} mt-2 h-28 py-3`} placeholder="Please fill in the delivery address" value={shippingForm.shipping_address} onChange={(event) => setShippingForm((form) => ({ ...form, shipping_address: event.target.value }))} />
          <label className="mt-5 block text-lg font-semibold text-neutral-700">Telephone:</label>
          <input className={`${input} mt-2`} placeholder="Please fill in the phone number" value={shippingForm.telephone} onChange={(event) => setShippingForm((form) => ({ ...form, telephone: event.target.value }))} />
          <label className="mt-5 block text-lg font-semibold text-neutral-700">Consignee name:</label>
          <input className={`${input} mt-2`} placeholder="Please fill in the name of the consignee" value={shippingForm.consignee_name} onChange={(event) => setShippingForm((form) => ({ ...form, consignee_name: event.target.value }))} />
          <button className={`${redButton} mt-6`} onClick={submitShipping}>Submit</button>
        </section>
      ) : null}

      {!loading && kind === "my-shop" ? (
        <>
          <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
            <div
              className="relative min-h-44 bg-[linear-gradient(135deg,#ee4d2d_0%,#ff7648_48%,#f7b733_100%)] bg-cover bg-center sm:min-h-56"
              style={resolveBackendAssetUrl(formatValue(shop.cover_image_url, "")) ? { backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.42),rgba(0,0,0,.08)),url(${resolveBackendAssetUrl(formatValue(shop.cover_image_url, ""))})` } : undefined}
            >
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-5 sm:left-6 sm:right-6">
                <div className="flex min-w-0 items-end gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white shadow-xl ring-4 ring-white/50 sm:h-24 sm:w-24">
                    {resolveBackendAssetUrl(formatValue(shop.logo_url, "")) ? (
                      <img src={resolveBackendAssetUrl(formatValue(shop.logo_url, "")) || ""} alt="Shop logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-3xl font-black text-neutral-500">
                        {formatValue(shop.name, "S").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pb-1 text-white">
                    <div className="truncate text-2xl font-black leading-tight sm:text-3xl">{formatValue(shop.name, "My shop")}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/18 px-2.5 py-1 backdrop-blur">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {formatValue(shop.status_text, "Official Store")}
                      </span>
                      <span>{formatValue(shop.store_level, "Crown, stars, stars")}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden rounded-lg bg-white/95 px-4 py-3 text-right shadow-lg sm:block">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Available</div>
                  <div className="mt-1 text-xl font-black text-red-600">{money(wallet.available_balance, walletCurrency)}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm font-bold text-neutral-800 hover:border-red-300 hover:bg-red-50/40">
                <Upload className="h-5 w-5 text-[#ee4d2d]" />
                {shopUploading === "logo" ? "Uploading logo..." : "Upload logo"}
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadShopMedia(event, "logo")} disabled={shopUploading !== null} />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm font-bold text-neutral-800 hover:border-red-300 hover:bg-red-50/40">
                <ImageIcon className="h-5 w-5 text-[#ee4d2d]" />
                {shopUploading === "cover" ? "Uploading cover..." : "Upload cover"}
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadShopMedia(event, "cover")} disabled={shopUploading !== null} />
              </label>
              <ShopActionCard href="/portal/products/my-products" label="Products" detail="Manage listings" icon={<Package className="h-5 w-5" />} />
              <ShopActionCard href="/portal/orders/my-orders" label="Orders" detail="Process fulfilment" icon={<Truck className="h-5 w-5" />} />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCell label="Products listed" value={formatValue(shopStats.products_count)} tone="orange" />
            <MetricCell label="Orders today" value={formatValue(shopStats.today_order_count)} tone="red" />
            <MetricCell label="Total sales" value={money(shopStats.total_sales, walletCurrency)} tone="green" />
            <MetricCell label="Followers" value={formatValue(shopStats.followers_count)} tone="blue" />
            <MetricCell label="Sales profit" value={money(shopStats.sales_profit, walletCurrency)} tone="green" />
            <MetricCell label="Today's profit" value={money(shopStats.today_profit, walletCurrency)} tone="red" />
            <MetricCell label="Cumulative orders" value={formatValue(shopStats.cumulative_order_quantity)} tone="slate" />
            <MetricCell label="Wallet balance" value={money(wallet.available_balance, walletCurrency)} tone="orange" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className={`${panel} rounded-lg p-4 sm:p-5`}>
              <div className="mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-[#ee4d2d]" />
                <div className="text-lg font-black text-neutral-950">Shop profile</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-700">Store name</span>
                  <input className={`${input} mt-2`} value={shopForm.name} onChange={(event) => setShopForm((form) => ({ ...form, name: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-700">Store status text</span>
                  <input className={`${input} mt-2`} placeholder="Official Store" value={shopForm.status_text} onChange={(event) => setShopForm((form) => ({ ...form, status_text: event.target.value }))} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-neutral-700">Description</span>
                  <textarea className={`${input} mt-2 h-28 py-3`} value={shopForm.description} onChange={(event) => setShopForm((form) => ({ ...form, description: event.target.value }))} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-neutral-700">Store news</span>
                  <textarea className={`${input} mt-2 h-28 py-3`} value={shopForm.store_news} onChange={(event) => setShopForm((form) => ({ ...form, store_news: event.target.value }))} />
                </label>
              </div>
              <button className={`${redButton} mt-5 rounded`} onClick={submitShopProfile}>Save shop profile</button>
            </div>
            <aside className="grid content-start gap-3">
              <ShopActionCard href="/portal/wholesale-centre" label="Wholesale center" detail="Source new goods" icon={<ShoppingBag className="h-5 w-5" />} />
              <ShopActionCard href="/portal/wallet-management" label="Wallet" detail="Recharge balance" icon={<WalletCards className="h-5 w-5" />} />
              <ShopActionCard href="/portal/withdraw" label="Withdraw" detail="Request payout" icon={<Landmark className="h-5 w-5" />} />
              <ShopActionCard href="/portal/my-message" label="Messages" detail="Reply to customers" icon={<MessageCircle className="h-5 w-5" />} />
              <div className={`${panel} rounded-lg p-4`}>
                <div className="flex items-center gap-2 text-sm font-black text-neutral-950">
                  <BarChart3 className="h-5 w-5 text-[#ee4d2d]" />
                  Store health
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <div className="mt-2 font-black text-neutral-950">{formatValue(shopStats.total_sales_today)}</div>
                    <div className="text-xs text-neutral-500">Sales today</div>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <Users className="h-5 w-5 text-sky-600" />
                    <div className="mt-2 font-black text-neutral-950">{formatValue(shopStats.followers_count)}</div>
                    <div className="text-xs text-neutral-500">Followers</div>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </>
      ) : null}

      {!loading && kind === "store-news" ? (
        <section className={`${panel} p-6`}>
          <div className="whitespace-pre-wrap text-base leading-7 text-neutral-700">{formatValue(shop.store_news, "No store news has been published yet.")}</div>
        </section>
      ) : null}

      {!loading && kind === "current-balance" ? (
        <div className="grid gap-4">
          {Number(wallet.available_balance ?? wallet.balance ?? 0) < 200 ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="text-base font-bold">Low Balance</div>
              <p className="mt-1 text-sm leading-6">Your balance is low. Recharge to continue processing orders smoothly.</p>
              <Link href="/portal/wallet-management" className="mt-3 inline-flex h-11 items-center justify-center rounded bg-red-600 px-5 text-sm font-semibold text-white no-underline">
                Recharge
              </Link>
            </section>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCell label="Available balance" value={money(wallet.available_balance, walletCurrency)} />
            <MetricCell label="Locked / pending balance" value={money(wallet.pending_balance, walletCurrency)} />
            <MetricCell label="Pending withdrawal" value={money(wallet.pending_withdrawal, walletCurrency)} />
            <MetricCell label="Total balance" value={money(wallet.balance, walletCurrency)} />
          </div>
          <section className={`${panel} rounded-lg p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-bold text-neutral-950">Wallet actions</div>
                <div className="mt-1 text-sm text-neutral-500">Recharge before processing high-value orders and withdraw completed payouts when ready.</div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Link href="/portal/wallet-management" className="inline-flex h-11 items-center justify-center rounded bg-red-600 px-5 text-sm font-semibold text-white no-underline">
                  Recharge
                </Link>
                <Link href="/portal/withdraw" className="inline-flex h-11 items-center justify-center rounded border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 no-underline">
                  Withdraw
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!loading && kind === "bank-card" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows(data.accounts).map((account: RecordMap) => (
            <div className={`${panel} p-5`} key={formatValue(account.id)}>
              <div className="text-lg font-bold text-neutral-900">{formatValue(account.bank_name, "")}</div>
              <div className="mt-1 text-sm text-neutral-600">{formatValue(account.account_name, "")}</div>
              <div className="mt-1 text-sm text-neutral-500">{formatValue(account.account_number, "")}</div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && kind === "followed-stores" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows(data.stores).map((store: RecordMap) => (
            <div className={`${panel} flex gap-4 p-4`} key={formatValue(store.id)}>
              {resolveBackendAssetUrl(formatValue(store.logo_url, "")) ? <div className="h-16 w-16 bg-cover bg-center" style={{ backgroundImage: `url(${resolveBackendAssetUrl(formatValue(store.logo_url, ""))})` }} /> : <div className="h-16 w-16 bg-neutral-100" />}
              <div>
                <div className="text-lg font-bold text-neutral-900">{formatValue(store.name, "")}</div>
                <div className="text-sm text-neutral-500">{formatValue(store.followers_count)} followers</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && kind === "browsing-history" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows(data.history).map((item: RecordMap) => {
            const product = objectValue(item.product);
            return (
              <div className={`${panel} flex gap-4 p-4`} key={formatValue(item.id)}>
                {resolveBackendAssetUrl(formatValue(product.thumbnail_url, "")) ? <div className="h-16 w-16 bg-cover bg-center" style={{ backgroundImage: `url(${resolveBackendAssetUrl(formatValue(product.thumbnail_url, ""))})` }} /> : <div className="h-16 w-16 bg-neutral-100" />}
                <div>
                  <div className="text-base font-bold text-neutral-900">{formatValue(product.title, "")}</div>
                  <div className="text-sm text-neutral-500">{formatValue(product.shop_name, "Shop")}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {fundsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 p-3 sm:p-4">
          <div className="flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
              <h2 className="text-2xl font-bold text-black sm:text-3xl">Add funds</h2>
              <button className="h-10 w-10 text-3xl leading-none" onClick={() => setFundsModal(false)} aria-label="Close">×</button>
            </div>

            <div className="shrink-0 border-b border-neutral-100 px-5 pt-4 sm:px-6">
              <div className="grid grid-cols-2 gap-2 rounded-sm bg-neutral-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setFundsStep("details")}
                  className={`h-10 ${fundsStep === "details" ? "bg-white text-red-600 shadow-sm" : "text-neutral-600"}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setFundsStep("proof")}
                  className={`h-10 ${fundsStep === "proof" ? "bg-white text-red-600 shadow-sm" : "text-neutral-600"}`}
                >
                  Proof
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {fundsStep === "details" ? (
                <div className="grid gap-4">
                  <input className={`${input} h-12 text-base sm:h-14 sm:text-lg`} type="number" min="10" step="0.01" value={fundsForm.amount} onChange={(event) => setFundsForm((form) => ({ ...form, amount: event.target.value }))} placeholder="Amount" />
                  <select className={`${input} h-12 text-base sm:h-14 sm:text-lg`} value={fundsForm.methodId} onChange={(event) => setFundsForm((form) => ({ ...form, methodId: event.target.value }))}>
                    <option value="">Select payment method</option>
                    {rows(data.methods).map((method) => (
                      <option key={formatValue(method.id)} value={formatValue(method.id)}>{formatValue(method.name, "Payment method")}</option>
                    ))}
                  </select>
                  {selectedFundsMethod ? (
                    <div className="border border-neutral-200 bg-neutral-50 p-4">
                      <div className="text-sm font-bold text-neutral-900">{formatValue(selectedFundsMethod.name, "Recharge method")}</div>
                      {selectedFundsInstructions ? <div className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600">{selectedFundsInstructions}</div> : null}
                      {selectedFundsQr ? (
                        <div className="mt-4 flex justify-center">
                          <Image
                            src={selectedFundsQr}
                            alt="Recharge QR code"
                            width={160}
                            height={160}
                            unoptimized
                            className="h-40 w-40 border border-neutral-200 bg-white object-contain p-2"
                          />
                        </div>
                      ) : null}
                      {(selectedFundsAddress || selectedFundsNetwork) ? (
                        <div className="mt-4 space-y-2 text-sm">
                          {selectedFundsNetwork ? <div className="text-neutral-600">Network: <span className="font-semibold text-neutral-900">{selectedFundsNetwork}</span></div> : null}
                          {selectedFundsAddress ? (
                            <div>
                              <div className="text-neutral-600">Wallet address</div>
                              <div className="mt-1 max-w-full break-all bg-white p-3 font-mono text-xs text-neutral-900">{selectedFundsAddress}</div>
                              <button
                                type="button"
                                className="mt-2 text-sm font-semibold text-red-600"
                                onClick={copyWalletAddress}
                              >
                                {copiedAddress ? "Copied" : "Copy Wallet Address"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-neutral-500">No wallet address has been configured for this method yet.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4">
                  <input className={`${input} h-12 text-base sm:h-14 sm:text-lg`} value={fundsForm.reference} onChange={(event) => setFundsForm((form) => ({ ...form, reference: event.target.value }))} placeholder="Reference / transaction ID" />
                  <input className="block w-full border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-950 file:mr-3 file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-neutral-800" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFundsForm((form) => ({ ...form, proof: event.target.files?.[0] ?? null }))} />
                  <textarea className={`${input} h-24 py-3 text-base sm:text-lg`} value={fundsForm.notes} onChange={(event) => setFundsForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Notes" />
                </div>
              )}
            </div>

            <div className="grid shrink-0 gap-3 border-t border-neutral-100 px-5 py-4 sm:grid-cols-2 sm:px-6">
              <button className={`${lightButton} h-12 w-full text-base sm:h-14 sm:text-xl`} onClick={() => setFundsModal(false)}>Cancel</button>
              <button className={`${redButton} h-12 w-full text-base sm:h-14 sm:text-xl`} onClick={submitFunds} disabled={submittingFunds}>
                {submittingFunds ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {accountModal === "phone" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">Bind mobile phone</h2>
              <button className="text-4xl leading-none" onClick={() => setAccountModal(null)}>×</button>
            </div>
            <div className="mt-5 text-xl font-semibold text-neutral-600">Phone number</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-[260px_1fr]">
              <select className={`${input} h-14 text-lg`} value={phoneBindForm.countryCode} onChange={(event) => setPhoneBindForm((form) => ({ ...form, countryCode: event.target.value }))}>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>{country.name} ({country.callingCode})</option>
                ))}
              </select>
              <input className={`${input} h-14 text-lg`} value={phoneBindForm.phone} onChange={(event) => setPhoneBindForm((form) => ({ ...form, phone: event.target.value }))} placeholder="Please enter the phone number" />
            </div>
            <div className="mt-7 text-xl font-semibold text-neutral-600">Verification code</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className={`${input} h-14 text-lg`} value={phoneBindForm.code} onChange={(event) => setPhoneBindForm((form) => ({ ...form, code: event.target.value }))} placeholder="Please enter verification code" />
              <button className={`${lightButton} h-14 border-red-500 text-red-600`} onClick={() => setPhoneCode(randomCode())}>Send the verification code</button>
            </div>
            {phoneCode ? <div className="mt-3 text-sm font-semibold text-red-600">Verification code: {phoneCode}</div> : null}
            <button className={`${redButton} mt-8 h-14 w-full text-xl`} onClick={submitPhoneBinding}>Submit</button>
          </div>
        </div>
      ) : null}

      {accountModal === "username" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">Update username</h2>
              <button className="text-4xl leading-none" onClick={() => setAccountModal(null)}>×</button>
            </div>
            <div className="mt-5 text-xl font-semibold text-neutral-600">Username</div>
            <input
              className={`${input} mt-3 h-14 text-lg`}
              value={usernameForm}
              onChange={(event) => setUsernameForm(event.target.value)}
              placeholder="Enter username"
            />
            <p className="mt-2 text-sm text-neutral-500">Use 3-50 letters, numbers, underscores, or dashes.</p>
            <button className={`${redButton} mt-8 h-14 w-full text-xl`} onClick={submitUsername}>Submit</button>
          </div>
        </div>
      ) : null}

      {accountModal === "invitation-code" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">Add invitation code</h2>
              <button className="text-4xl leading-none" onClick={() => setAccountModal(null)}>×</button>
            </div>
            <div className="mt-5 text-xl font-semibold text-neutral-600">Invitation code</div>
            <input
              className={`${input} mt-3 h-14 text-lg uppercase`}
              value={invitationCodeForm}
              onChange={(event) => setInvitationCodeForm(event.target.value.toUpperCase())}
              placeholder="Example: SHOPEE-X2"
            />
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              This code is required before seller tools can be used. Need help? Use chat support.
            </p>
            <button className={`${redButton} mt-8 h-14 w-full text-xl`} onClick={submitInvitationCode}>Submit</button>
          </div>
        </div>
      ) : null}

      {accountModal === "email" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">Bind email</h2>
              <button className="text-4xl leading-none" onClick={() => setAccountModal(null)}>×</button>
            </div>
            <div className="mt-5 text-xl font-semibold text-neutral-600">Old mailbox</div>
            <input className={`${input} mt-3 h-14 text-lg`} value={maskEmail(formatValue(account.email, ""))} disabled />
            <div className="mt-7 text-xl font-semibold text-neutral-600">Verification code</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className={`${input} h-14 text-lg`} value={emailBindForm.oldCode} onChange={(event) => setEmailBindForm((form) => ({ ...form, oldCode: event.target.value }))} placeholder="Please enter verification code" />
              <button className={`${lightButton} h-14 border-red-500 text-red-600`} onClick={() => setOldEmailCode(randomCode())}>Send the verification code</button>
            </div>
            {oldEmailCode ? <div className="mt-3 text-sm font-semibold text-red-600">Old mailbox code: {oldEmailCode}</div> : null}
            <div className="mt-7 text-xl font-semibold text-neutral-600">New mail box</div>
            <input className={`${input} mt-3 h-14 text-lg`} value={emailBindForm.newEmail} onChange={(event) => setEmailBindForm((form) => ({ ...form, newEmail: event.target.value }))} placeholder="Please input the email address" />
            <div className="mt-7 text-xl font-semibold text-neutral-600">Verification code</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className={`${input} h-14 text-lg`} value={emailBindForm.newCode} onChange={(event) => setEmailBindForm((form) => ({ ...form, newCode: event.target.value }))} placeholder="Please enter verification code" />
              <button className={`${lightButton} h-14 border-red-500 text-red-600`} onClick={() => setNewEmailCode(randomCode())}>Send the verification code</button>
            </div>
            {newEmailCode ? <div className="mt-3 text-sm font-semibold text-red-600">New mailbox code: {newEmailCode}</div> : null}
            <button className={`${redButton} mt-8 h-14 w-full text-xl`} onClick={submitEmailBinding}>Submit</button>
          </div>
        </div>
      ) : null}

      {accountModal === "login-password" || accountModal === "transaction-password" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">{accountModal === "login-password" ? "Modify login password" : "Modify transaction password"}</h2>
              <button className="text-4xl leading-none" onClick={() => setAccountModal(null)}>×</button>
            </div>
            <div className="mt-6 space-y-3">
              {accountModal === "login-password" ? (
                <>
                  <input className={input} type="password" value={loginPasswordForm.current_password} onChange={(event) => setLoginPasswordForm((form) => ({ ...form, current_password: event.target.value }))} placeholder="Current password" />
                  <input className={input} type="password" value={loginPasswordForm.password} onChange={(event) => setLoginPasswordForm((form) => ({ ...form, password: event.target.value }))} placeholder="New password" />
                  <input className={input} type="password" value={loginPasswordForm.password_confirmation} onChange={(event) => setLoginPasswordForm((form) => ({ ...form, password_confirmation: event.target.value }))} placeholder="Confirm new password" />
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Verification code</div>
                        <div className="mt-1 font-mono text-2xl font-black tracking-[0.18em] text-neutral-950">{passwordCode || "------"}</div>
                      </div>
                      <button type="button" className={`${lightButton} h-10 px-3 text-xs`} onClick={refreshPasswordCode} disabled={passwordCodeLoading}>
                        {passwordCodeLoading ? "Loading..." : "Refresh"}
                      </button>
                    </div>
                  </div>
                  <input className={input} value={loginPasswordForm.password_verification_code} onChange={(event) => setLoginPasswordForm((form) => ({ ...form, password_verification_code: event.target.value.toUpperCase() }))} placeholder="Enter verification code" />
                </>
              ) : (
                <>
                  {account.transaction_password_bound ? <input className={input} type="password" value={transactionPasswordForm.current_password} onChange={(event) => setTransactionPasswordForm((form) => ({ ...form, current_password: event.target.value }))} placeholder="Current transaction password" /> : null}
                  <input className={input} type="password" value={transactionPasswordForm.password} onChange={(event) => setTransactionPasswordForm((form) => ({ ...form, password: event.target.value }))} placeholder="New transaction password" />
                  <input className={input} type="password" value={transactionPasswordForm.password_confirmation} onChange={(event) => setTransactionPasswordForm((form) => ({ ...form, password_confirmation: event.target.value }))} placeholder="Confirm transaction password" />
                </>
              )}
            </div>
            <button
              className={`${redButton} mt-8 h-14 w-full text-xl`}
              onClick={async () => {
                let saved = false;
                if (accountModal === "login-password") {
                  saved = await submitLoginPassword();
                } else {
                  saved = await submitTransactionPassword();
                }
                if (saved) setAccountModal(null);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}

      {walletModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
              <h2 className="text-3xl font-bold text-black">Add wallet</h2>
              <button className="text-4xl leading-none" onClick={() => setWalletModal(false)}>×</button>
            </div>
            <div className="mt-6 text-xl font-semibold text-neutral-600">Select currency</div>
            <div className="relative mt-3">
              <button className={`flex h-14 w-full items-center justify-between border bg-white px-4 text-left text-xl font-semibold text-neutral-950 ${currencyOpen ? "border-red-500" : "border-neutral-300"}`} onClick={() => setCurrencyOpen((open) => !open)}>
                {walletForm.currency} / {walletForm.network}
                <span>{currencyOpen ? "⌃" : "⌄"}</span>
              </button>
              {currencyOpen ? (
                <div className="absolute left-0 top-[68px] z-10 grid w-[125%] grid-cols-2 border border-neutral-300 bg-white shadow-xl">
                  <div className="border-r border-neutral-200 p-8 text-xl font-bold text-red-600">USDT <span className="float-right">›</span></div>
                  <div className="space-y-7 p-8 text-xl text-neutral-600">
                    {["TRC-20", "ERC-20", "BitCoin"].map((network) => (
                      <button key={network} className={`block text-left ${walletForm.network === network ? "font-bold text-red-600" : ""}`} onClick={() => {
                        setWalletForm((form) => ({ ...form, currency: network === "BitCoin" ? "BTC" : "USDT", network }));
                        setCurrencyOpen(false);
                      }}>
                        {walletForm.network === network ? "✓ " : ""}{network}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-8 text-xl font-semibold text-neutral-600">Virtual currency address</div>
            <input className={`${input} mt-3 h-14 text-lg`} value={walletForm.address} onChange={(event) => setWalletForm((form) => ({ ...form, address: event.target.value }))} placeholder="Please enter the virtual currency address" />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <button className={`${lightButton} h-14 w-full text-xl`} onClick={() => setWalletModal(false)}>Cancel</button>
              <button className={`${redButton} h-14 w-full text-xl`} disabled={!walletForm.address.trim()} onClick={submitWalletAddress}>Submit</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
