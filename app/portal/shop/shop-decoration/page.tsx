"use client";

import { useEffect, useMemo, useState } from "react";
import { assignCollectionProducts, createSellerCollection, getSellerCollections, getSellerProducts, updateSellerCollection } from "@/lib/api-client";

export default function ShopDecorationPage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", label: "", description: "", image_url: "" });

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerCollections(), getSellerProducts({ per_page: 100 })])
      .then(([c, p]) => {
        setCollections(c.collections || []);
        setProducts(p.products?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const productOptions = useMemo(() => products.map((p) => ({ id: p.id, title: p.title })), [products]);

  const onCreate = async () => {
    if (!form.name.trim()) return;
    await createSellerCollection(form);
    setForm({ name: "", label: "", description: "", image_url: "" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Shop</div>
        <h1 className="text-xl font-semibold text-gray-900">Shop Decoration</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Create Collection</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Collection name"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="Image URL (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <button onClick={onCreate} className="mt-4 h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
          Create Collection
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Collections</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading collections...</div>
        ) : collections.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No collections yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {collections.map((collection) => (
              <div key={collection.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-800">{collection.name}</div>
                    <div className="text-xs text-gray-500">{collection.label || "—"}</div>
                  </div>
                  <button
                    onClick={() => updateSellerCollection(collection.id, { show_in_navigation: !collection.show_in_navigation }).then(loadData)}
                    className="text-xs text-blue-600"
                  >
                    {collection.show_in_navigation ? "Hide from nav" : "Show in nav"}
                  </button>
                </div>
                <div className="text-xs text-gray-500">Products: {collection.products?.length || 0}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto border border-gray-100 rounded p-2">
                  {productOptions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={(collection.products || []).some((x: any) => x.id === p.id)}
                        onChange={() => {
                          const ids = (collection.products || []).map((x: any) => x.id);
                          const next = ids.includes(p.id) ? ids.filter((x: number) => x !== p.id) : [...ids, p.id];
                          assignCollectionProducts(collection.id, next).then(loadData);
                        }}
                      />
                      <span className="truncate">{p.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
