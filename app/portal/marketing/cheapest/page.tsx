"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createSellerCampaign, getSellerCampaigns, getSellerProducts, updateSellerCampaign } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

export default function CheapestOnShopeePage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([getSellerProducts({ per_page: 100 }), getSellerCampaigns("cheapest")])
      .then(([p, c]) => {
        setProducts(p.products?.data || []);
        setCampaigns(c.campaigns || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => Number(a.price) - Number(b.price)), [products]);

  const isFeatured = (productId: number) => campaigns.some((c) => c.meta?.product_id === productId && c.status !== "completed");

  const featureProduct = async (product: any) => {
    await createSellerCampaign({
      type: "cheapest",
      title: `Cheapest: ${product.title}`,
      status: "running",
      meta: { product_id: product.id },
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Cheapest on Shopee</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Lowest Price Products</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading products...</div>
        ) : sortedProducts.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No products found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedProducts.map((product) => {
              const imageUrl = product.thumbnail_url || "/images/common/no-image.png";
              return (
                <div key={product.id} className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      width={48}
                      height={48}
                      className="object-cover w-12 h-12"
                      unoptimized={isBackendImage(imageUrl)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{product.title}</div>
                    <div className="text-xs text-gray-500">Price: {Number(product.price).toFixed(2)}</div>
                  </div>
                  {isFeatured(product.id) ? (
                    <button
                      onClick={() => {
                        const campaign = campaigns.find((c) => c.meta?.product_id === product.id);
                        if (campaign) updateSellerCampaign(campaign.id, { status: "completed" }).then(loadData);
                      }}
                      className="text-xs text-gray-600"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => featureProduct(product)}
                      className="h-8 px-3 border border-gray-200 rounded text-xs hover:bg-gray-50"
                    >
                      Feature
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
