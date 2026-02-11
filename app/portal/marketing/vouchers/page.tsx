"use client";

import { useEffect, useMemo, useState } from "react";
import { assignVoucherProducts, createSellerVoucher, getSellerProducts, getSellerVouchers, updateSellerVoucher } from "@/lib/api-client";

export default function VouchersPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    tag: "",
    valid_till: "",
    claim_label: "",
    badge_count: "",
    used_percent: "",
    claim_count: "",
    active: true,
  });
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [voucherRes, productsRes] = await Promise.all([
        getSellerVouchers(),
        getSellerProducts({ per_page: 100 }),
      ]);
      setVouchers(voucherRes.vouchers || []);
      setProducts(productsRes.products?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const onCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await createSellerVoucher({
        title: form.title,
        description: form.description,
        tag: form.tag || undefined,
        valid_till: form.valid_till || undefined,
        claim_label: form.claim_label || undefined,
        badge_count: form.badge_count ? Number(form.badge_count) : undefined,
        used_percent: form.used_percent ? Number(form.used_percent) : undefined,
        claim_count: form.claim_count ? Number(form.claim_count) : undefined,
        active: form.active,
        product_ids: selectedProducts,
      });
      setForm({
        title: "",
        description: "",
        tag: "",
        valid_till: "",
        claim_label: "",
        badge_count: "",
        used_percent: "",
        claim_count: "",
        active: true,
      });
      setSelectedProducts([]);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const productOptions = useMemo(() => products.map((p) => ({ id: p.id, title: p.title })), [products]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Vouchers</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Create Voucher</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. RM6 off)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            placeholder="Tag (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (e.g. Min Spend RM60)"
            className="h-9 px-3 border border-gray-200 rounded text-sm md:col-span-2"
          />
          <input
            type="date"
            value={form.valid_till}
            onChange={(e) => setForm((f) => ({ ...f, valid_till: e.target.value }))}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.claim_label}
            onChange={(e) => setForm((f) => ({ ...f, claim_label: e.target.value }))}
            placeholder="Claim label"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="number"
            value={form.badge_count}
            onChange={(e) => setForm((f) => ({ ...f, badge_count: e.target.value }))}
            placeholder="Badge count"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="number"
            value={form.used_percent}
            onChange={(e) => setForm((f) => ({ ...f, used_percent: e.target.value }))}
            placeholder="Used %"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="number"
            value={form.claim_count}
            onChange={(e) => setForm((f) => ({ ...f, claim_count: e.target.value }))}
            placeholder="Claim count"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">Assign to products (optional)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-auto border border-gray-100 rounded p-2">
            {productOptions.length === 0 ? (
              <div className="text-sm text-gray-500">No products found.</div>
            ) : (
              productOptions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="truncate">{p.title}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onCreate}
            disabled={saving}
            className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Voucher"}
          </button>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">My Vouchers</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading vouchers...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No vouchers yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{voucher.title}</div>
                    <div className="text-xs text-gray-500">{voucher.description}</div>
                  </div>
                  <button
                    onClick={() => updateSellerVoucher(voucher.id, { active: !voucher.active }).then(loadData)}
                    className="text-xs text-blue-600"
                  >
                    {voucher.active ? "Disable" : "Enable"}
                  </button>
                </div>
                <div className="text-xs text-gray-500">Assigned products: {voucher.products?.length ?? 0}</div>
                <div className="flex flex-wrap gap-2">
                  {(voucher.products || []).map((p: any) => (
                    <span key={p.id} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {p.title}
                    </span>
                  ))}
                </div>
                <div>
                  <button
                    onClick={() => assignVoucherProducts(voucher.id, selectedProducts).then(loadData)}
                    className="text-xs text-orange-600"
                  >
                    Assign current selection
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
