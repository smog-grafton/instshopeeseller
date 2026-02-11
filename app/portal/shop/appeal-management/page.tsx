"use client";

import { useEffect, useState } from "react";
import { getSellerProducts, submitProductAppeal } from "@/lib/api-client";

export default function AppealManagementPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<number, string>>({});

  const loadData = () => {
    setLoading(true);
    getSellerProducts({ status: "rejected", per_page: 100 })
      .then((res) => setProducts(res.products?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (id: number) => {
    const message = messages[id];
    if (!message?.trim()) return;
    await submitProductAppeal(id, message);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Shop</div>
        <h1 className="text-xl font-semibold text-gray-900">Appeal Management</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Rejected Products</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading rejected products...</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No rejected products.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="p-4 space-y-2">
                <div className="text-sm font-medium text-gray-800">{product.title}</div>
                <div className="text-xs text-gray-500">Status note: {product.status_notes || "—"}</div>
                <textarea
                  value={messages[product.id] || ""}
                  onChange={(e) => setMessages((prev) => ({ ...prev, [product.id]: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded p-2 text-sm"
                  placeholder="Explain the updates or appeal reason..."
                />
                <button
                  onClick={() => onSubmit(product.id)}
                  className="h-8 px-3 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                >
                  Submit Appeal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
