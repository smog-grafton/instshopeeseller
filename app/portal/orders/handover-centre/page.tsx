"use client";

import { useEffect, useState } from "react";
import { getSellerOrders, updateSellerOrderStatus } from "@/lib/api-client";

export default function HandoverCentrePage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = () => {
    setLoading(true);
    getSellerOrders({ status: "SHIPPED" })
      .then((res) => setOrders(res.orders?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Order</div>
        <h1 className="text-xl font-semibold text-gray-900">Handover Centre</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Awaiting Handover</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading shipped orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No shipped orders awaiting handover.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-800">Order #{order.order_number}</div>
                  <div className="text-xs text-gray-500">Tracking: {order.tracking_number || "—"} • {order.shipping_provider || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSellerOrderStatus(order.id, { status: "DELIVERED" }).then(fetchOrders)}
                    className="h-8 px-3 border border-gray-200 rounded text-xs hover:bg-gray-50"
                  >
                    Mark Delivered
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
