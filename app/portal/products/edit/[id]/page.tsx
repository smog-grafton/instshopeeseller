"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  deleteProductImage,
  getCategories,
  getSellerProduct,
  reorderProductImages,
  setProductThumbnail,
  submitProductAppeal,
  submitProductForReview,
  syncProductFromCatalog,
  updateSellerProduct,
  uploadProductImages,
  uploadVariantImage,
} from "@/lib/api-client";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

type ProductStatus = "draft" | "pending" | "live" | "rejected" | "hidden";
type SellerEditableStatus = "draft" | "live";

type EditableSpecification = {
  id?: number;
  label: string;
  value: string;
};

type EditableVariant = {
  id?: number;
  type: "color" | "size";
  label: string;
  sku: string;
  stock: string;
  price: string;
  original_price: string;
  image_path?: string | null;
  is_active: boolean;
};

type CategoryOption = {
  id?: number;
  slug?: string;
  category_slug?: string;
  name?: string;
  title?: string;
};

function emptySpecification(): EditableSpecification {
  return { label: "", value: "" };
}

function emptyVariant(type: "color" | "size" = "color"): EditableVariant {
  return {
    type,
    label: "",
    sku: "",
    stock: "0",
    price: "",
    original_price: "",
    image_path: null,
    is_active: true,
  };
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

export default function EditProductPage() {
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
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
  const [specifications, setSpecifications] = useState<EditableSpecification[]>([emptySpecification()]);
  const [variants, setVariants] = useState<EditableVariant[]>([]);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newThumbnailIndex, setNewThumbnailIndex] = useState<number>(-1);

  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [maxPerOrder, setMaxPerOrder] = useState("");
  const [restockLeadDays, setRestockLeadDays] = useState("");
  const [autoHide, setAutoHide] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);

  const hydrateProduct = (nextProduct: any) => {
    setProduct(nextProduct);
    setImages(nextProduct.images || []);
    setAppealMessage(nextProduct.appeal_message || "");
    setTitle(nextProduct.title || "");
    setDescription(nextProduct.description || "");
    setPrice(String(nextProduct.price || ""));
    setOriginalPrice(String(nextProduct.original_price || ""));
    setStock(String(nextProduct.stock || ""));
    setCategorySlug(nextProduct.category_slug || "");
    setShippingText(nextProduct.shipping_text || "");
    setShippingSubtext(nextProduct.shipping_subtext || "");
    setGuaranteeText(nextProduct.guarantee_text || "");
    setStatus(nextProduct.status || (nextProduct.is_active ? "live" : "draft"));
    setLowStockThreshold(nextProduct.low_stock_threshold ?? 5);
    setMaxPerOrder(nextProduct.max_per_order ? String(nextProduct.max_per_order) : "");
    setRestockLeadDays(nextProduct.restock_lead_days ? String(nextProduct.restock_lead_days) : "");
    setAutoHide(Boolean(nextProduct.auto_hide_when_out_of_stock ?? true));
    setAllowBackorder(Boolean(nextProduct.allow_backorder ?? false));
    setSpecifications(
      nextProduct.specifications?.length
        ? nextProduct.specifications.map((spec: any) => ({
            id: spec.id,
            label: spec.label || "",
            value: spec.value || "",
          }))
        : [emptySpecification()],
    );
    setVariants(
      nextProduct.variants?.length
        ? nextProduct.variants.map((variant: any) => ({
            id: variant.id,
            type: variant.type === "size" ? "size" : "color",
            label: variant.label || "",
            sku: variant.sku || "",
            stock: String(variant.stock ?? 0),
            price: variant.price != null ? String(variant.price) : "",
            original_price: variant.original_price != null ? String(variant.original_price) : "",
            image_path: variant.image_path || null,
            is_active: Boolean(variant.is_active ?? true),
          }))
        : [],
    );
  };

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    Promise.all([
      getSellerProduct(id),
      getCategories().catch(() => ({ categories: [] })),
    ])
      .then(([productRes, categoriesRes]) => {
        hydrateProduct(productRes.product);
        setCategories(categoriesRes.categories || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const uploadPreviews = useMemo(
    () =>
      newImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newImages],
  );

  useEffect(() => {
    return () => {
      uploadPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [uploadPreviews]);

  const catalogProduct = product?.catalog_link?.catalog_product ?? null;
  const isCatalogLinked = Boolean(product?.catalog_link);
  const isWholesaleLinked = catalogProduct?.listing_type === "wholesale_centre";
  const isPriceLocked = Boolean(isCatalogLinked && isWholesaleLinked);
  const isAdminManagedStatus = status === "pending" || status === "rejected" || status === "hidden";

  const categoryOptions = useMemo(() => {
    const optionMap = new Map<string, { label: string; value: string }>();
    categories.forEach((category) => {
      const value = category.slug || category.category_slug;
      if (!value) return;
      optionMap.set(value, {
        value,
        label: category.name || category.title || value,
      });
    });
    if (categorySlug && !optionMap.has(categorySlug)) {
      optionMap.set(categorySlug, { value: categorySlug, label: categorySlug });
    }
    return Array.from(optionMap.values());
  }, [categories, categorySlug]);

  const resolveImage = (path?: string | null) => resolveBackendAssetUrl(path);

  const runProductAction = async <T,>(actionKey: string, action: () => Promise<T>): Promise<T> => {
    setBusyAction(actionKey);
    try {
      return await action();
    } finally {
      setBusyAction(null);
    }
  };

  const handleActionError = (error: any, fallback: string) => {
    const message = error?.errors
      ? Object.values(error.errors).flat().join(" ")
      : error?.message || fallback;
    alert(message);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateSpecification = (index: number, key: keyof EditableSpecification, value: string) => {
    setSpecifications((current) =>
      current.map((specification, specificationIndex) =>
        specificationIndex === index ? { ...specification, [key]: value } : specification,
      ),
    );
  };

  const updateVariantField = (index: number, key: keyof EditableVariant, value: string | boolean) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant,
      ),
    );
  };

  const uploadPendingImages = async () => {
    if (!newImages.length) return;

    const thumbnailIndex =
      newThumbnailIndex >= 0 ? Math.min(newThumbnailIndex, newImages.length - 1) : images.length === 0 ? 0 : -1;

    try {
      const response = await runProductAction("upload-images", () =>
        uploadProductImages(id, newImages, thumbnailIndex),
      );
      hydrateProduct(response.product);
      setNewImages([]);
      setNewThumbnailIndex(-1);
      alert("Gallery updated.");
    } catch (error) {
      handleActionError(error, "Unable to upload product images.");
    }
  };

  const saveImageOrder = async () => {
    try {
      const response = await runProductAction("save-order", () =>
        reorderProductImages(id, images.map((image) => image.id)),
      );
      hydrateProduct(response.product);
      alert("Image order saved.");
    } catch (error) {
      handleActionError(error, "Unable to save image order.");
    }
  };

  const handleSetThumbnail = async (imageId: number) => {
    try {
      const response = await runProductAction(`thumbnail-${imageId}`, () => setProductThumbnail(id, imageId));
      hydrateProduct(response.product);
    } catch (error) {
      handleActionError(error, "Unable to set the main image.");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await runProductAction(`delete-image-${imageId}`, () => deleteProductImage(id, imageId));
      hydrateProduct(response.product);
    } catch (error) {
      handleActionError(error, "Unable to remove that image.");
    }
  };

  const handleCatalogSync = async (replaceImages: boolean) => {
    try {
      const response = await runProductAction(
        replaceImages ? "sync-replace-images" : "sync-catalog",
        () => syncProductFromCatalog(id, replaceImages),
      );
      hydrateProduct(response.product);
      alert(replaceImages ? "Catalog data and gallery refreshed." : "Catalog fields refreshed.");
    } catch (error) {
      handleActionError(error, "Unable to sync from catalog.");
    }
  };

  const handleVariantImageUpload = async (variantId: number, file: File) => {
    try {
      const response = await runProductAction(`variant-image-${variantId}`, () =>
        uploadVariantImage(id, variantId, file),
      );

      setProduct((current: any) => {
        if (!current) return current;
        const next = { ...current };
        next.variants = (current.variants || []).map((variant: any) =>
          variant.id === variantId ? { ...variant, ...(response.variant || {}) } : variant,
        );
        return next;
      });

      setVariants((current) =>
        current.map((variant) =>
          variant.id === variantId
            ? { ...variant, image_path: response.variant?.image_path ?? variant.image_path }
            : variant,
        ),
      );
    } catch (error) {
      handleActionError(error, "Unable to upload the variant image.");
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
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
        specifications: specifications
          .filter((specification) => specification.label.trim())
          .map((specification) => ({
            id: specification.id,
            label: specification.label.trim(),
            value: specification.value.trim() || null,
          })),
        variants: variants
          .filter((variant) => variant.label.trim())
          .map((variant) => ({
            id: variant.id,
            type: variant.type,
            label: variant.label.trim(),
            sku: variant.sku.trim() || null,
            stock: Number(variant.stock || 0),
            image_path: variant.image_path || null,
            is_active: variant.is_active,
            ...(isPriceLocked
              ? {}
              : {
                  price: variant.price ? Number(variant.price) : null,
                  original_price: variant.original_price ? Number(variant.original_price) : null,
                }),
          })),
      };

      if (!isPriceLocked) {
        payload.price = Number(price);
        payload.original_price = originalPrice ? Number(originalPrice) : null;
      }

      if (status === "draft" || status === "live") {
        payload.status = status;
      }

      const response = await updateSellerProduct(id, payload);
      hydrateProduct(response.product);
      alert("Product updated.");
    } catch (error) {
      handleActionError(error, "Failed to update this product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading product...</div>;
  }

  if (!product) {
    return <div className="text-sm text-gray-500">Product not found.</div>;
  }

  return (
    <div className="space-y-6">
      {(product.status === "pending" || product.status === "rejected") && (
        <div
          className={`rounded-sm border px-4 py-3 text-sm ${
            product.status === "pending"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {product.status === "pending"
            ? "This product is under review. You can keep improving the content while the admin team checks it."
            : `This product was rejected. ${product.status_notes || "Update the content, then submit it again."}`}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
            <span>{isCatalogLinked ? "Catalog-linked product" : "Shop-managed product"}</span>
            {catalogProduct?.listing_type && (
              <span className="border border-gray-200 px-2 py-1 text-[11px] tracking-[0.16em] text-gray-700">
                {catalogProduct.listing_type === "wholesale_centre" ? "Wholesale Centre" : "Supplier Catalog"}
              </span>
            )}
            {isPriceLocked && (
              <span className="border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] tracking-[0.16em] text-orange-700">
                Supplier pricing locked
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
          <p className="max-w-3xl text-sm text-gray-500">
            Keep this page aligned with the buyer product detail page: strong gallery, clear shipping and guarantee copy,
            tidy specifications, and precise variant naming.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCatalogLinked && (
            <>
              <span className="border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                Catalog ID #{product.catalog_link.catalog_product_id}
              </span>
              <button
                onClick={() => handleCatalogSync(false)}
                disabled={busyAction === "sync-catalog"}
                className="h-10 rounded-sm border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busyAction === "sync-catalog" ? "Syncing..." : "Sync from Catalog"}
              </button>
              <button
                onClick={() => handleCatalogSync(true)}
                disabled={busyAction === "sync-replace-images"}
                className="h-10 rounded-sm border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busyAction === "sync-replace-images" ? "Replacing..." : "Sync & Replace Images"}
              </button>
            </>
          )}
          {status === "draft" && (
            <button
              onClick={async () => {
                try {
                  const response = await runProductAction("submit-review", () => submitProductForReview(id));
                  hydrateProduct(response.product);
                } catch (error) {
                  handleActionError(error, "Unable to submit this product for review.");
                }
              }}
              disabled={busyAction === "submit-review"}
              className="h-10 rounded-sm border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {busyAction === "submit-review" ? "Submitting..." : "Submit for Review"}
            </button>
          )}
          <Link
            href={`/portal/products/preview/${id}`}
            className="inline-flex h-10 items-center rounded-sm border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            Preview
          </Link>
          {product?.slug && (
            <Link
              href={`${process.env.NEXT_PUBLIC_BUYER_URL ?? ""}/product/${product.slug}`}
              target="_blank"
              className="inline-flex h-10 items-center rounded-sm border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              Open Buyer Page
            </Link>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="h-10 rounded-sm bg-orange-600 px-4 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {product.status === "rejected" && (
        <div className="rounded-sm border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Submit Appeal</div>
          <p className="mt-1 text-xs text-gray-500">
            Explain what changed so the admin team can review your updated listing faster.
          </p>
          <textarea
            value={appealMessage}
            onChange={(event) => setAppealMessage(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-sm border border-gray-200 px-3 py-2 text-sm"
            placeholder="Explain the corrections you made..."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                try {
                  const response = await runProductAction("appeal", () => submitProductAppeal(id, appealMessage));
                  hydrateProduct(response.product);
                } catch (error) {
                  handleActionError(error, "Unable to submit the appeal.");
                }
              }}
              disabled={busyAction === "appeal"}
              className="h-9 rounded-sm bg-orange-600 px-4 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {busyAction === "appeal" ? "Submitting..." : "Submit Appeal"}
            </button>
            {product.appeal_status && (
              <span className="text-xs text-gray-500">Appeal status: {product.appeal_status}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-sm border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Media Gallery</h2>
              <p className="mt-1 text-xs text-gray-500">
                The buyer product page needs multiple gallery images and one clear main image.
              </p>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {images.map((image: any, index: number) => {
                  const url = resolveImage(image.image_path);
                  return (
                    <div key={image.id} className="overflow-hidden rounded-sm border border-gray-200 bg-white">
                      <div className="relative aspect-square bg-gray-50">
                        {url ? (
                          <Image
                            src={url}
                            alt={title || "product image"}
                            fill
                            className="object-cover"
                            unoptimized={isBackendImage(url)}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                        )}
                        {image.is_thumbnail && (
                          <span className="absolute left-2 top-2 border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700">
                            Main image
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="text-xs text-gray-500">Position {index + 1}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            onClick={() => handleSetThumbnail(image.id)}
                            disabled={busyAction === `thumbnail-${image.id}` || image.is_thumbnail}
                            className="rounded-sm border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Set main
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={busyAction === `delete-image-${image.id}`}
                            className="rounded-sm border border-gray-200 px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            className="rounded-sm border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Up
                          </button>
                          <button
                            onClick={() => moveImage(index, 1)}
                            disabled={index === images.length - 1}
                            className="rounded-sm border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Down
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {images.length === 0 && (
                <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  This product has no gallery images yet. Add several clean product shots and choose a main image.
                </div>
              )}

              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Upload new gallery images</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Upload multiple images at once, then choose which of the new uploads should become the main image.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={uploadPendingImages}
                      disabled={!newImages.length || busyAction === "upload-images"}
                      className="h-9 rounded-sm bg-orange-600 px-4 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {busyAction === "upload-images" ? "Uploading..." : "Upload Images"}
                    </button>
                    <button
                      onClick={saveImageOrder}
                      disabled={images.length < 2 || busyAction === "save-order"}
                      className="h-9 rounded-sm border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busyAction === "save-order" ? "Saving..." : "Save Order"}
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setNewImages(files);
                    setNewThumbnailIndex(files.length ? 0 : -1);
                  }}
                  className="mt-4 block text-sm text-gray-600 file:mr-3 file:rounded-sm file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-orange-700"
                />

                {uploadPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {uploadPreviews.map((preview, index) => (
                      <button
                        key={`${preview.file.name}-${index}`}
                        type="button"
                        onClick={() => setNewThumbnailIndex(index)}
                        className={`overflow-hidden rounded-sm border text-left ${
                          newThumbnailIndex === index ? "border-orange-500 bg-white" : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <Image src={preview.url} alt={preview.file.name} fill className="object-cover" unoptimized />
                          {newThumbnailIndex === index && (
                            <span className="absolute left-2 top-2 border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700">
                              New main image
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="line-clamp-1 text-xs font-medium text-gray-800">{preview.file.name}</div>
                          <div className="mt-1 text-[11px] text-gray-500">
                            {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Core Listing Details</h2>
              <p className="mt-1 text-xs text-gray-500">
                These fields power the title, price block, shipping promise, and buyer decision area on the product page.
              </p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as SellerEditableStatus)}
                  disabled={isAdminManagedStatus}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="draft">Draft</option>
                  <option value="live">Submit for Review</option>
                  {isAdminManagedStatus && (
                    <option value={status}>
                      {status === "pending" ? "Pending review" : status === "rejected" ? "Rejected" : "Hidden"}
                    </option>
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Pending, rejected, and hidden are admin-controlled states.
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-700">Category</label>
                {categoryOptions.length > 0 ? (
                  <select
                    value={categorySlug}
                    onChange={(event) => setCategorySlug(event.target.value)}
                    className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={categorySlug}
                    onChange={(event) => setCategorySlug(event.target.value)}
                    className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                    placeholder="electronics"
                  />
                )}
              </div>

              <div>
                <label className="text-sm text-gray-700">Selling price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  disabled={isPriceLocked}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
                {isPriceLocked && (
                  <p className="mt-1 text-xs text-orange-700">
                    Wholesale Centre prices come from the supplier catalog and cannot be changed here.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-700">Original price</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(event) => setOriginalPrice(event.target.value)}
                  disabled={isPriceLocked}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Shipping headline</label>
                <input
                  value={shippingText}
                  onChange={(event) => setShippingText(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                  placeholder="Guaranteed to get by Tuesday"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Shipping subtext</label>
                <input
                  value={shippingSubtext}
                  onChange={(event) => setShippingSubtext(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                  placeholder="Get a voucher if your order arrives late."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Guarantee text</label>
                <input
                  value={guaranteeText}
                  onChange={(event) => setGuaranteeText(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                  placeholder="15-Day Free Returns · Cash on Delivery"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={7}
                  className="mt-1 w-full rounded-sm border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Product Specifications</h2>
              <p className="mt-1 text-xs text-gray-500">
                Use these rows for material, warranty, origin, or other detail-page facts. Keep labels short and factual.
              </p>
            </div>
            <div className="space-y-3 p-5">
              {specifications.map((specification, index) => (
                <div
                  key={specification.id ?? `spec-${index}`}
                  className="grid gap-3 rounded-sm border border-gray-200 p-3 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)_auto]"
                >
                  <input
                    placeholder="Label"
                    value={specification.label}
                    onChange={(event) => updateSpecification(index, "label", event.target.value)}
                    className="h-10 rounded-sm border border-gray-200 px-3 text-sm"
                  />
                  <input
                    placeholder="Value"
                    value={specification.value}
                    onChange={(event) => updateSpecification(index, "value", event.target.value)}
                    className="h-10 rounded-sm border border-gray-200 px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSpecifications((current) =>
                        current.length === 1 ? [emptySpecification()] : current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="h-10 rounded-sm border border-gray-200 px-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSpecifications((current) => [...current, emptySpecification()])}
                className="h-10 rounded-sm border border-dashed border-gray-300 px-4 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              >
                Add specification
              </button>
            </div>
          </section>

          <section className="rounded-sm border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
              <p className="mt-1 text-xs text-gray-500">
                Create color and size choices that the buyer detail page can render cleanly. Keep labels consistent and
                buyer-friendly.
              </p>
            </div>
            <div className="space-y-4 p-5">
              {variants.map((variant, index) => {
                const imageUrl = resolveImage(variant.image_path);
                return (
                  <div key={variant.id ?? `variant-${index}`} className="rounded-sm border border-gray-200 p-4">
                    <div className="grid gap-4 lg:grid-cols-[120px_repeat(5,minmax(0,1fr))]">
                      <div className="space-y-2">
                        <div className="relative aspect-square overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={variant.label || "Variant image"}
                              fill
                              className="object-cover"
                              unoptimized={isBackendImage(imageUrl)}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        {variant.id ? (
                          <label className="block text-xs text-gray-500">
                            <span className="mb-1 block">Upload image</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file || !variant.id) return;
                                void handleVariantImageUpload(variant.id, file);
                                event.currentTarget.value = "";
                              }}
                              className="block w-full text-xs text-gray-600 file:mr-2 file:rounded-sm file:border-0 file:bg-orange-100 file:px-2 file:py-1.5 file:text-orange-700"
                            />
                          </label>
                        ) : (
                          <div className="text-xs text-gray-500">Save first, then upload a variant image.</div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Type</label>
                        <select
                          value={variant.type}
                          onChange={(event) => updateVariantField(index, "type", event.target.value as "color" | "size")}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                        >
                          <option value="color">Color</option>
                          <option value="size">Size</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Label</label>
                        <input
                          value={variant.label}
                          onChange={(event) => updateVariantField(index, "label", event.target.value)}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                          placeholder={variant.type === "color" ? "Midnight Blue" : "XL"}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">SKU</label>
                        <input
                          value={variant.sku}
                          onChange={(event) => updateVariantField(index, "sku", event.target.value)}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                          placeholder="SKU-001"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Stock</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(event) => updateVariantField(index, "stock", event.target.value)}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Price</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(event) => updateVariantField(index, "price", event.target.value)}
                          disabled={isPriceLocked}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                      <div>
                        <label className="text-xs text-gray-500">Original price</label>
                        <input
                          type="number"
                          value={variant.original_price}
                          onChange={(event) => updateVariantField(index, "original_price", event.target.value)}
                          disabled={isPriceLocked}
                          className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={variant.is_active}
                            onChange={(event) => updateVariantField(index, "is_active", event.target.checked)}
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))
                          }
                          className="h-10 rounded-sm border border-gray-200 px-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          Remove variant
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setVariants((current) => [...current, emptyVariant("color")])}
                  className="h-10 rounded-sm border border-dashed border-gray-300 px-4 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                >
                  Add color variant
                </button>
                <button
                  type="button"
                  onClick={() => setVariants((current) => [...current, emptyVariant("size")])}
                  className="h-10 rounded-sm border border-dashed border-gray-300 px-4 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                >
                  Add size variant
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-sm border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Catalog Link</h2>
            {isCatalogLinked ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500">Catalog product</span>
                  <span className="font-medium text-gray-900">#{product.catalog_link.catalog_product_id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium text-gray-900">
                    {catalogProduct?.listing_type === "wholesale_centre" ? "Wholesale Centre" : "Supplier Catalog"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500">Supplier base price</span>
                  <span className="font-medium text-gray-900">
                    ${formatMoney(catalogProduct?.base_price)}
                  </span>
                </div>
                {catalogProduct?.wholesale_price != null && (
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500">Wholesale cost</span>
                    <span className="font-medium text-gray-900">
                      ${formatMoney(catalogProduct.wholesale_price)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Shipping fee</span>
                  <span className="font-medium text-gray-900">
                    ${formatMoney(catalogProduct?.shipping_fee)}
                  </span>
                </div>
                {isPriceLocked && (
                  <div className="rounded-sm border border-orange-200 bg-orange-50 px-3 py-3 text-xs leading-5 text-orange-800">
                    This listing came from the Wholesale Centre. Supplier-controlled pricing stays locked while you manage
                    the gallery, stock, merchandising copy, and presentation.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                This is a shop-created product, so the seller controls the pricing, gallery, and merchandising content.
              </p>
            )}
          </section>

          <section className="rounded-sm border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Inventory Rules</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-700">Low stock threshold</label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(event) => setLowStockThreshold(Number(event.target.value))}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Max per order</label>
                <input
                  type="number"
                  value={maxPerOrder}
                  onChange={(event) => setMaxPerOrder(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Restock lead days</label>
                <input
                  type="number"
                  value={restockLeadDays}
                  onChange={(event) => setRestockLeadDays(event.target.value)}
                  className="mt-1 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={autoHide} onChange={(event) => setAutoHide(event.target.checked)} />
                Auto-hide when out of stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={allowBackorder}
                  onChange={(event) => setAllowBackorder(event.target.checked)}
                />
                Allow backorder
              </label>
            </div>
          </section>

          <section className="rounded-sm border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Buyer Page Checklist</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>Use 3 or more gallery images when possible so the buyer page does not collapse into a sparse gallery.</li>
              <li>Keep the first specification rows practical: material, warranty, origin, compatibility, or size info.</li>
              <li>Use short shipping and guarantee phrases so the buyer product header stays clean on mobile.</li>
              <li>Name color and size variants exactly as you want buyers to see them on the detail page.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
