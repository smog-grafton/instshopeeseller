"use client";

import { useEffect, useState } from "react";
import { getSellerProducts, getSellerShockingSale, requestShockingSaleSlot } from "@/lib/api-client";

export default function ShockingSalePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [requestedPrice, setRequestedPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerShockingSale(), getSellerProducts({ per_page: 100 })])
      .then(([res, prod]) => {
        setItems(res.items || []);
        setRequests(res.requests || []);
        setProducts(prod.products?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRequest = async () => {
    if (!productId || !requestedPrice) return;
    setSaving(true);
    try {
      await requestShockingSaleSlot(Number(productId), Number(requestedPrice));
      setProductId("");
      setRequestedPrice("");
      loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">My Shop's Shocking Sale</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Request Slot</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={requestedPrice}
            onChange={(e) => setRequestedPrice(e.target.value)}
            placeholder="Requested price"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={onRequest}
            disabled={saving}
            className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Active Shocking Sale Items</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No shocking sale items.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{item.product?.title || "Product"}</div>
                  <div className="text-xs text-gray-500">Session: {item.session?.label || "—"}</div>
                </div>
                <div className="text-xs text-gray-500">{item.status_value || "Active"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Requests</div>
        {requests.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No requests submitted.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between">
                <div className="text-sm text-gray-800">Request #{req.id}</div>
                <div className="text-xs text-gray-500">Status: {req.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
