"use client";

import { useEffect, useMemo, useState } from "react";
import { createSellerCampaign, getSellerCampaigns, getSellerProducts, updateSellerCampaign } from "@/lib/api-client";

export default function MarketingAdsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerCampaigns("ads"), getSellerProducts({ per_page: 100 })])
      .then(([c, p]) => {
        setCampaigns(c.campaigns || []);
        setProducts(p.products?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const productOptions = useMemo(() => products.map((p) => ({ id: p.id, title: p.title })), [products]);

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createSellerCampaign({
        type: "ads",
        title,
        budget: budget ? Number(budget) : null,
        status: "draft",
        meta: { product_ids: selectedProducts },
      });
      setTitle("");
      setBudget("");
      setSelectedProducts([]);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Shopee Ads</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Create Ads Campaign</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget"
            type="number"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <div className="mt-4 text-xs text-gray-500">Promote products</div>
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
          {saving ? "Saving..." : "Create Campaign"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">My Ads Campaigns</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No ads campaigns yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{c.title}</div>
                  <div className="text-xs text-gray-500">Budget: {c.budget ?? "—"}</div>
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
