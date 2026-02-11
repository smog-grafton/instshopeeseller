"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { bulkShipOrders, getSellerOrders } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

export default function MassShipPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [shippingProvider, setShippingProvider] = useState("");
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});

  const fetchOrders = () => {
    setLoading(true);
    getSellerOrders()
      .then((res) => setOrders(res.orders?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const readyToShip = useMemo(() => orders.filter((o) => ["PROCESSING", "PAID"].includes(o.status)), [orders]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const bulkShip = async () => {
    await bulkShipOrders(selected, shippingProvider || undefined, trackingNumbers);
    setSelected([]);
    setTrackingNumbers({});
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Order</div>
        <h1 className="text-xl font-semibold text-gray-900">Mass Ship</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-sm text-gray-700">Ready to ship: {readyToShip.length}</div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={shippingProvider}
            onChange={(e) => setShippingProvider(e.target.value)}
            placeholder="Shipping provider (optional)"
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-64"
          />
          <button
            onClick={bulkShip}
            disabled={selected.length === 0}
            className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            Mark {selected.length} order(s) shipped
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Orders</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading orders...</div>
        ) : readyToShip.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No orders ready to ship.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {readyToShip.map((order) => {
              const firstItem = order.items?.[0];
              const imageUrl = firstItem?.image_url || "/images/common/no-image.png";
              return (
                <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={() => toggleSelect(order.id)}
                  />
                  <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50">
                    <Image
                      src={imageUrl}
                      alt={firstItem?.title || "Item"}
                      width={48}
                      height={48}
                      className="object-cover w-12 h-12"
                      unoptimized={isBackendImage(imageUrl)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{order.order_number}</div>
                    <div className="text-xs text-gray-500">{firstItem?.title}</div>
                  </div>
                  <input
                    value={trackingNumbers[order.id] || ""}
                    onChange={(e) => setTrackingNumbers((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Tracking number"
                    className="h-8 px-2 border border-gray-200 rounded text-xs w-44"
                  />
                  <div className="text-xs text-gray-500">Total: {Number(order.total_payment).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
