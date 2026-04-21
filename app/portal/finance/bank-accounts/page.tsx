"use client";

import { useCallback, useEffect, useState } from "react";
import { createSellerBankAccount, deleteSellerBankAccount, getSellerBankAccounts, updateSellerBankAccount } from "@/lib/api-client";

type SellerBankAccount = {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency?: string | null;
  is_default: boolean;
};

export default function BankAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SellerBankAccount[]>([]);
  const [form, setForm] = useState({ bank_name: "", account_name: "", account_number: "", currency: "" });

  const loadData = useCallback(() => {
    setLoading(true);
    getSellerBankAccounts()
      .then((res) => setAccounts(res.accounts || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const onCreate = async () => {
    if (!form.bank_name || !form.account_name || !form.account_number) return;
    await createSellerBankAccount({ ...form, is_default: accounts.length === 0 });
    setForm({ bank_name: "", account_name: "", account_number: "", currency: "" });
    loadData();
  };

  const setDefault = async (id: number) => {
    await updateSellerBankAccount(id, { is_default: true });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Finance</div>
        <h1 className="text-xl font-semibold text-gray-900">Bank Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Adding a bank account is optional here. You only need one when you are ready to receive withdrawals or payouts.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Add Bank Account</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.bank_name}
            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
            placeholder="Bank name"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.account_name}
            onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
            placeholder="Account name"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.account_number}
            onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
            placeholder="Account number"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            placeholder="Currency (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <button onClick={onCreate} className="mt-4 h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
          Add Account
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Saved Accounts</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No bank accounts yet. That is okay for now, and it will not block the rest of your seller flow.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{account.bank_name}</div>
                  <div className="text-xs text-gray-500">{account.account_name} • {account.account_number}</div>
                </div>
                <div className="flex items-center gap-3">
                  {account.is_default ? (
                    <span className="text-xs text-green-600">Default</span>
                  ) : (
                    <button onClick={() => setDefault(account.id)} className="text-xs text-blue-600">
                      Set default
                    </button>
                  )}
                  <button onClick={() => deleteSellerBankAccount(account.id).then(loadData)} className="text-xs text-red-600">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
