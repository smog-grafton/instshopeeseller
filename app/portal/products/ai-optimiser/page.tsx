"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSellerProducts } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

export default function AiOptimiserPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    getSellerProducts({ per_page: 100 })
      .then((res) => setProducts(res.products?.data || []))
      .finally(() => setLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    return products.map((p) => {
      const issues: string[] = [];
      if (!p.thumbnail_url) issues.push("Add a thumbnail image");
      if (!p.description || p.description.length < 80) issues.push("Improve product description");
      if (p.low_stock) issues.push("Low stock");
      if (p.status === "draft") issues.push("Publish product for review");
      return { ...p, issues };
    });
  }, [products]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Product</div>
        <h1 className="text-xl font-semibold text-gray-900">AI Optimiser</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Optimisation Suggestions</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Analyzing products...</div>
        ) : suggestions.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No products found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {suggestions.map((product) => {
              const imageUrl = product.thumbnail_url || "/images/common/no-image.png";
              return (
                <div key={product.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="w-14 h-14 border border-gray-200 rounded overflow-hidden bg-gray-50">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      width={56}
                      height={56}
                      className="object-cover w-14 h-14"
                      unoptimized={isBackendImage(imageUrl)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{product.title}</div>
                    <div className="text-xs text-gray-500">Status: {product.status || (product.is_active ? "live" : "draft")}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.issues.length === 0 ? (
                      <span className="text-xs text-green-600">All good</span>
                    ) : (
                      product.issues.map((issue: string) => (
                        <span key={issue} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          {issue}
                        </span>
                      ))
                    )}
                  </div>
                  <a href={`/portal/products/edit/${product.id}`} className="text-xs text-blue-600">
                    Fix
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
