"use client";

import { useEffect, useMemo, useState } from "react";
import { createSellerCampaign, getSellerCampaigns, getSellerProducts, updateSellerCampaign } from "@/lib/api-client";

export default function DiscountPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerCampaigns("discount"), getSellerProducts({ per_page: 100 })])
      .then(([c, p]) => {
        setCampaigns(c.campaigns || []);
        setProducts(p.products?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onCreate = async () => {
    if (!title.trim() || !discount) return;
    setSaving(true);
    try {
      await createSellerCampaign({
        type: "discount",
        title,
        status: "draft",
        start_at: startAt || null,
        end_at: endAt || null,
        meta: {
          discount_percent: Number(discount),
          product_ids: selectedProducts,
        },
      });
      setTitle("");
      setDiscount("");
      setStartAt("");
      setEndAt("");
      setSelectedProducts([]);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const productOptions = useMemo(() => products.map((p) => ({ id: p.id, title: p.title })), [products]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Discount</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Create Discount Campaign</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="Discount %"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <div className="mt-4 text-xs text-gray-500">Apply discount to products</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto border border-gray-100 rounded p-2">
          {productOptions.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
              <span className="truncate">{p.title}</span>
            </label>
          ))}
        </div>
        <button
          onClick={onCreate}
          disabled={saving}
          className="mt-4 h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Discount"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Discount Campaigns</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No discount campaigns.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{c.title}</div>
                  <div className="text-xs text-gray-500">Discount: {c.meta?.discount_percent || "—"}%</div>
                </div>
                <button
                  onClick={() => updateSellerCampaign(c.id, { status: c.status === "running" ? "paused" : "running" }).then(loadData)}
                  className="text-xs text-blue-600"
                >
                  {c.status === "running" ? "Pause" : "Run"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
