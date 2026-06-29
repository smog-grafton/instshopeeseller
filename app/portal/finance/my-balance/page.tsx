"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getDepositPaymentMethods,
  getSellerBankAccounts,
  getWallet,
  requestWalletTopup,
  requestWalletWithdrawal,
} from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/utils";

type DepositAccount = {
  label?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  address?: string;
  network?: string;
  currency?: string;
};

type DepositMethodConfig = {
  label?: string;
  instructions?: string;
  note?: string;
  accounts?: DepositAccount[];
  bank_accounts?: DepositAccount[];
  address?: string;
  network?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  currency?: string;
  qr_code_path?: string;
  qr_code_url?: string;
};

type DepositMethod = {
  id: number;
  key: string;
  name: string;
  type: "manual" | "automatic" | string;
  logo_url?: string | null;
  config?: DepositMethodConfig | string | null;
};

type BankAccount = {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency?: string | null;
  is_default?: boolean;
};

type WalletSummary = {
  balance: string;
  currency: string;
  available_balance: string;
  pending_balance?: string;
};

type WithdrawalMethod = "bank" | "crypto" | "binance" | "mobile_money";

const withdrawalMethods: Array<{ value: WithdrawalMethod; label: string; note: string }> = [
  { value: "bank", label: "Bank account", note: "Use a saved bank account or enter payout details manually." },
  { value: "crypto", label: "Crypto wallet", note: "Send payout to a wallet address and network." },
  { value: "binance", label: "Binance ID", note: "Use your Binance account ID." },
  { value: "mobile_money", label: "Mobile money", note: "Use a provider and registered mobile money number." },
];

const fieldClass = "mt-2 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100 disabled:text-gray-500";
const inputClass = `${fieldClass} h-11`;
const textareaClass = `${fieldClass} min-h-24 py-2 leading-6`;
const secondaryButtonClass = "h-11 rounded border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:border-gray-400 hover:bg-gray-50";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const parseConfig = (config: DepositMethod["config"]): DepositMethodConfig => {
  if (!config) return {};
  if (typeof config === "string") {
    try {
      return JSON.parse(config) as DepositMethodConfig;
    } catch {
      return {};
    }
  }
  return config;
};

export default function MyBalancePage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethodId, setTopupMethodId] = useState<number | null>(null);
  const [topupReference, setTopupReference] = useState("");
  const [topupNotes, setTopupNotes] = useState("");
  const [topupProof, setTopupProof] = useState<File | null>(null);
  const [topupPreview, setTopupPreview] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>("bank");
  const [withdrawBankId, setWithdrawBankId] = useState<number | "manual" | "">("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawCryptoNetwork, setWithdrawCryptoNetwork] = useState("");
  const [withdrawCryptoAddress, setWithdrawCryptoAddress] = useState("");
  const [withdrawBinanceId, setWithdrawBinanceId] = useState("");
  const [withdrawMobileProvider, setWithdrawMobileProvider] = useState("");
  const [withdrawMobileNumber, setWithdrawMobileNumber] = useState("");
  const [withdrawPhoneNumber, setWithdrawPhoneNumber] = useState("");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const loadWallet = () => {
    setLoading(true);
    getWallet()
      .then((res) => setWallet(res.wallet))
      .finally(() => setLoading(false));
  };

  const loadMethods = () => {
    getDepositPaymentMethods()
      .then((res) => setMethods(res.methods || []))
      .catch(() => setMethods([]));
  };

  const loadAccounts = () => {
    getSellerBankAccounts()
      .then((res) => setAccounts(res.accounts || []))
      .catch(() => setAccounts([]));
  };

  useEffect(() => {
    loadWallet();
    loadMethods();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!topupProof) {
      setTopupPreview(null);
      return;
    }
    const url = URL.createObjectURL(topupProof);
    setTopupPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [topupProof]);

  useEffect(() => {
    if (!showTopup) {
      setTopupAmount("");
      setTopupMethodId(null);
      setTopupReference("");
      setTopupNotes("");
      setTopupProof(null);
      setTopupPreview(null);
      setCopiedAddress(false);
    }
  }, [showTopup]);

  useEffect(() => {
    if (!showWithdraw) {
      setWithdrawAmount("");
      setWithdrawMethod("bank");
      setWithdrawBankId("");
      setWithdrawBankName("");
      setWithdrawAccountName("");
      setWithdrawAccountNumber("");
      setWithdrawCryptoNetwork("");
      setWithdrawCryptoAddress("");
      setWithdrawBinanceId("");
      setWithdrawMobileProvider("");
      setWithdrawMobileNumber("");
      setWithdrawPhoneNumber("");
      setWithdrawConfirmed(false);
      setWithdrawNotes("");
    }
  }, [showWithdraw]);

  const selectedMethod = useMemo(() => methods.find((m) => m.id === topupMethodId) || null, [methods, topupMethodId]);
  const selectedConfig = useMemo(() => parseConfig(selectedMethod?.config), [selectedMethod]);
  const manualMethods = useMemo(() => methods.filter((m) => m.type === "manual"), [methods]);
  const autoMethods = useMemo(() => methods.filter((m) => m.type !== "manual"), [methods]);
  const isManual = selectedMethod?.type === "manual";
  const requiresProof = isManual;

  const methodAccounts = useMemo(() => {
    const config = selectedConfig || {};
    const accountsList = config.accounts || config.bank_accounts;
    if (Array.isArray(accountsList) && accountsList.length > 0) return accountsList;
    if (config.address) {
      return [
        {
          label: config.network || "Wallet Address",
          address: config.address,
          network: config.network,
        },
      ];
    }
    if (config.bank_name || config.account_number) {
      return [config];
    }
    return [];
  }, [selectedConfig]);

  const methodInstructions = selectedConfig?.instructions || selectedConfig?.note || "";
  const methodQrCode = resolveBackendAssetUrl(selectedConfig?.qr_code_url || selectedConfig?.qr_code_path);
  const methodAddress = selectedConfig?.address || methodAccounts.find((account) => account.address)?.address || "";
  const methodNetwork = selectedConfig?.network || methodAccounts.find((account) => account.network)?.network || "";

  const canSubmitTopup =
    !!topupAmount &&
    !!topupMethodId &&
    (!requiresProof || !!topupProof) &&
    Number(topupAmount) >= 10 &&
    !topupLoading;

  const canSubmitWithdraw =
    !!withdrawAmount &&
    Number(withdrawAmount) >= 10 &&
    withdrawConfirmed &&
    (
      withdrawMethod === "bank"
        ? (!!withdrawBankId || (!!withdrawBankName && !!withdrawAccountName && !!withdrawAccountNumber))
        : withdrawMethod === "crypto"
          ? !!withdrawCryptoNetwork && !!withdrawCryptoAddress
          : withdrawMethod === "binance"
            ? !!withdrawBinanceId
            : !!withdrawMobileProvider && !!withdrawMobileNumber
    ) &&
    !withdrawLoading;

  const onTopup = async () => {
    if (!canSubmitTopup || !topupMethodId) return;
    setTopupLoading(true);
    try {
      await requestWalletTopup({
        amount: Number(topupAmount),
        payment_method_id: topupMethodId,
        reference: topupReference || undefined,
        notes: topupNotes || undefined,
        proof: topupProof || undefined,
      });
      alert("Top-up request submitted. Please wait for admin approval.");
      setShowTopup(false);
      loadWallet();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to submit top-up request."));
    } finally {
      setTopupLoading(false);
    }
  };

  const copyWalletAddress = async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 1800);
    } catch {
      setCopiedAddress(false);
    }
  };

  const onWithdraw = async () => {
    if (!canSubmitWithdraw) return;
    setWithdrawLoading(true);
    try {
      const payload: Parameters<typeof requestWalletWithdrawal>[0] = {
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        notes: withdrawNotes || undefined,
        crypto_network: withdrawCryptoNetwork || undefined,
        crypto_address: withdrawCryptoAddress || undefined,
        binance_id: withdrawBinanceId || undefined,
        mobile_money_provider: withdrawMobileProvider || undefined,
        mobile_money_number: withdrawMobileNumber || undefined,
        phone_number: withdrawPhoneNumber || undefined,
      };

      if (withdrawMethod === "bank") {
        if (withdrawBankId && withdrawBankId !== "manual") {
          payload.bank_account_id = Number(withdrawBankId);
        } else {
          payload.bank_name = withdrawBankName;
          payload.bank_account_name = withdrawAccountName;
          payload.bank_account_number = withdrawAccountNumber;
        }
      }

      await requestWalletWithdrawal(payload);
      alert("Withdrawal request submitted. Processing can take up to 7 business days.");
      setShowWithdraw(false);
      loadWallet();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to submit withdrawal request."));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const onSelectBank = (value: string) => {
    if (!value) {
      setWithdrawBankId("");
      return;
    }
    if (value === "manual") {
      setWithdrawBankId("manual");
      setWithdrawBankName("");
      setWithdrawAccountName("");
      setWithdrawAccountNumber("");
      return;
    }
    const id = Number(value);
    const account = accounts.find((a) => a.id === id);
    setWithdrawBankId(id);
    setWithdrawBankName(account?.bank_name || "");
    setWithdrawAccountName(account?.account_name || "");
    setWithdrawAccountNumber(account?.account_number || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Finance</div>
        <h1 className="text-xl font-semibold text-gray-900">My Balance</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading wallet...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Balance</div>
              <div className="text-2xl font-semibold text-gray-900">{wallet?.balance || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Available</div>
              <div className="text-2xl font-semibold text-gray-900">{wallet?.available_balance || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-2xl font-semibold text-gray-900">{wallet?.pending_balance || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Top Up</div>
              <p className="text-xs text-gray-500 mb-4">
                Choose a payment gateway and submit proof to credit your wallet balance.
              </p>
              <button
                onClick={() => setShowTopup(true)}
                className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Request Top Up
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Withdraw</div>
              <p className="text-xs text-gray-500 mb-4">
                Send a withdrawal request to bank, crypto, Binance, or mobile money. Processing can take up to 7 business days.
              </p>
              <button
                onClick={() => setShowWithdraw(true)}
                className="h-9 px-4 border border-gray-200 rounded text-sm hover:bg-gray-50"
              >
                Request Withdrawal
              </button>
            </div>
          </div>
        </>
      )}

      {showTopup && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-4">
            <div className="flex w-full max-w-3xl max-h-[calc(100vh-2rem)] flex-col rounded-lg bg-white shadow-lg sm:max-h-[calc(100vh-3rem)]">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <div className="text-xs text-gray-500">Finance</div>
                  <h2 className="text-lg font-semibold text-gray-900">Request Top Up</h2>
                </div>
                <button onClick={() => setShowTopup(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <div className="min-h-0 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Amount</label>
                    <input
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      placeholder="Minimum 10"
                      type="number"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Payment Gateway</label>
                    <select
                      value={topupMethodId ?? ""}
                      onChange={(e) => setTopupMethodId(e.target.value ? Number(e.target.value) : null)}
                      className={inputClass}
                    >
                      <option value="">Select gateway</option>
                      {manualMethods.length > 0 && (
                        <optgroup label="Manual transfer">
                          {manualMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {autoMethods.length > 0 && (
                        <optgroup label="Automated">
                          {autoMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

              {selectedMethod && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-800">{selectedMethod.name} Instructions</div>
                  {methodInstructions ? (
                    <div className="text-sm text-gray-600 whitespace-pre-line">{methodInstructions}</div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Use the details below to complete payment. Need help? Use chat support.
                    </div>
                  )}
                  {methodQrCode && (
                    <div className="flex justify-center">
                      <Image
                        src={methodQrCode}
                        alt="Recharge QR code"
                        width={176}
                        height={176}
                        unoptimized
                        className="h-44 w-44 rounded border border-gray-200 bg-white object-contain p-2"
                      />
                    </div>
                  )}
                  {(methodAddress || methodNetwork) && (
                    <div className="rounded border border-gray-200 bg-white p-3 text-sm">
                      {methodNetwork && <div className="text-gray-500">Network: <span className="font-medium text-gray-800">{methodNetwork}</span></div>}
                      {methodAddress && (
                        <>
                          <div className="mt-2 text-gray-500">Wallet address</div>
                          <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-800">{methodAddress}</div>
                          <button
                            type="button"
                            onClick={() => copyWalletAddress(methodAddress)}
                            className="mt-2 text-xs font-semibold text-orange-600"
                          >
                            {copiedAddress ? "Copied" : "Copy Wallet Address"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {methodAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {methodAccounts.map((account, index: number) => (
                        <div key={`${account.label || account.bank_name || account.address}-${index}`} className="rounded border border-gray-200 bg-white p-3 text-sm">
                          <div className="font-medium text-gray-700">{account.label || account.bank_name || "Account"}</div>
                          {account.bank_name && <div className="text-gray-500">Bank: {account.bank_name}</div>}
                          {account.account_name && <div className="text-gray-500">Name: {account.account_name}</div>}
                          {account.account_number && <div className="text-gray-500">Number: {account.account_number}</div>}
                          {account.address && <div className="text-gray-500 break-all">Address: {account.address}</div>}
                          {account.network && <div className="text-gray-500">Network: {account.network}</div>}
                          {account.currency && <div className="text-gray-500">Currency: {account.currency}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No account details configured for this gateway.</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Reference / Transaction ID (optional)</label>
                  <input
                    value={topupReference}
                    onChange={(e) => setTopupReference(e.target.value)}
                    placeholder="Enter transfer reference"
                    className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Proof of transfer {requiresProof ? "*" : "(optional)"}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTopupProof(e.target.files?.[0] || null)}
                    className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                  />
                </div>
              </div>

              {topupPreview && (
                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">Proof preview</div>
                  <div className="overflow-auto rounded border border-gray-100 bg-gray-50 p-2">
                    <Image
                      src={topupPreview}
                      alt="Proof preview"
                      width={1200}
                      height={1200}
                      unoptimized
                      className="block h-auto max-h-[min(24rem,40vh)] w-auto max-w-full rounded object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500">Notes (optional)</label>
                <textarea
                  value={topupNotes}
                  onChange={(e) => setTopupNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full border border-gray-200 rounded p-2 text-sm"
                />
              </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                <button onClick={() => setShowTopup(false)} className="h-9 px-4 border border-gray-200 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={onTopup}
                  disabled={!canSubmitTopup}
                  className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {topupLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-4">
            <div className="flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col rounded-lg bg-white shadow-lg sm:max-h-[calc(100vh-3rem)]">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <div className="text-xs text-gray-500">Finance</div>
                  <h2 className="text-lg font-semibold text-gray-900">Request Withdrawal</h2>
                </div>
                <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <div className="min-h-0 overflow-y-auto p-5 space-y-4">
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs leading-5 text-orange-800">
                  Withdrawal requests are reviewed by the finance team and can take up to 7 business days.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Amount</label>
                    <input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Minimum 10"
                      type="number"
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Contact phone (optional)</label>
                    <input
                      value={withdrawPhoneNumber}
                      onChange={(e) => setWithdrawPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs text-gray-500">Payout method</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {withdrawalMethods.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setWithdrawMethod(item.value)}
                        className={`rounded-lg border p-3 text-left text-sm ${
                          withdrawMethod === item.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">{item.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {withdrawMethod === "bank" && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Use saved bank account</label>
                      <select
                        value={withdrawBankId === "" ? "" : String(withdrawBankId)}
                        onChange={(e) => onSelectBank(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_number}
                          </option>
                        ))}
                        <option value="manual">Enter manually</option>
                      </select>
                    </div>

                    {(withdrawBankId === "manual" || accounts.length === 0 || withdrawBankId === "") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500">Bank name</label>
                          <input
                            value={withdrawBankName}
                            onChange={(e) => setWithdrawBankName(e.target.value)}
                            placeholder="Bank name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Account holder name</label>
                          <input
                            value={withdrawAccountName}
                            onChange={(e) => setWithdrawAccountName(e.target.value)}
                            placeholder="Account holder name"
                            className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">Account number</label>
                          <input
                            value={withdrawAccountNumber}
                            onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                            placeholder="Account number"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {withdrawMethod === "crypto" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Network</label>
                      <input
                        value={withdrawCryptoNetwork}
                        onChange={(e) => setWithdrawCryptoNetwork(e.target.value)}
                        placeholder="USDT TRC20, BTC, ERC20"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500">Wallet address</label>
                      <textarea
                        value={withdrawCryptoAddress}
                        onChange={(e) => setWithdrawCryptoAddress(e.target.value)}
                        rows={3}
                        placeholder="Paste wallet address"
                        className={textareaClass}
                      />
                    </div>
                  </div>
                )}

                {withdrawMethod === "binance" && (
                  <div>
                    <label className="text-xs text-gray-500">Binance ID</label>
                    <input
                      value={withdrawBinanceId}
                      onChange={(e) => setWithdrawBinanceId(e.target.value)}
                      placeholder="Binance ID"
                      className={inputClass}
                    />
                  </div>
                )}

                {withdrawMethod === "mobile_money" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Provider</label>
                      <input
                        value={withdrawMobileProvider}
                        onChange={(e) => setWithdrawMobileProvider(e.target.value)}
                        placeholder="MTN, Airtel, M-Pesa"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Mobile money number</label>
                      <input
                        value={withdrawMobileNumber}
                        onChange={(e) => setWithdrawMobileNumber(e.target.value)}
                        placeholder="Registered payout number"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500">Notes (optional)</label>
                  <textarea
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    rows={3}
                    className={textareaClass}
                  />
                </div>

                <label className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                  <input
                    type="checkbox"
                    checked={withdrawConfirmed}
                    onChange={(e) => setWithdrawConfirmed(e.target.checked)}
                    className="mt-1"
                  />
                  I confirm these payout details are correct. Incorrect details can delay processing.
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                <button onClick={() => setShowWithdraw(false)} className={secondaryButtonClass}>
                  Cancel
                </button>
                <button
                  onClick={onWithdraw}
                  disabled={!canSubmitWithdraw}
                  className="h-11 rounded bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {withdrawLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
