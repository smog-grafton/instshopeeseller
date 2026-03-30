"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSellerOrders, updateSellerOrderStatus } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

type ShippingAddress = {
  fullName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  stateArea?: string;
  postalCode?: string;
};

type OrderItemRecord = {
  id: number;
  title: string;
  variation?: string | null;
  quantity: number;
  unit_price: number | string;
  image_url?: string | null;
};

type OrderRecord = {
  id: number;
  order_number: string;
  status: string;
  total_payment: number;
  shipping_subtotal?: number;
  shipping_discount?: number;
  fulfillment_cost?: number | null;
  seller_payout?: number | null;
  seller_shipping_fee?: number | null;
  currency_symbol?: string | null;
  shipping_address_snapshot?: ShippingAddress;
  shipping_provider?: string | null;
  tracking_number?: string | null;
  created_at: string;
  user?: { name?: string; email?: string };
  items: OrderItemRecord[];
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "to-ship", label: "To Ship" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

type StatusTabKey = (typeof STATUS_TABS)[number]["key"];

const formatMoney = (amount: number, currencySymbol = "$") =>
  `${currencySymbol}${Number(amount || 0).toFixed(2)}`;

export default function SellerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusTabKey>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [shipInfo, setShipInfo] = useState<Record<number, { provider: string; tracking: string }>>({});

  const fetchOrders = async (nextStatus: StatusTabKey = status, nextSearch = appliedSearch) => {
    const query = nextSearch.trim() || undefined;
    const request =
      nextStatus === "to-ship"
        ? Promise.all([
            getSellerOrders({ status: "PAID", search: query }),
            getSellerOrders({ status: "PROCESSING", search: query }),
          ]).then(([paidRes, processingRes]) => {
            const combined = [
              ...(paidRes.orders?.data || []),
              ...(processingRes.orders?.data || []),
            ];
            combined.sort((a, b) => b.id - a.id);
            return combined;
          })
        : getSellerOrders({
            status: nextStatus === "all" ? undefined : nextStatus,
            search: query,
          }).then((res) => res.orders?.data || []);

    const data = await request;
    setOrders(data);
  };

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      const query = appliedSearch.trim();
      const nextStatus = status;
      const queryValue = query || undefined;
      const request =
        nextStatus === "to-ship"
          ? Promise.all([
              getSellerOrders({ status: "PAID", search: queryValue }),
              getSellerOrders({ status: "PROCESSING", search: queryValue }),
            ]).then(([paidRes, processingRes]) => {
              const combined = [
                ...(paidRes.orders?.data || []),
                ...(processingRes.orders?.data || []),
              ];
              combined.sort((a, b) => b.id - a.id);
              return combined;
            })
          : getSellerOrders({
              status: nextStatus === "all" ? undefined : nextStatus,
              search: queryValue,
            }).then((res) => res.orders?.data || []);

      const data = await request;
      if (!active) return;
      setOrders(data);
      setLoading(false);
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, [appliedSearch, status]);

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

  const handleStatusUpdate = async (
    orderId: number,
    payload: { status: string; shipping_provider?: string; tracking_number?: string }
  ) => {
    try {
      await updateSellerOrderStatus(orderId, payload);
      fetchOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update this order right now.";
      window.alert(message);
    }
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
          <button
            onClick={() => {
              setLoading(true);
              if (appliedSearch === search) {
                void fetchOrders(status, search);
                return;
              }
              setAppliedSearch(search);
            }}
            className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50"
          >
            Search
          </button>
          <div className="ml-auto text-sm text-gray-500">Total: {totalOrders}</div>
        </div>

        <div className="flex gap-4 border-b border-gray-100">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setLoading(true);
                setStatus(tab.key);
              }}
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

                  {(() => {
                    const currencySymbol = order.currency_symbol || "$";
                    const sellerShippingFee = Number(order.seller_shipping_fee ?? order.shipping_subtotal ?? 0);
                    const reservedOnShip = Number(order.fulfillment_cost ?? 0);
                    const expectedProfit = Number(
                      order.seller_payout ?? Math.max(Number(order.total_payment || 0) - reservedOnShip, 0)
                    );

                    return (
                      <div className="rounded-md border border-amber-100 bg-amber-50/70 p-3">
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 lg:grid-cols-4">
                          <div>
                            <div className="uppercase tracking-wide text-[11px] text-gray-500">Customer paid</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {formatMoney(Number(order.total_payment || 0), currencySymbol)}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide text-[11px] text-gray-500">Shop pays shipping</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {formatMoney(sellerShippingFee, currencySymbol)}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide text-[11px] text-gray-500">Reserved on ship</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {formatMoney(reservedOnShip, currencySymbol)}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide text-[11px] text-gray-500">Expected profit</div>
                            <div className="mt-1 text-sm font-semibold text-emerald-700">
                              {formatMoney(expectedProfit, currencySymbol)}
                            </div>
                          </div>
                        </div>
                        {sellerShippingFee > 0 && (
                          <div className="mt-2 text-xs text-amber-900">
                            Shipping is covered by the shop on this order and is reserved from the seller wallet when you mark it shipped.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-700">
                      Total: {formatMoney(Number(order.total_payment), order.currency_symbol || "$")}
                    </div>
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
                              handleStatusUpdate(order.id, {
                                status: "SHIPPED",
                                shipping_provider: shipInfo[order.id]?.provider || undefined,
                                tracking_number: shipInfo[order.id]?.tracking || undefined,
                              })
                            }
                            className="h-8 px-3 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                          >
                            {Number(order.fulfillment_cost || 0) > 0
                              ? `Ship & Reserve ${formatMoney(Number(order.fulfillment_cost || 0), order.currency_symbol || "$")}`
                              : "Mark Shipped"}
                          </button>
                        </>
                      )}
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, { status: "DELIVERED" })}
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
