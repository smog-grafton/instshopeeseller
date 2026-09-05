"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getSellerProducts,
  getSellerProductSettings,
  getWallet,
  relistSellerProduct,
  removeSellerProductCompletely,
  submitProductForReview,
  unlistSellerProduct,
  type SellerProduct,
  type SellerProductSettings,
} from "@/lib/api-client";
import { formatCurrencyAmount, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";
import Image from "next/image";

export default function MyProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "draft" | "pending" | "live" | "rejected" | "hidden" | "unlisted">("all");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [productSettings, setProductSettings] = useState<SellerProductSettings | null>(null);
  const [pendingAction, setPendingAction] = useState<{ product: SellerProduct; action: "unlist" | "remove" } | null>(null);
  const [actionProductId, setActionProductId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, walletRes, settingsRes] = await Promise.all([
        getSellerProducts({ search: search || undefined, status: status === "all" ? undefined : status }),
        getWallet(),
        getSellerProductSettings().catch(() => null),
      ]);
      setProducts(productsRes.products.data);
      setWalletBalance(parseFloat(walletRes.wallet.balance));
      setCurrency(walletRes.wallet.currency || "USD");
      setProductSettings(settingsRes?.settings ?? null);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  const hasFunds = (walletBalance ?? 0) > 0;
  const canEditProducts = productSettings?.can_edit_products ?? true;
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const resolveImage = (path?: string | null) => {
    return resolveBackendAssetUrl(path);
  };

  const runLifecycleAction = async (product: SellerProduct, action: "unlist" | "relist" | "remove") => {
    if (actionProductId) return;
    setActionProductId(product.id);
    try {
      const response = action === "unlist"
        ? await unlistSellerProduct(product.id)
        : action === "relist"
          ? await relistSellerProduct(product.id)
          : await removeSellerProductCompletely(product.id);
      alert(response.message);
      setPendingAction(null);
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to update this listing.");
    } finally {
      setActionProductId(null);
    }
  };

  const statusPresentation = (product: SellerProduct) => {
    if (product.status === "live" && product.is_active) return { label: "Visible", classes: "bg-green-50 text-green-700" };
    if (product.status === "hidden") return { label: "Unlisted", classes: "bg-amber-50 text-amber-700" };
    if (product.status === "rejected") return { label: "Rejected", classes: "bg-red-50 text-red-700" };
    if (product.status === "pending") return { label: "Pending Review", classes: "bg-blue-50 text-blue-700" };
    return { label: product.status === "draft" ? "Draft" : "Inactive", classes: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">My Products</h1>
          <p className="text-sm text-gray-500">Manage your shop listings and stock.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/products/add-new?tab=catalog"
            className="inline-flex items-center justify-center px-4 h-9 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 leading-none"
          >
            Add from Catalog
          </Link>
          <Link
            href="/portal/products/add-new"
            className="inline-flex items-center justify-center px-4 h-9 rounded bg-orange-600 text-white text-sm hover:bg-orange-700 leading-none"
          >
            Add New Product
          </Link>
        </div>
      </div>

      {!hasFunds && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          You need wallet funds before adding products.{" "}
          <Link href="/portal/finance/my-balance" className="text-amber-900 underline">
            Top up now
          </Link>
          .
        </div>
      )}

      {!canEditProducts && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {productSettings?.edit_lock_reason || "Product editing is currently disabled by the platform. You can still preview supplier-managed listings here."}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-72"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending review</option>
            <option value="live">Live</option>
            <option value="unlisted">Unlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
          </select>
          <button
            onClick={fetchData}
            className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
          <div className="ml-auto text-sm text-gray-500">
            Wallet: {formatCurrencyAmount(walletBalance ?? 0, currency)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Products</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No products found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product) => {
              const imageUrl = resolveImage(product.thumbnail_url);
              const presentation = statusPresentation(product);
              return (
                <div key={product.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                  <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.title}
                        width={64}
                        height={64}
                        className="object-cover"
                        unoptimized={isBackendImage(imageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">{product.title}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>Stock: {product.stock}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${presentation.classes}`}>
                      {presentation.label}
                    </span>
                    {product.low_stock && <span className="text-red-600">Low stock</span>}
                    {product.catalog_link && <span className="text-blue-600">Wholesale: {product.catalog_link.catalog_product?.title || `#${product.catalog_link.catalog_product_id}`}</span>}
                  </div>
                  </div>
                  <div className="text-sm text-gray-700 lg:w-24 lg:text-right">{formatCurrencyAmount(product.price, currency)}</div>
                  <div className="text-sm text-gray-500 lg:w-28 lg:text-right">ID #{product.id}</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link
                      href={canEditProducts ? `/portal/products/edit/${product.id}` : `/portal/products/preview/${product.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {canEditProducts ? "Edit" : "View"}
                    </Link>
                    <Link href={`/portal/products/preview/${product.id}`} className="text-gray-600 hover:text-gray-800">Preview</Link>
                    <Link href={`/portal/products/inventory-rules?product=${product.id}`} className="text-gray-600 hover:text-gray-800">Inventory</Link>
                    {product.status === "live" && product.is_active && (
                      <button onClick={() => setPendingAction({ product, action: "unlist" })} className="text-amber-700 hover:text-amber-800">
                        Unlist
                      </button>
                    )}
                    {product.status === "hidden" && product.catalog_link?.catalog_product?.listing_type === "wholesale_centre" && (
                      <button onClick={() => void runLifecycleAction(product, "relist")} disabled={actionProductId === product.id} className="text-emerald-700 hover:text-emerald-800 disabled:opacity-50">
                        {actionProductId === product.id ? "Updating..." : "Relist"}
                      </button>
                    )}
                    <button onClick={() => setPendingAction({ product, action: "remove" })} className="text-red-600 hover:text-red-700">
                      Remove Completely
                    </button>
                    {(product.status === "draft" || (product.status === "hidden" && !product.catalog_link)) && (
                      <button
                        onClick={() => submitProductForReview(product.id).then(() => fetchData())}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Submit for Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {pendingAction.action === "unlist" ? "Unlist Product?" : "Remove Product Completely?"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {pendingAction.action === "unlist"
                ? "This product will be hidden from your shop, but you can list it again later."
                : pendingAction.product.catalog_link
                  ? "This will remove the product from your shop completely. To sell it again, you will need to distribute it from the Wholesale Centre again."
                  : "This will remove the product from your shop completely. To sell it again, you will need to create and submit a new listing."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setPendingAction(null)} disabled={actionProductId !== null} className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runLifecycleAction(pendingAction.product, pendingAction.action)}
                disabled={actionProductId !== null}
                className={`h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${pendingAction.action === "remove" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
              >
                {actionProductId ? "Updating..." : pendingAction.action === "remove" ? "Remove Completely" : "Unlist Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
