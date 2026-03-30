"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  addCatalogProductToShop,
  createSellerProduct,
  getCatalogProducts,
  getCategories,
  getWallet,
} from "@/lib/api-client";

type Spec = { label: string; value: string };
type Variant = { type: "color" | "size"; label: string; sku?: string; price?: string; original_price?: string; stock?: string };

function AddNewProductContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialTab = params.get("tab") === "catalog" ? "catalog" : "custom";
  const [tab, setTab] = useState<"custom" | "catalog">(initialTab);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");

  // Custom product fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [shippingText, setShippingText] = useState("");
  const [shippingSubtext, setShippingSubtext] = useState("");
  const [guaranteeText, setGuaranteeText] = useState("");
  const [status, setStatus] = useState<"draft" | "live">("draft");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [maxPerOrder, setMaxPerOrder] = useState("");
  const [restockLeadDays, setRestockLeadDays] = useState("");
  const [autoHide, setAutoHide] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [specs, setSpecs] = useState<Spec[]>([{ label: "", value: "" }]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Catalog
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const hasFunds = walletBalance > 0;

  useEffect(() => {
    getWallet().then((res) => {
      setWalletBalance(parseFloat(res.wallet.balance));
      setCurrency(res.wallet.currency || "USD");
    }).catch(() => {});
    getCategories().then((res) => setCategories(res.categories || [])).catch(() => {});
  }, []);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await getCatalogProducts({
        search: catalogSearch || undefined,
        per_page: 20,
        listing_type: "standard",
      });
      setCatalogProducts(res.products.data);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "catalog") loadCatalog();
  }, [tab]);

  const onAddCatalog = async (p: { id: number; listing_type?: string }, goEdit = false) => {
    const isWholesale = p.listing_type === "wholesale_centre";
    if (!isWholesale && !hasFunds) return alert("Please top up your wallet before adding products.");
    try {
      const id = p.id;
      const res = await addCatalogProductToShop(id);
      alert("Catalog product added to your shop.");
      if (goEdit) router.push(`/portal/products/edit/${res.product.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to add product");
    }
  };

  const onSubmitCustom = async () => {
    if (!hasFunds) return alert("Please top up your wallet before adding products.");
    if (!title.trim() || !description.trim() || !price || !stock || !categorySlug) {
      return alert("Please fill in all required fields.");
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("price", price);
      if (originalPrice) form.append("original_price", originalPrice);
      form.append("stock", stock);
      form.append("category_slug", categorySlug);
      form.append("status", status);
      if (shippingText) form.append("shipping_text", shippingText);
      if (shippingSubtext) form.append("shipping_subtext", shippingSubtext);
      if (guaranteeText) form.append("guarantee_text", guaranteeText);
      form.append("low_stock_threshold", String(lowStockThreshold));
      if (maxPerOrder) form.append("max_per_order", maxPerOrder);
      if (restockLeadDays) form.append("restock_lead_days", restockLeadDays);
      form.append("auto_hide_when_out_of_stock", autoHide ? "1" : "0");
      form.append("allow_backorder", allowBackorder ? "1" : "0");
      form.append("thumbnail_index", String(thumbnailIndex));
      images.forEach((img) => form.append("images[]", img));
      form.append("specifications", JSON.stringify(specs.filter((s) => s.label && s.value)));
      if (variants.length) form.append("variants", JSON.stringify(variants));
      await createSellerProduct(form);
      alert("Product created successfully.");
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setStock("");
      setCategorySlug("");
      setShippingText("");
      setShippingSubtext("");
      setGuaranteeText("");
      setImages([]);
      setSpecs([{ label: "", value: "" }]);
      setVariants([]);
    } catch (e: any) {
      const msg = e.errors ? Object.values(e.errors).flat().join(" ") : e.message;
      alert(msg || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = useMemo(() => title && description && price && stock && categorySlug, [title, description, price, stock, categorySlug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Add New Product</h1>
          <p className="text-sm text-gray-500">Choose from catalog or create your own listing.</p>
        </div>
        <Link href="/portal/products/my-products" className="text-sm text-blue-600 hover:text-blue-700">
          Back to My Products
        </Link>
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

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm ${tab === "custom" ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-600"}`}
            onClick={() => setTab("custom")}
          >
            Custom Product
          </button>
          <button
            className={`px-4 py-3 text-sm ${tab === "catalog" ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-600"}`}
            onClick={() => setTab("catalog")}
          >
            Catalog Products
          </button>
          <div className="ml-auto px-4 py-3 text-sm text-gray-500">
            Wallet: {currency} {walletBalance.toFixed(2)}
          </div>
        </div>

        {tab === "custom" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">Product title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm">
                  <option value="draft">Draft</option>
                  <option value="live">Submit for Review</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Products submitted for review become live after admin approval.</p>
              </div>
              <div>
                <label className="text-sm text-gray-700">Category *</label>
                <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm">
                  <option value="">Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.slug || c.id} value={c.slug || c.category_slug}>{c.name || c.title || c.slug}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Price *</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Original price</label>
                <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Stock *</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Shipping text</label>
                <input value={shippingText} onChange={(e) => setShippingText(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Shipping subtext</label>
                <input value={shippingSubtext} onChange={(e) => setShippingSubtext(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Guarantee</label>
                <input value={guaranteeText} onChange={(e) => setGuaranteeText(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm" />
            </div>

            <div>
              <label className="text-sm text-gray-700">Product images</label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
              />
              {images.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {images.length} images selected. Thumbnail index:
                  <input
                    type="number"
                    value={thumbnailIndex}
                    onChange={(e) => setThumbnailIndex(Number(e.target.value))}
                    className="ml-2 w-16 h-7 px-2 border border-gray-200 rounded text-xs"
                    min={0}
                    max={images.length - 1}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-700">Specifications</label>
              <div className="space-y-2 mt-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      placeholder="Label"
                      value={spec.label}
                      onChange={(e) => setSpecs((s) => s.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm w-48"
                    />
                    <input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => setSpecs((s) => s.map((it, i) => (i === idx ? { ...it, value: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs((s) => s.filter((_, i) => i !== idx))}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])}
                  className="text-sm text-blue-600"
                >
                  + Add specification
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Variants</label>
              <div className="space-y-2 mt-2">
                {variants.map((variant, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <select
                      value={variant.type}
                      onChange={(e) => setVariants((v) => v.map((it, i) => (i === idx ? { ...it, type: e.target.value as any } : it)))}
                      className="h-8 px-2 border border-gray-200 rounded text-sm"
                    >
                      <option value="color">Color</option>
                      <option value="size">Size</option>
                    </select>
                    <input
                      placeholder="Label"
                      value={variant.label}
                      onChange={(e) => setVariants((v) => v.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm flex-1"
                    />
                    <input
                      placeholder="SKU"
                      value={variant.sku || ""}
                      onChange={(e) => setVariants((v) => v.map((it, i) => (i === idx ? { ...it, sku: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm w-28"
                    />
                    <input
                      placeholder="Stock"
                      type="number"
                      value={variant.stock || ""}
                      onChange={(e) => setVariants((v) => v.map((it, i) => (i === idx ? { ...it, stock: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm w-20"
                    />
                    <input
                      placeholder="Price"
                      type="number"
                      value={variant.price || ""}
                      onChange={(e) => setVariants((v) => v.map((it, i) => (i === idx ? { ...it, price: e.target.value } : it)))}
                      className="h-8 px-3 border border-gray-200 rounded text-sm w-24"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants((v) => v.filter((_, i) => i !== idx))}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setVariants((v) => [...v, { type: "color", label: "" }])}
                  className="text-sm text-blue-600"
                >
                  + Add variant
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Inventory Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">Low stock threshold</label>
                  <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Max per order</label>
                  <input type="number" value={maxPerOrder} onChange={(e) => setMaxPerOrder(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Restock lead days</label>
                  <input type="number" value={restockLeadDays} onChange={(e) => setRestockLeadDays(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={autoHide} onChange={(e) => setAutoHide(e.target.checked)} />
                  <span className="text-sm text-gray-700">Auto-hide when out of stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={allowBackorder} onChange={(e) => setAllowBackorder(e.target.checked)} />
                  <span className="text-sm text-gray-700">Allow backorder</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onSubmitCustom}
                disabled={saving || !canSubmit}
                className="px-5 h-10 rounded bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Product"}
              </button>
            </div>
          </div>
        )}

        {tab === "catalog" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search catalog products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-72"
              />
              <button onClick={loadCatalog} className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">
                Search
              </button>
            </div>

            {catalogLoading ? (
              <div className="text-sm text-gray-500">Loading catalog...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogProducts.map((p) => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-800">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.category_slug}</div>
                    <div className="text-sm text-gray-700 mt-2">
                      {currency} {Number(p.base_price).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Stock: {p.available_stock}</div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onAddCatalog(p, false)}
                        className="h-9 px-3 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                      >
                        Add to My Products
                      </button>
                      <button
                        onClick={() => onAddCatalog(p, true)}
                        className="h-9 px-3 border border-gray-200 text-sm rounded hover:bg-gray-50"
                      >
                        Add & Edit
                      </button>
                    </div>
                  </div>
                ))}
                {catalogProducts.length === 0 && <div className="text-sm text-gray-500">No catalog products found.</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddNewProductPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
      <AddNewProductContent />
    </Suspense>
  );
}
