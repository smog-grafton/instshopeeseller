"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth-provider";
import {
  createSellerWalletAddress,
  getDepositPaymentMethods,
  getCountries,
  getBrowsingHistory,
  getFollowedStores,
  getSellerAccount,
  getSellerBankAccounts,
  getSellerBillingRecords,
  getSellerRechargeRecords,
  getSellerShippingProfile,
  getSellerShop,
  getSellerSiteMessages,
  getSellerWalletAddresses,
  getSellerWithdrawalRecords,
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
import type { CountryOption } from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/utils";

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
  const amount = Number(value ?? 0);
  const prefix = currency.length <= 3 && currency !== "$" ? `${currency} ` : currency;
  return `${prefix}${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
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

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center border border-neutral-200 bg-white p-5 text-center">
      <div className="text-3xl font-bold text-red-600">{value}</div>
      <div className="mt-7 text-xl font-semibold text-black">{label}</div>
    </div>
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
  const [loginPasswordForm, setLoginPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [transactionPasswordForm, setTransactionPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [shippingForm, setShippingForm] = useState({ shipping_address: "", telephone: "", consignee_name: "" });
  const [shopForm, setShopForm] = useState({ name: "", description: "", status_text: "", store_news: "" });
  const [shopUploading, setShopUploading] = useState<"logo" | "cover" | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [accountModal, setAccountModal] = useState<"phone" | "email" | "login-password" | "transaction-password" | null>(null);
  const [phoneBindForm, setPhoneBindForm] = useState({ countryCode: "", phone: "", code: "" });
  const [phoneCode, setPhoneCode] = useState("");
  const [emailBindForm, setEmailBindForm] = useState({ oldCode: "", newEmail: "", newCode: "" });
  const [oldEmailCode, setOldEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      if (kind === "account") {
        const res = await getSellerAccount();
        setData({ account: res.account });
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
    await updateSellerLoginPassword(loginPasswordForm);
    setLoginPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    setNotice("Login password updated.");
  };

  const submitTransactionPassword = async () => {
    await updateSellerTransactionPassword(transactionPasswordForm);
    setTransactionPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    setNotice("Transaction password updated.");
    await load();
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

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12">
      <PageHeader title={titles[kind]} onRefresh={load} />
      {notice ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
      {loading ? <div className={`${panel} p-6 text-sm text-neutral-500`}>Loading...</div> : null}

      {!loading && kind === "account" ? (
        <div className="grid gap-6">
          <ReviewStatusPanel status={user?.sellerStatus} />
          <section className={`${panel} p-5`}>
            <InfoRow label="Username:" value={formatValue(account.store_name, "Store")} />
            <InfoRow label="ID:" value={formatValue(account.store_id, "Not assigned")} />
            <InfoRow
              label="Phone number:"
              value={account.phone ? String(account.phone) : "Not bound"}
              action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("phone")}>{account.phone ? "To modify" : "Go to binding"}</button>}
            />
            <InfoRow
              label="eMail:"
              value={maskEmail(formatValue(account.email, ""))}
              action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("email")}>{account.email ? "To modify" : "Go to binding"}</button>}
            />
            <InfoRow
              label="Login password:"
              value="******"
              action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("login-password")}>To modify</button>}
            />
            <InfoRow
              label="Transaction password:"
              value="******"
              action={<button className="text-sm font-semibold text-red-700" onClick={() => setAccountModal("transaction-password")}>{account.transaction_password_bound ? "To modify" : "Go to binding"}</button>}
            />
          </section>

          <section>
            <div className="grid md:grid-cols-3">
              <MetricCell label="Number of Products" value={formatValue(stats.products)} />
              <MetricCell label="Total sales today" value={formatValue(stats.total_sales_today)} />
              <MetricCell label="Total sales" value={formatValue(stats.total_sales)} />
              <MetricCell label="Today's order" value={formatValue(stats.today_order_count)} />
              <MetricCell label="Cumulative order quantity" value={formatValue(stats.cumulative_order_quantity)} />
              <MetricCell label="Sales profit" value={formatValue(stats.sales_profit)} />
              <MetricCell label="Number of followers" value={formatValue(stats.followers)} />
              <MetricCell label="Today's profit" value={formatValue(stats.today_profit)} />
              <MetricCell label="Account Balance" value={formatValue(stats.account_balance)} />
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
                    <div className="text-sm text-neutral-500">{formatValue(message.category, "")}</div>
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
          <section className="border-b border-neutral-200 pb-8">
            {resolveBackendAssetUrl(formatValue(shop.cover_image_url, "")) ? (
              <div className="mb-6 h-48 bg-neutral-100 bg-cover bg-center" style={{ backgroundImage: `url(${resolveBackendAssetUrl(formatValue(shop.cover_image_url, ""))})` }} />
            ) : null}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {resolveBackendAssetUrl(formatValue(shop.logo_url, "")) ? (
                <div className="h-36 w-36 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolveBackendAssetUrl(formatValue(shop.logo_url, ""))})` }} />
              ) : (
                <div className="flex h-36 w-36 shrink-0 items-center justify-center bg-neutral-200 text-4xl font-bold text-neutral-500">
                  {formatValue(shop.name, "S").slice(0, 1)}
                </div>
              )}
              <div className="space-y-5 text-2xl text-black">
                <div>Store Name: <span className="font-bold">{formatValue(shop.name, "My shop")}</span></div>
                <div>Account Balance: <span className="font-bold">{Number(wallet.available_balance ?? wallet.balance ?? 0).toFixed(2)}</span></div>
                <div>Store Level: <span className="font-bold">{formatValue(shop.store_level, "Crown, stars, stars")}</span></div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className={lightButton}>
                {shopUploading === "logo" ? "Uploading logo..." : "Upload logo"}
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadShopMedia(event, "logo")} disabled={shopUploading !== null} />
              </label>
              <label className={lightButton}>
                {shopUploading === "cover" ? "Uploading cover..." : "Upload cover"}
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadShopMedia(event, "cover")} disabled={shopUploading !== null} />
              </label>
            </div>
          </section>
          <div className="grid md:grid-cols-3">
            <MetricCell label="Number of Products" value={formatValue(shopStats.products_count)} />
            <MetricCell label="Total sales today" value={formatValue(shopStats.total_sales_today)} />
            <MetricCell label="Total sales" value={formatValue(shopStats.total_sales)} />
            <MetricCell label="Today's order" value={formatValue(shopStats.today_order_count)} />
            <MetricCell label="Cumulative order quantity" value={formatValue(shopStats.cumulative_order_quantity)} />
            <MetricCell label="Sales profit" value={formatValue(shopStats.sales_profit)} />
            <MetricCell label="Number of followers" value={formatValue(shopStats.followers_count)} />
            <MetricCell label="Today's profit" value={formatValue(shopStats.today_profit)} />
            <MetricCell label="Account Balance" value={money(wallet.available_balance, walletCurrency)} />
          </div>
          <section className={`${panel} p-5`}>
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
            <button className={`${redButton} mt-5`} onClick={submitShopProfile}>Save shop profile</button>
          </section>
        </>
      ) : null}

      {!loading && kind === "store-news" ? (
        <section className={`${panel} p-6`}>
          <div className="whitespace-pre-wrap text-base leading-7 text-neutral-700">{formatValue(shop.store_news, "No store news has been published yet.")}</div>
        </section>
      ) : null}

      {!loading && kind === "current-balance" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCell label="Available balance" value={money(wallet.available_balance, walletCurrency)} />
          <MetricCell label="Pending balance" value={money(wallet.pending_balance, walletCurrency)} />
          <MetricCell label="Total balance" value={money(wallet.balance, walletCurrency)} />
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
                if (accountModal === "login-password") {
                  await submitLoginPassword();
                } else {
                  await submitTransactionPassword();
                }
                setAccountModal(null);
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
