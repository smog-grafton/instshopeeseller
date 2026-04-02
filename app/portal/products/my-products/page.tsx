"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getSellerProducts,
  getSellerProductSettings,
  getWallet,
  submitProductForReview,
  type SellerProduct,
  type SellerProductSettings,
} from "@/lib/api-client";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";
import Image from "next/image";

export default function MyProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "draft" | "pending" | "live" | "rejected" | "hidden">("all");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [productSettings, setProductSettings] = useState<SellerProductSettings | null>(null);

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
            Wallet: {currency} {(walletBalance ?? 0).toFixed(2)}
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
              return (
                <div key={product.id} className="flex items-center gap-4 p-4">
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
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{product.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Stock: {product.stock}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${product.status === "live" ? "bg-green-50 text-green-700" : product.status === "draft" ? "bg-gray-100 text-gray-600" : product.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {product.status || (product.is_active ? "Active" : "Inactive")}
                    </span>
                    {product.low_stock && <span className="text-red-600">Low stock</span>}
                    {product.catalog_link && <span className="text-blue-600">Catalog</span>}
                  </div>
                  </div>
                  <div className="text-sm text-gray-700 w-24 text-right">{currency} {Number(product.price).toFixed(2)}</div>
                  <div className="text-sm text-gray-500 w-28 text-right">ID #{product.id}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Link
                      href={canEditProducts ? `/portal/products/edit/${product.id}` : `/portal/products/preview/${product.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {canEditProducts ? "Edit" : "View"}
                    </Link>
                    <Link href={`/portal/products/preview/${product.id}`} className="text-gray-600 hover:text-gray-800">Preview</Link>
                    <Link href={`/portal/products/inventory-rules?product=${product.id}`} className="text-gray-600 hover:text-gray-800">Inventory</Link>
                    {(product.status === "draft" || product.status === "hidden") && (
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
    </div>
  );
}
