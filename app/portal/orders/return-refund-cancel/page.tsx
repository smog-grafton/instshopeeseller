"use client";

import { useEffect, useState } from "react";
import { getSellerOrders } from "@/lib/api-client";

export default function ReturnRefundCancelPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    getSellerOrders({ status: "CANCELLED" })
      .then((res) => setOrders(res.orders?.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Order</div>
        <h1 className="text-xl font-semibold text-gray-900">Return / Refund / Cancel</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Cancelled Orders</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading cancellations...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No cancellation requests.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">Order #{order.order_number}</div>
                  <div className="text-xs text-gray-500">Total: {Number(order.total_payment).toFixed(2)}</div>
                </div>
                <div className="text-xs text-red-600">Cancelled</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
