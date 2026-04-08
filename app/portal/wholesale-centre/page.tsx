"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addCatalogProductToShop,
  getCatalogProduct,
  getCatalogProducts,
  getSellerProductSettings,
  getWallet,
  type SellerProductSettings,
} from "@/lib/api-client";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";

type CatalogImage = {
  image_path: string;
  image_path_webp?: string | null;
  is_thumbnail?: boolean;
};

type CatalogSpecification = {
  label: string;
  value?: string | null;
};

type CatalogVariant = {
  type: "color" | "size";
  label: string;
  sku?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  stock?: number | null;
  image_path?: string | null;
  is_active?: boolean;
};

type PriceRangeOption = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { id: "all", label: "All" },
  { id: "1-500", label: "1 - 500", min: 1, max: 500 },
  { id: "501-1000", label: "501 - 1,000", min: 501, max: 1000 },
  { id: "1001-3000", label: "1,001 - 3,000", min: 1001, max: 3000 },
  { id: "3001-6000", label: "3,001 - 6,000", min: 3001, max: 6000 },
  { id: "6001-9000", label: "6,001 - 9,000", min: 6001, max: 9000 },
  { id: "9000+", label: "More than 9,000", min: 9001 },
];

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

function formatCategoryLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeCatalogImages(product: any): CatalogImage[] {
  const normalized: CatalogImage[] = [];
  const seen = new Set<string>();

  const pushImage = (path: string | null | undefined, isThumbnail = false, webp?: string | null) => {
    const trimmed = String(path ?? "").trim();
    if (!trimmed || seen.has(trimmed)) return;

    seen.add(trimmed);
    normalized.push({
      image_path: trimmed,
      image_path_webp: webp ?? null,
      is_thumbnail: isThumbnail,
    });
  };

  pushImage(product?.thumbnail_url, true);

  if (Array.isArray(product?.images)) {
    product.images.forEach((image: any, index: number) => {
      if (typeof image === "string") {
        pushImage(image, index === 0 && !product?.thumbnail_url);
        return;
      }

      if (image && typeof image === "object") {
        pushImage(
          image.image_path ?? image.imagePath,
          Boolean(image.is_thumbnail ?? image.isThumbnail ?? (!product?.thumbnail_url && index === 0)),
          image.image_path_webp ?? image.imagePathWebp,
        );
      }
    });
  }

  return normalized;
}

function normalizeCatalogSpecifications(specifications: any): CatalogSpecification[] {
  if (Array.isArray(specifications)) {
    return specifications
      .map((specification) => {
        if (!specification || typeof specification !== "object") return null;
        const label = String(specification.label ?? specification.name ?? "").trim();
        if (!label) return null;

        return {
          label,
          value: specification.value != null ? String(specification.value) : null,
        };
      })
      .filter(Boolean) as CatalogSpecification[];
  }

  if (specifications && typeof specifications === "object") {
    return Object.entries(specifications)
      .map(([label, value]) => ({
        label,
        value: value != null ? String(value) : null,
      }))
      .filter((specification) => specification.label.trim());
  }

  return [];
}

function normalizeCatalogVariants(variants: any): CatalogVariant[] {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const type = variant.type === "size" ? "size" : "color";
      const label = String(variant.label ?? "").trim();
      if (!label) return null;

      return {
        type,
        label,
        sku: variant.sku ?? null,
        price: variant.price ?? null,
        original_price: variant.original_price ?? variant.originalPrice ?? null,
        stock: variant.stock != null ? Number(variant.stock) : null,
        image_path: variant.image_path ?? variant.imagePath ?? null,
        is_active: variant.is_active ?? variant.isActive ?? true,
      } satisfies CatalogVariant;
    })
    .filter(Boolean) as CatalogVariant[];
}

function resolveCatalogThumbnail(product: any): string | null {
  const primaryPath = product?.thumbnail_url ?? normalizeCatalogImages(product)[0]?.image_path ?? null;
  return resolveBackendAssetUrl(primaryPath);
}

function isProductDistributed(
  product: { already_distributed?: unknown; distributed_product_id?: unknown } | null | undefined,
): boolean {
  return Boolean(product?.already_distributed || product?.distributed_product_id);
}

export default function WholesaleCentrePage() {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogLastPage, setCatalogLastPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState("all");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [productSettings, setProductSettings] = useState<SellerProductSettings | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listingProductId, setListingProductId] = useState<number | null>(null);

  const canEditProducts = productSettings?.can_edit_products ?? true;

  useEffect(() => {
    getWallet()
      .then((res) => {
        setWalletBalance(parseFloat(res.wallet.balance));
        setCurrency(res.wallet.currency || "USD");
      })
      .catch(() => {});

    getSellerProductSettings()
      .then((res) => setProductSettings(res.settings))
      .catch(() => setProductSettings(null));
  }, []);

  const categoryFilters = useMemo(
    () => ["all", ...catalogCategories.filter((category, index) => catalogCategories.indexOf(category) === index)],
    [catalogCategories],
  );
  const visibleCatalogPages = useMemo(() => {
    if (catalogLastPage <= 1) return [];

    const windowSize = 5;
    const start = Math.max(1, catalogPage - Math.floor(windowSize / 2));
    const end = Math.min(catalogLastPage, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [catalogLastPage, catalogPage]);

  const loadCatalog = async (options?: {
    page?: number;
    search?: string;
    category?: string;
    priceRangeId?: string;
  }) => {
    const nextPage = options?.page ?? catalogPage;
    const nextSearch = options?.search ?? catalogSearch;
    const nextCategory = options?.category ?? selectedCategory;
    const nextPriceRangeId = options?.priceRangeId ?? selectedPriceRangeId;
    const selectedPriceRange = PRICE_RANGE_OPTIONS.find((option) => option.id === nextPriceRangeId) ?? PRICE_RANGE_OPTIONS[0];

    setCatalogLoading(true);
    try {
      const res = await getCatalogProducts({
        search: nextSearch.trim() || undefined,
        category: nextCategory !== "all" ? nextCategory : undefined,
        min_price: selectedPriceRange.min,
        max_price: selectedPriceRange.max,
        page: nextPage,
        per_page: 24,
        listing_type: "wholesale_centre",
      });

      setCatalogProducts(res.products.data);
      setCatalogCategories(
        res.filters?.categories?.length
          ? res.filters.categories
          : Array.from(
              new Set(
                res.products.data
                  .map((product) => String(product.category_slug ?? "").trim())
                  .filter(Boolean),
              ),
            ),
      );
      setCatalogPage(Number(res.products.current_page ?? nextPage));
      setCatalogLastPage(Math.max(1, Number(res.products.last_page ?? 1)));
      setCatalogTotal(Number(res.products.total ?? res.products.data.length));
    } catch (error: any) {
      setCatalogProducts([]);
      setCatalogLastPage(1);
      setCatalogTotal(0);
      alert(error?.message || "Failed to load wholesale products.");
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog({ page: 1 });
  }, []);

  const handleSearch = () => {
    setCatalogPage(1);
    void loadCatalog({ page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCatalogPage(1);
    void loadCatalog({ page: 1, category });
  };

  const handlePriceRangeChange = (priceRangeId: string) => {
    setSelectedPriceRangeId(priceRangeId);
    setCatalogPage(1);
    void loadCatalog({ page: 1, priceRangeId });
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > catalogLastPage || page === catalogPage) {
      return;
    }

    setCatalogPage(page);
    void loadCatalog({ page });
  };

  const openDetails = async (product: any) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
    setSelectedImage(resolveCatalogThumbnail(product));
    setDetailLoading(true);

    try {
      const res = await getCatalogProduct(product.id);
      setSelectedProduct(res.product);
      setSelectedImage(resolveCatalogThumbnail(res.product));
    } catch (error: any) {
      alert(error?.message || "Unable to load full product details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedImage(null);
    setDetailLoading(false);
  };

  const onAdd = async (id: number) => {
    setListingProductId(id);
    try {
      const res = await addCatalogProductToShop(id);
      const distributedProductId = res.product?.id ?? null;

      setCatalogProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === id
            ? {
                ...product,
                already_distributed: true,
                distributed_product_id: distributedProductId,
                distributed_at: product.distributed_at ?? new Date().toISOString(),
              }
            : product,
        ),
      );
      setSelectedProduct((currentProduct: any) =>
        currentProduct && currentProduct.id === id
          ? {
              ...currentProduct,
              already_distributed: true,
              distributed_product_id: distributedProductId,
              distributed_at: currentProduct.distributed_at ?? new Date().toISOString(),
            }
          : currentProduct,
      );

      alert(
        res.message ||
          (canEditProducts
            ? "Product listed in your shop. You can continue managing it from My Products."
            : "Product listed in your shop. It will appear in My Products as a supplier-managed listing."),
      );
    } catch (error: any) {
      alert(error?.message || "Failed to add product");
    } finally {
      setListingProductId(null);
    }
  };

  const selectedImages = useMemo(() => normalizeCatalogImages(selectedProduct), [selectedProduct]);
  const selectedSpecifications = useMemo(
    () => normalizeCatalogSpecifications(selectedProduct?.specifications),
    [selectedProduct],
  );
  const selectedVariants = useMemo(
    () => normalizeCatalogVariants(selectedProduct?.variants).filter((variant) => variant.is_active !== false),
    [selectedProduct],
  );
  const selectedColors = selectedVariants.filter((variant) => variant.type === "color");
  const selectedSizes = selectedVariants.filter((variant) => variant.type === "size");
  const selectedAlreadyDistributed = isProductDistributed(selectedProduct);
  const selectedImageUrl =
    selectedImage ?? resolveBackendAssetUrl(selectedImages[0]?.image_path) ?? resolveCatalogThumbnail(selectedProduct);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700 ring-1 ring-inset ring-orange-200">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M4 8.5h16v10.5H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 8.5V5h10v3.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 13h3m2 0h3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Supplier-managed catalogue
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Wholesale Centre</h1>
              <p className="text-sm text-gray-500">
                Browse ready-made supplier products, inspect the full detail stack, and list them in your shop without
                editing each field one by one.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Wallet</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {currency} {walletBalance.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              placeholder="Search wholesale products..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm md:w-80"
            />
            <button
              onClick={handleSearch}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Search
            </button>
            <Link
              href="/portal/products/add-new?tab=catalog"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 md:ml-auto"
            >
              Standard catalog
            </Link>
          </div>

          <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Classification</div>
              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-2 pb-1">
                  {categoryFilters.map((category) => {
                    const active = selectedCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryChange(category)}
                        className={`inline-flex h-9 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                          active
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {category === "all" ? "All" : formatCategoryLabel(category)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Price range</div>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGE_OPTIONS.map((range) => {
                  const active = selectedPriceRangeId === range.id;

                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => handlePriceRangeChange(range.id)}
                      className={`inline-flex h-9 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                        active
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {catalogLoading ? (
            <div className="pt-5 text-sm text-gray-500">Loading wholesale products...</div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:[grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
              {catalogProducts.map((product) => {
                const previewImage = resolveCatalogThumbnail(product);
                const alreadyDistributed = isProductDistributed(product);

                return (
                  <article
                    key={product.id}
                    className="flex h-full flex-col overflow-hidden border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <button type="button" onClick={() => openDetails(product)} className="flex flex-1 flex-col text-left">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                        {previewImage ? (
                          <Image
                            src={previewImage}
                            alt={product.title}
                            fill
                            className="object-cover"
                            unoptimized={isBackendImage(previewImage)}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-2.5 p-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-600">
                            {product.category_slug || "General"}
                          </span>
                          {product.promotion_label && (
                            <span className="border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-orange-700">
                              {product.promotion_label}
                            </span>
                          )}
                        </div>

                        <div className="min-h-[2.5rem] line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                          {product.title}
                        </div>

                        <div className="mt-auto">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Shop price</div>
                          <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base">
                            {currency} {formatMoney(product.base_price)}
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-gray-200 p-3">
                      <button
                        type="button"
                        onClick={() => void onAdd(product.id)}
                        disabled={listingProductId === product.id || alreadyDistributed}
                        className="inline-flex h-9 w-full items-center justify-center border border-orange-600 bg-orange-600 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:border-emerald-600 disabled:bg-emerald-600 disabled:opacity-100"
                      >
                        {listingProductId === product.id
                          ? "Listing..."
                          : alreadyDistributed
                            ? "Already distributed"
                            : "Confirm listing"}
                      </button>
                    </div>
                  </article>
                );
              })}
              {catalogProducts.length === 0 && (
                <div className="col-span-full border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  No wholesale products found.
                </div>
              )}
            </div>
          )}

          {!catalogLoading && catalogLastPage > 1 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                Page {catalogPage} of {catalogLastPage} · {catalogTotal} products
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(catalogPage - 1)}
                  disabled={catalogPage <= 1}
                  className="inline-flex h-9 items-center justify-center border border-gray-200 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>

                {visibleCatalogPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                      page === catalogPage
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(catalogPage + 1)}
                  disabled={catalogPage >= catalogLastPage}
                  className="inline-flex h-9 items-center justify-center border border-gray-200 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProductId !== null && (
        <>
          <button
            type="button"
            onClick={closeDetails}
            aria-label="Close product details"
            className="fixed inset-0 z-40 bg-slate-900/35"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">
                  Wholesale Centre detail
                </div>
                <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-gray-900">
                  {selectedProduct?.title || "Product details"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review the supplier content that will power the live listing in your shop.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {detailLoading && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  Loading full product details...
                </div>
              )}

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-3">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-100">
                    {selectedImageUrl ? (
                      <Image
                        src={selectedImageUrl}
                        alt={selectedProduct?.title || "Product image"}
                        fill
                        className="object-cover"
                        unoptimized={isBackendImage(selectedImageUrl)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">
                        No product image available
                      </div>
                    )}
                  </div>

                  {selectedImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {selectedImages.slice(0, 10).map((image, index) => {
                        const imageUrl = resolveBackendAssetUrl(image.image_path);
                        const active = imageUrl === selectedImageUrl;

                        return (
                          <button
                            key={`${image.image_path}-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(imageUrl)}
                            className={`relative aspect-square overflow-hidden rounded-2xl border ${
                              active ? "border-orange-500 ring-2 ring-orange-100" : "border-gray-200"
                            }`}
                          >
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={`Gallery ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized={isBackendImage(imageUrl)}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                                Empty
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Listing metrics
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Shop price</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {currency} {formatMoney(selectedProduct?.base_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Supplier cost</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {currency} {formatMoney(selectedProduct?.wholesale_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Shipping fee</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {currency} {formatMoney(selectedProduct?.shipping_fee)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Available stock</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedProduct?.available_stock ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Minimum order</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedProduct?.min_order_quantity ?? 1}</div>
                  </div>
                  {selectedProduct?.location && (
                    <div>
                      <div className="text-xs text-gray-500">Ships from</div>
                      <div className="text-sm font-semibold text-gray-900">{selectedProduct.location}</div>
                    </div>
                  )}
                  {selectedProduct?.rating != null && (
                    <div>
                      <div className="text-xs text-gray-500">Rating</div>
                      <div className="text-sm font-semibold text-gray-900">{Number(selectedProduct.rating).toFixed(1)} / 5</div>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedProduct?.category_slug || "General"}
                  </span>
                  {selectedProduct?.promotion_label && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                      {selectedProduct.promotion_label}
                    </span>
                  )}
                  {selectedAlreadyDistributed && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Already distributed
                    </span>
                  )}
                  {Array.isArray(selectedProduct?.text_badges) &&
                    selectedProduct.text_badges.map((badge: string) => (
                      <span
                        key={badge}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {badge}
                      </span>
                    ))}
                </div>
                <p className="text-sm leading-6 text-gray-600">
                  {selectedProduct?.description || "No description added yet."}
                </p>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Shipping text</div>
                  <div className="mt-2 text-sm font-medium text-gray-900">
                    {selectedProduct?.shipping_text || "Shipping details available at checkout"}
                  </div>
                  {selectedProduct?.shipping_subtext && (
                    <div className="mt-1 text-xs text-gray-500">{selectedProduct.shipping_subtext}</div>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Guarantee</div>
                  <div className="mt-2 text-sm text-gray-700">
                    {selectedProduct?.guarantee_text || "No guarantee notes added."}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Channel</div>
                  <div className="mt-2 text-sm font-medium text-gray-900">
                    {selectedProduct?.listing_type === "wholesale_centre" ? "Wholesale Centre" : "Catalog"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Supplier-managed content ready for quick listing.</div>
                </div>
              </section>

              {selectedVariants.length > 0 && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Variants</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      These option groups feed the buyer product detail page directly.
                    </p>
                  </div>
                  {selectedColors.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Colors</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedColors.map((variant, index) => {
                          const variantImageUrl = variant.image_path
                            ? resolveBackendAssetUrl(variant.image_path)
                            : null;

                          return (
                            <div
                              key={`${variant.label}-${index}`}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                            >
                              {variantImageUrl ? (
                                <span className="relative h-6 w-6 overflow-hidden rounded-full border border-gray-200">
                                  <Image
                                    src={variantImageUrl}
                                    alt={variant.label}
                                    fill
                                    className="object-cover"
                                    unoptimized={isBackendImage(variantImageUrl)}
                                  />
                                </span>
                              ) : (
                                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                              )}
                              {variant.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedSizes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Sizes</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSizes.map((variant, index) => (
                          <span
                            key={`${variant.label}-${index}`}
                            className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                          >
                            {variant.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {selectedSpecifications.length > 0 && (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Specifications</h3>
                    <p className="mt-1 text-xs text-gray-500">Everything the buyer detail page needs should already be here.</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {selectedSpecifications.map((specification, index) => (
                      <div
                        key={`${specification.label}-${index}`}
                        className={`grid gap-2 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)] ${
                          index === 0 ? "" : "border-t border-gray-100"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-500">{specification.label}</div>
                        <div className="text-sm text-gray-800">{specification.value || "Not specified"}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void onAdd(selectedProductId)}
                  disabled={listingProductId === selectedProductId || selectedAlreadyDistributed}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-emerald-600 disabled:opacity-100"
                >
                  {listingProductId === selectedProductId
                    ? "Listing..."
                    : selectedAlreadyDistributed
                      ? "Already distributed"
                      : "Confirm listing"}
                </button>
                <Link
                  href="/portal/products/my-products"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  My Products
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
