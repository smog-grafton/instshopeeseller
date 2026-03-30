"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addCatalogProductToShop, getCatalogProducts, getWallet } from "@/lib/api-client";

export default function WholesaleCentrePage() {
  const router = useRouter();
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    getWallet()
      .then((res) => {
        setWalletBalance(parseFloat(res.wallet.balance));
        setCurrency(res.wallet.currency || "USD");
      })
      .catch(() => {});
  }, []);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await getCatalogProducts({
        search: catalogSearch || undefined,
        per_page: 24,
        listing_type: "wholesale_centre",
      });
      setCatalogProducts(res.products.data);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const onAdd = async (id: number, goEdit: boolean) => {
    try {
      const res = await addCatalogProductToShop(id);
      alert("Product listed in your shop (live).");
      if (goEdit) router.push(`/portal/products/edit/${res.product.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to add product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Wholesale Centre</h1>
          <p className="text-sm text-gray-500">
            List wholesale catalogue products without a wallet balance. Listings go live immediately.
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Wallet: {currency} {walletBalance.toFixed(2)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search wholesale products..."
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-72"
          />
          <button onClick={loadCatalog} className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">
            Search
          </button>
          <Link href="/portal/products/add-new?tab=catalog" className="text-sm text-blue-600 hover:text-blue-700 ml-auto">
            Standard catalog (add-new)
          </Link>
        </div>

        {catalogLoading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogProducts.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium text-gray-800">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1">{p.category_slug}</div>
                <div className="text-sm text-gray-700 mt-2 space-y-0.5">
                  <div>
                    Selling: {currency} {Number(p.base_price).toFixed(2)}
                  </div>
                  {p.wholesale_price != null && (
                    <div className="text-xs text-gray-600">
                      Supplier: {currency} {Number(p.wholesale_price).toFixed(2)}
                    </div>
                  )}
                  {Number(p.shipping_fee) > 0 && (
                    <div className="text-xs text-gray-600">Shipping (catalog): {currency} {Number(p.shipping_fee).toFixed(2)}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">Stock: {p.available_stock}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onAdd(p.id, false)}
                    className="h-9 px-3 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    Confirm listing
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdd(p.id, true)}
                    className="h-9 px-3 border border-gray-200 text-sm rounded hover:bg-gray-50"
                  >
                    List &amp; edit
                  </button>
                </div>
              </div>
            ))}
            {catalogProducts.length === 0 && <div className="text-sm text-gray-500">No wholesale products found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
