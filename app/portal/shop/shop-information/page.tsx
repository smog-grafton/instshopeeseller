"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  getSellerShop,
  updateSellerShop,
  uploadSellerShopCover,
  uploadSellerShopLogo,
} from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/utils";

export default function ShopInformationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadShop = useCallback(() => {
    setLoading(true);
    getSellerShop()
      .then((res) => setShop(res.shop))
      .catch(() => setNotice({ type: "err", text: "Could not load shop." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const logoPreview = resolveBackendAssetUrl(shop?.logo_url) ?? null;
  const coverPreview = resolveBackendAssetUrl(shop?.cover_image_url) ?? null;

  const onSaveText = async () => {
    if (!shop) return;
    setSaving(true);
    setNotice(null);
    try {
      await updateSellerShop({
        name: shop.name,
        description: shop.description,
        status_text: shop.status_text,
      });
      setNotice({ type: "ok", text: "Shop details saved." });
      loadShop();
    } catch (e: any) {
      setNotice({ type: "err", text: e.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingLogo(true);
    setNotice(null);
    try {
      const res = await uploadSellerShopLogo(file);
      setShop(res.shop);
      setNotice({ type: "ok", text: "Logo updated." });
    } catch (err: any) {
      setNotice({ type: "err", text: err.message || "Logo upload failed." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    setNotice(null);
    try {
      const res = await uploadSellerShopCover(file);
      setShop(res.shop);
      setNotice({ type: "ok", text: "Cover image updated." });
    } catch (err: any) {
      setNotice({ type: "err", text: err.message || "Cover upload failed." });
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading && !shop) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-gray-500">Loading shop information…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 pb-10 sm:px-0">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Shop</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">Shop information</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customers see this on your storefront. Upload a logo and cover — no need to paste URLs.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Cover */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900">Cover image</h2>
          <p className="text-xs text-gray-500">Wide banner behind your shop name on the store page.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="relative aspect-[21/9] w-full max-h-48 overflow-hidden rounded-lg bg-gray-100">
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Shop cover"
                fill
                className="object-cover"
                unoptimized
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No cover yet</div>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded bg-white px-3 py-1 text-sm text-gray-800">Uploading…</span>
              </div>
            )}
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 sm:py-2">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onCoverChange} />
            Upload cover image
          </label>
          <p className="mt-2 text-xs text-gray-500">JPG, PNG or WebP · max 8&nbsp;MB</p>
        </div>
      </section>

      {/* Logo + fields */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900">Logo & details</h2>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center sm:items-start">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow ring-1 ring-gray-200">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" fill className="object-cover" unoptimized sizes="96px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">Logo</div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="rounded bg-white px-2 py-0.5 text-xs">…</span>
                  </div>
                )}
              </div>
              <label className="mt-3 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onLogoChange} />
                Upload logo
              </label>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Shop name</label>
                  <input
                    value={shop?.name || ""}
                    onChange={(e) => setShop((s: any) => ({ ...s, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-orange-500/0 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Your shop name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status line</label>
                  <input
                    value={shop?.status_text || ""}
                    onChange={(e) => setShop((s: any) => ({ ...s, status_text: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="e.g. Active recently"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  value={shop?.description || ""}
                  onChange={(e) => setShop((s: any) => ({ ...s, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Tell buyers about your store."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onSaveText}
              disabled={saving}
              className="w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
