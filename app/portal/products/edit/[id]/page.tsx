"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { deleteProductImage, getSellerProduct, reorderProductImages, setProductThumbnail, submitProductAppeal, submitProductForReview, updateSellerProduct, updateVariant, uploadProductImages, uploadVariantImage, syncProductFromCatalog } from "@/lib/api-client";
import Image from "next/image";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

type ProductStatus = "draft" | "pending" | "live" | "rejected" | "hidden";
type SellerEditableStatus = "draft" | "live";

export default function EditProductPage() {
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [appealMessage, setAppealMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [shippingText, setShippingText] = useState("");
  const [shippingSubtext, setShippingSubtext] = useState("");
  const [guaranteeText, setGuaranteeText] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newThumbnailIndex, setNewThumbnailIndex] = useState<number>(-1);

  // Inventory rules
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [maxPerOrder, setMaxPerOrder] = useState("");
  const [restockLeadDays, setRestockLeadDays] = useState("");
  const [autoHide, setAutoHide] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const isAdminManagedStatus = status === "pending" || status === "rejected" || status === "hidden";

  useEffect(() => {
    if (!id) return;
    getSellerProduct(id)
      .then((res) => {
        setProduct(res.product);
        setImages(res.product.images || []);
        setAppealMessage(res.product.appeal_message || "");
        setTitle(res.product.title || "");
        setDescription(res.product.description || "");
        setPrice(String(res.product.price || ""));
        setOriginalPrice(String(res.product.original_price || ""));
        setStock(String(res.product.stock || ""));
        setCategorySlug(res.product.category_slug || "");
        setShippingText(res.product.shipping_text || "");
        setShippingSubtext(res.product.shipping_subtext || "");
        setGuaranteeText(res.product.guarantee_text || "");
        setStatus(res.product.status || (res.product.is_active ? "live" : "draft"));
        setLowStockThreshold(res.product.low_stock_threshold ?? 5);
        setMaxPerOrder(res.product.max_per_order ? String(res.product.max_per_order) : "");
        setRestockLeadDays(res.product.restock_lead_days ? String(res.product.restock_lead_days) : "");
        setAutoHide(Boolean(res.product.auto_hide_when_out_of_stock ?? true));
        setAllowBackorder(Boolean(res.product.allow_backorder ?? false));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        stock: Number(stock),
        category_slug: categorySlug || null,
        shipping_text: shippingText || null,
        shipping_subtext: shippingSubtext || null,
        guarantee_text: guaranteeText || null,
        low_stock_threshold: Number(lowStockThreshold),
        max_per_order: maxPerOrder ? Number(maxPerOrder) : null,
        restock_lead_days: restockLeadDays ? Number(restockLeadDays) : null,
        auto_hide_when_out_of_stock: autoHide,
        allow_backorder: allowBackorder,
      };

      if (status === "draft" || status === "live") {
        payload.status = status;
      }

      await updateSellerProduct(id, payload);
      alert("Product updated.");
    } catch (e: any) {
      const msg = e.errors ? Object.values(e.errors).flat().join(" ") : e.message;
      alert(msg || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading product...</div>;
  if (!product) return <div className="text-sm text-gray-500">Product not found.</div>;

  const resolveImage = (path?: string | null) => {
    return resolveBackendAssetUrl(path);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((list) => {
      const next = [...list];
      const target = index + direction;
      if (target < 0 || target >= next.length) return next;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  return (
      <div className="space-y-6">
        {(product?.status === "pending" || product?.status === "rejected") && (
          <div className={`border rounded-lg p-4 text-sm ${product.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {product.status === "pending" ? "This product is under review. You can still edit it, but it won't be live until approved." : `This product was rejected. ${product.status_notes || "Please update the details and resubmit."}`}
          </div>
        )}
        {product?.status === "rejected" && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-800">Submit Appeal</div>
            <p className="text-xs text-gray-500 mt-1">Share what you changed or provide clarification for re-review.</p>
            <textarea
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              rows={4}
              className="mt-3 w-full border border-gray-200 rounded p-2 text-sm"
              placeholder="Explain the changes or upload evidence..."
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => submitProductAppeal(id, appealMessage).then((res) => setProduct(res.product))}
                className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Submit Appeal
              </button>
              {product.appeal_status && (
                <span className="text-xs text-gray-500">Appeal status: {product.appeal_status}</span>
              )}
            </div>
          </div>
        )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500">Update product info and inventory rules.</p>
        </div>
          <div className="flex items-center gap-3">
            {product?.catalog_link && (
              <>
                <span className="text-xs text-blue-600">Catalog ID #{product.catalog_link.catalog_product_id}</span>
                <button
                  onClick={() => syncProductFromCatalog(id, false).then((res) => setProduct(res.product))}
                  className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Sync from Catalog
                </button>
                <button
                  onClick={() => syncProductFromCatalog(id, true).then((res) => setProduct(res.product))}
                  className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Sync & Replace Images
                </button>
              </>
            )}
            {status === "draft" && (
              <button
                onClick={() => submitProductForReview(id).then((res) => { setProduct(res.product); setStatus(res.product.status); })}
                className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50"
              >
                Submit for Review
              </button>
            )}
            <a href={`/portal/products/preview/${id}`} className="text-sm text-blue-600 hover:text-blue-700">Preview</a>
            <button onClick={onSave} disabled={saving} className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img: any, idx: number) => {
                const url = resolveImage(img.image_path);
                return (
                  <div key={img.id} className="border border-gray-200 rounded p-2">
                    {url ? (
                      <Image src={url} alt="product" width={160} height={160} className="object-cover w-full h-32" unoptimized={isBackendImage(url)} />
                    ) : (
                      <div className="h-32 bg-gray-50" />
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <button onClick={() => setProductThumbnail(id, img.id).then((res) => { setProduct(res.product); setImages(res.product.images || []); })} className="text-blue-600">Set thumbnail</button>
                      <button onClick={() => deleteProductImage(id, img.id).then((res) => { setProduct(res.product); setImages(res.product.images || []); })} className="text-red-600">Remove</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <button onClick={() => moveImage(idx, -1)} className="text-gray-600">Up</button>
                      <button onClick={() => moveImage(idx, 1)} className="text-gray-600">Down</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setNewImages(Array.from(e.target.files || []))}
                className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
              />
              {newImages.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {newImages.length} images selected. Thumbnail index:
                  <input type="number" value={newThumbnailIndex} onChange={(e) => setNewThumbnailIndex(Number(e.target.value))} className="ml-2 w-16 h-7 px-2 border border-gray-200 rounded text-xs" />
                  <button
                    className="ml-3 text-blue-600"
                    onClick={() => uploadProductImages(id, newImages, newThumbnailIndex).then((res) => { setProduct(res.product); setImages(res.product.images || []); })}
                  >
                    Upload
                  </button>
                  <button
                    className="ml-3 text-gray-600"
                    onClick={() => reorderProductImages(id, images.map((i) => i.id)).then((res) => { setProduct(res.product); setImages(res.product.images || []); })}
                  >
                    Save Order
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
            <div>
              <label className="text-sm text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SellerEditableStatus)}
                disabled={isAdminManagedStatus}
                className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="draft">Draft</option>
                <option value="live">Submit for Review</option>
                {isAdminManagedStatus && (
                  <option value={status}>
                    {status === "pending" ? "Pending review" : status === "rejected" ? "Rejected" : "Hidden"}
                  </option>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">Current moderation status: {product?.status || status}. Pending, rejected, and hidden are admin-managed and cannot be changed by sellers.</p>
            </div>
          <div>
            <label className="text-sm text-gray-700">Category Slug</label>
            <input value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Original Price</label>
            <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Stock</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div className="text-xs text-gray-500 mt-6">
            Status determines visibility. Live shows to buyers; Draft/Hidden do not.
          </div>
          <div>
            <label className="text-sm text-gray-700">Shipping Text</label>
            <input value={shippingText} onChange={(e) => setShippingText(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Shipping Subtext</label>
            <input value={shippingSubtext} onChange={(e) => setShippingSubtext(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Guarantee Text</label>
            <input value={guaranteeText} onChange={(e) => setGuaranteeText(e.target.value)} className="mt-1 w-full h-9 px-3 border border-gray-200 rounded text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm" />
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

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Variant Images</h3>
          <div className="space-y-3">
            {(product.variants || []).map((v: any) => {
              const url = resolveImage(v.image_path);
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                    {url ? (
                      <Image src={url} alt={v.label} width={48} height={48} className="object-cover" unoptimized={isBackendImage(url)} />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">{v.label}</div>
                  <input
                    type="text"
                    placeholder="SKU"
                    defaultValue={v.sku || ""}
                    onBlur={(e) => updateVariant(id, v.id, { sku: e.target.value || null })}
                    className="h-8 px-2 border border-gray-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    defaultValue={v.stock ?? 0}
                    onBlur={(e) => updateVariant(id, v.id, { stock: Number(e.target.value) })}
                    className="h-8 px-2 border border-gray-200 rounded text-xs w-20"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    defaultValue={v.price ?? ""}
                    onBlur={(e) => updateVariant(id, v.id, { price: e.target.value ? Number(e.target.value) : null })}
                    className="h-8 px-2 border border-gray-200 rounded text-xs w-24"
                  />
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadVariantImage(id, v.id, file).then((res) => {
                        setProduct((prev: any) => {
                          const next = { ...prev };
                          next.variants = next.variants.map((x: any) => (x.id === v.id ? res.variant : x));
                          return next;
                        });
                      });
                    }}
                    className="text-xs text-gray-600"
                  />
                </div>
              );
            })}
            {(product.variants || []).length === 0 && <div className="text-xs text-gray-500">No variants to upload images for.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
