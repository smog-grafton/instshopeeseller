"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSellerProducts, updateSellerProduct } from "@/lib/api-client";

export default function InventoryRulesPage() {
  const params = useSearchParams();
  const focusId = params.get("product");
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    const res = await getSellerProducts({ search: search || undefined, per_page: 50 });
    setProducts(res.products.data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const onSave = async (p: any) => {
    setSavingId(p.id);
    try {
      await updateSellerProduct(p.id, {
        low_stock_threshold: Number(p.low_stock_threshold ?? 5),
        max_per_order: p.max_per_order ? Number(p.max_per_order) : null,
        restock_lead_days: p.restock_lead_days ? Number(p.restock_lead_days) : null,
        auto_hide_when_out_of_stock: Boolean(p.auto_hide_when_out_of_stock),
        allow_backorder: Boolean(p.allow_backorder),
      });
      alert("Inventory rules updated.");
    } catch (e: any) {
      const msg = e.errors ? Object.values(e.errors).flat().join(" ") : e.message;
      alert(msg || "Failed to update.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Inventory Rules</h1>
        <p className="text-sm text-gray-500">Configure low stock alerts and auto-hide behavior.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product..."
          className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-72"
        />
        <button onClick={load} className="ml-2 h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Products</div>
        <div className="divide-y divide-gray-100">
          {filtered.map((p) => (
            <div key={p.id} className={`p-4 ${focusId == p.id ? "bg-orange-50" : p.low_stock ? "bg-red-50" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  {p.title}
                  {p.low_stock && <span className="text-xs text-red-600">Low stock</span>}
                </div>
                <button
                  onClick={() => onSave(p)}
                  disabled={savingId === p.id}
                  className="h-8 px-3 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {savingId === p.id ? "Saving..." : "Save"}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                <div>
                  <label className="text-xs text-gray-500">Low stock threshold</label>
                  <input
                    type="number"
                    value={p.low_stock_threshold ?? 5}
                    onChange={(e) => setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, low_stock_threshold: e.target.value } : x)))}
                    className="mt-1 h-8 px-2 border border-gray-200 rounded text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max per order</label>
                  <input
                    type="number"
                    value={p.max_per_order ?? ""}
                    onChange={(e) => setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, max_per_order: e.target.value } : x)))}
                    className="mt-1 h-8 px-2 border border-gray-200 rounded text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Restock lead days</label>
                  <input
                    type="number"
                    value={p.restock_lead_days ?? ""}
                    onChange={(e) => setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, restock_lead_days: e.target.value } : x)))}
                    className="mt-1 h-8 px-2 border border-gray-200 rounded text-sm w-full"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={Boolean(p.auto_hide_when_out_of_stock)}
                    onChange={(e) => setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, auto_hide_when_out_of_stock: e.target.checked } : x)))}
                  />
                  <span className="text-xs text-gray-600">Auto-hide</span>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={Boolean(p.allow_backorder)}
                    onChange={(e) => setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, allow_backorder: e.target.checked } : x)))}
                  />
                  <span className="text-xs text-gray-600">Allow backorder</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No products found.</div>}
        </div>
      </div>
    </div>
  );
}
