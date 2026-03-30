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

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankId, setWithdrawBankId] = useState<number | "manual" | "">("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
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
    }
  }, [showTopup]);

  useEffect(() => {
    if (!showWithdraw) {
      setWithdrawAmount("");
      setWithdrawBankId("");
      setWithdrawBankName("");
      setWithdrawAccountName("");
      setWithdrawAccountNumber("");
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

  const canSubmitTopup =
    !!topupAmount &&
    !!topupMethodId &&
    (!requiresProof || !!topupProof) &&
    Number(topupAmount) >= 10 &&
    !topupLoading;

  const canSubmitWithdraw =
    !!withdrawAmount &&
    Number(withdrawAmount) >= 10 &&
    (!!withdrawBankId || (!!withdrawBankName && !!withdrawAccountName && !!withdrawAccountNumber)) &&
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

  const onWithdraw = async () => {
    if (!canSubmitWithdraw) return;
    setWithdrawLoading(true);
    try {
      const payload: Parameters<typeof requestWalletWithdrawal>[0] = {
        amount: Number(withdrawAmount),
        notes: withdrawNotes || undefined,
      };

      if (withdrawBankId && withdrawBankId !== "manual") {
        payload.bank_account_id = Number(withdrawBankId);
      } else {
        payload.bank_name = withdrawBankName;
        payload.bank_account_name = withdrawAccountName;
        payload.bank_account_number = withdrawAccountNumber;
      }

      await requestWalletWithdrawal(payload);
      alert("Withdrawal request submitted. Please wait for processing.");
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
                Send a withdrawal request to your preferred bank account.
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
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Payment Gateway</label>
                    <select
                      value={topupMethodId ?? ""}
                      onChange={(e) => setTopupMethodId(e.target.value ? Number(e.target.value) : null)}
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
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
                      Use the details below to complete payment. Contact support if you need help.
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
                    <label className="text-xs text-gray-500">Use saved bank account</label>
                    <select
                      value={withdrawBankId === "" ? "" : String(withdrawBankId)}
                      onChange={(e) => onSelectBank(e.target.value)}
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank_name} • {account.account_number}
                        </option>
                      ))}
                      <option value="manual">Enter manually</option>
                    </select>
                  </div>
                </div>

              {(withdrawBankId === "manual" || accounts.length === 0 || withdrawBankId === "") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Bank name</label>
                    <input
                      value={withdrawBankName}
                      onChange={(e) => setWithdrawBankName(e.target.value)}
                      placeholder="Bank name"
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Account holder name</label>
                    <input
                      value={withdrawAccountName}
                      onChange={(e) => setWithdrawAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500">Account number</label>
                    <input
                      value={withdrawAccountNumber}
                      onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="mt-2 h-10 px-3 border border-gray-200 rounded text-sm w-full"
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
                  className="mt-2 w-full border border-gray-200 rounded p-2 text-sm"
                />
              </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                <button onClick={() => setShowWithdraw(false)} className="h-9 px-4 border border-gray-200 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={onWithdraw}
                  disabled={!canSubmitWithdraw}
                  className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
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
