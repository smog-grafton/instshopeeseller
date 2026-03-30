"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  assignCollectionProducts,
  createSellerCollection,
  getSellerCollections,
  getSellerProducts,
  updateSellerCollection,
  uploadSellerCollectionImage,
} from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/utils";

export default function ShopDecorationPage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", label: "", description: "" });
  const [createImage, setCreateImage] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerCollections(), getSellerProducts({ per_page: 100 })])
      .then(([c, p]) => {
        setCollections(c.collections || []);
        setProducts(p.products?.data || []);
      })
      .catch(() => setNotice({ type: "err", text: "Failed to load collections." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!createImage) {
      setCreatePreview(null);
      return;
    }
    const url = URL.createObjectURL(createImage);
    setCreatePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [createImage]);

  const productOptions = useMemo(() => products.map((p) => ({ id: p.id, title: p.title })), [products]);

  const onCreate = async () => {
    if (!form.name.trim()) {
      setNotice({ type: "err", text: "Collection name is required." });
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      if (createImage) {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        if (form.label.trim()) fd.append("label", form.label.trim());
        if (form.description.trim()) fd.append("description", form.description.trim());
        fd.append("image", createImage);
        await createSellerCollection(fd);
      } else {
        await createSellerCollection({
          name: form.name.trim(),
          label: form.label.trim() || undefined,
          description: form.description.trim() || undefined,
        });
      }
      setForm({ name: "", label: "", description: "" });
      setCreateImage(null);
      setNotice({ type: "ok", text: "Collection created." });
      loadData();
    } catch (e: any) {
      setNotice({ type: "err", text: e.message || "Could not create collection." });
    } finally {
      setCreating(false);
    }
  };

  const onCollectionImage = async (collectionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingId(collectionId);
    setNotice(null);
    try {
      await uploadSellerCollectionImage(collectionId, file);
      setNotice({ type: "ok", text: "Collection image updated." });
      loadData();
    } catch (err: any) {
      setNotice({ type: "err", text: err.message || "Upload failed." });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 pb-10 sm:px-0">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Shop</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">Shop decoration</h1>
        <p className="mt-1 text-sm text-gray-600">
          Collections appear in your store navigation and can group products for buyers.
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

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900">New collection</h2>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="e.g. New arrivals"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Nav label</label>
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="Optional short label"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Banner image (optional)</label>
              <label className="mt-1 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-600 hover:border-orange-300">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => setCreateImage(e.target.files?.[0] ?? null)}
                />
                {createPreview ? (
                  <div className="relative mx-auto h-28 w-full max-w-md overflow-hidden rounded-lg">
                    <Image src={createPreview} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  "Tap to choose image"
                )}
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="Optional"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
          >
            {creating ? "Creating…" : "Create collection"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900">Your collections</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No collections yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {collections.map((collection) => {
              const img = resolveBackendAssetUrl(collection.image_url);
              return (
                <li key={collection.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-40">
                      {img ? (
                        <Image src={img} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                      {uploadingId === collection.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="rounded bg-white px-2 py-1 text-xs">Uploading…</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{collection.name}</h3>
                        <span className="text-xs text-gray-500">{collection.label || "—"}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Products linked: {collection.products?.length ?? 0}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(e) => onCollectionImage(collection.id, e)}
                          />
                          Change banner
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateSellerCollection(collection.id, {
                              show_in_navigation: !collection.show_in_navigation,
                            }).then(loadData)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {collection.show_in_navigation ? "Hide from nav" : "Show in nav"}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-auto rounded-lg border border-gray-100 p-2 sm:max-h-56">
                        <p className="mb-2 text-xs font-medium text-gray-600">Products in collection</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {productOptions.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                checked={(collection.products || []).some((x: any) => x.id === p.id)}
                                onChange={() => {
                                  const ids = (collection.products || []).map((x: any) => x.id);
                                  const next = ids.includes(p.id) ? ids.filter((x: number) => x !== p.id) : [...ids, p.id];
                                  assignCollectionProducts(collection.id, next).then(loadData);
                                }}
                              />
                              <span className="truncate">{p.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
