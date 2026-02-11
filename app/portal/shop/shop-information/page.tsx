"use client";

import { useEffect, useState } from "react";
import { getSellerShop, updateSellerShop } from "@/lib/api-client";

export default function ShopInformationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>(null);

  const loadShop = () => {
    setLoading(true);
    getSellerShop()
      .then((res) => setShop(res.shop))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadShop();
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateSellerShop({
        name: shop.name,
        description: shop.description,
        status_text: shop.status_text,
        logo_url: shop.logo_url,
        cover_image_url: shop.cover_image_url,
      });
      loadShop();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading shop information...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Shop</div>
        <h1 className="text-xl font-semibold text-gray-900">Shop Information</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={shop?.name || ""}
            onChange={(e) => setShop((s: any) => ({ ...s, name: e.target.value }))}
            placeholder="Shop name"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={shop?.status_text || ""}
            onChange={(e) => setShop((s: any) => ({ ...s, status_text: e.target.value }))}
            placeholder="Status text"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <textarea
          value={shop?.description || ""}
          onChange={(e) => setShop((s: any) => ({ ...s, description: e.target.value }))}
          placeholder="Shop description"
          rows={4}
          className="w-full border border-gray-200 rounded p-2 text-sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={shop?.logo_url || ""}
            onChange={(e) => setShop((s: any) => ({ ...s, logo_url: e.target.value }))}
            placeholder="Logo URL"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={shop?.cover_image_url || ""}
            onChange={(e) => setShop((s: any) => ({ ...s, cover_image_url: e.target.value }))}
            placeholder="Cover image URL"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
