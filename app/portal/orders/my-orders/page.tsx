"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSellerOrders, updateSellerOrderStatus } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

type OrderRecord = {
  id: number;
  order_number: string;
  status: string;
  total_payment: number;
  shipping_address_snapshot?: any;
  shipping_provider?: string | null;
  tracking_number?: string | null;
  created_at: string;
  user?: { name?: string; email?: string };
  items: any[];
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function SellerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [shipInfo, setShipInfo] = useState<Record<number, { provider: string; tracking: string }>>({});

  const fetchOrders = () => {
    setLoading(true);
    getSellerOrders({
      status: status === "all" ? undefined : status,
      search: search.trim() || undefined,
    })
      .then((res) => {
        const data = res.orders?.data || [];
        setOrders(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const totalOrders = useMemo(() => orders.length, [orders]);

  const updateShipInfo = (id: number, field: "provider" | "tracking", value: string) => {
    setShipInfo((prev) => ({
      ...prev,
      [id]: {
        provider: field === "provider" ? value : prev[id]?.provider || "",
        tracking: field === "tracking" ? value : prev[id]?.tracking || "",
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Order</div>
        <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number..."
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-64"
          />
          <button onClick={fetchOrders} className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">
            Search
          </button>
          <div className="ml-auto text-sm text-gray-500">Total: {totalOrders}</div>
        </div>

        <div className="flex gap-4 border-b border-gray-100">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`relative py-2 text-sm ${status === tab.key ? "text-orange-600" : "text-gray-600"}`}
            >
              {tab.label}
              {status === tab.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-orange-600" />}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Orders</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No orders found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const address = order.shipping_address_snapshot || {};
              const items = order.items || [];
              return (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Order No:</span>{" "}
                      <span className="font-medium text-gray-800">{order.order_number}</span>
                      <span className="ml-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 w-fit">{order.status}</div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Buyer: {order.user?.name || "Customer"} • {address.fullName || ""} • {address.phoneNumber || ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ship to: {address.streetAddress || ""} {address.stateArea || ""} {address.postalCode || ""}
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const imageUrl = item.image_url || "/images/common/no-image.png";
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50">
                            <Image
                              src={imageUrl}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="object-cover w-12 h-12"
                              unoptimized={isBackendImage(imageUrl)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 truncate">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.variation || "Default"}</div>
                          </div>
                          <div className="text-sm text-gray-600">x{item.quantity}</div>
                          <div className="text-sm text-gray-800">{Number(item.unit_price).toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-700">Total: {Number(order.total_payment).toFixed(2)}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(order.status === "PROCESSING" || order.status === "PAID") && (
                        <>
                          <input
                            placeholder="Shipping provider"
                            value={shipInfo[order.id]?.provider || ""}
                            onChange={(e) => updateShipInfo(order.id, "provider", e.target.value)}
                            className="h-8 px-2 border border-gray-200 rounded text-xs"
                          />
                          <input
                            placeholder="Tracking number"
                            value={shipInfo[order.id]?.tracking || ""}
                            onChange={(e) => updateShipInfo(order.id, "tracking", e.target.value)}
                            className="h-8 px-2 border border-gray-200 rounded text-xs"
                          />
                          <button
                            onClick={() =>
                              updateSellerOrderStatus(order.id, {
                                status: "SHIPPED",
                                shipping_provider: shipInfo[order.id]?.provider || undefined,
                                tracking_number: shipInfo[order.id]?.tracking || undefined,
                              }).then(fetchOrders)
                            }
                            className="h-8 px-3 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                          >
                            Mark Shipped
                          </button>
                        </>
                      )}
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={() => updateSellerOrderStatus(order.id, { status: "DELIVERED" }).then(fetchOrders)}
                          className="h-8 px-3 border border-gray-200 rounded text-xs hover:bg-gray-50"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {order.tracking_number && (
                        <span className="text-xs text-gray-500">Tracking: {order.tracking_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
