"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSellerProduct } from "@/lib/api-client";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";
import Image from "next/image";

export default function ProductPreviewPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getSellerProduct(id)
      .then((res) => {
        setProduct(res.product);
        const first = res.product.images?.[0]?.image_path || res.product.thumbnail_url || null;
        setActiveImage(first);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const resolveImage = (path?: string | null) => {
    return resolveBackendAssetUrl(path);
  };

  if (loading) return <div className="text-sm text-gray-500">Loading preview...</div>;
  if (!product) return <div className="text-sm text-gray-500">Product not found.</div>;

  const images = product.images || [];
  const gallery = images.length ? images : [{ image_path: product.thumbnail_url }];
  const price = Number(product.price || 0).toFixed(2);
  const original = product.original_price ? Number(product.original_price).toFixed(2) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="border border-gray-200 rounded-lg aspect-square flex items-center justify-center bg-gray-50 overflow-hidden">
            {activeImage ? (
              <Image
                src={resolveImage(activeImage)!}
                alt={product.title}
                width={520}
                height={520}
                className="object-contain"
                unoptimized={isBackendImage(resolveImage(activeImage)!)}
              />
            ) : (
              <div className="text-sm text-gray-400">No image</div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {gallery.map((img: any, idx: number) => {
              const path = resolveImage(img.image_path);
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.image_path)}
                  className={`border rounded ${activeImage === img.image_path ? "border-orange-500" : "border-gray-200"}`}
                >
                  {path ? (
                    <Image src={path} alt="thumb" width={80} height={80} className="object-cover" unoptimized={isBackendImage(path)} />
                  ) : (
                    <div className="h-16" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Rating: {product.rating ?? "0.0"}</span>
            <span>Sold: {product.sold_count ?? 0}</span>
            <span>Stock: {product.stock ?? 0}</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-orange-600">RM {price}</div>
            {original && <div className="text-sm text-gray-400 line-through">RM {original}</div>}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Shipping:</span> {product.shipping_text || "Standard shipping"}
            </div>
            <div className="text-sm text-gray-500">{product.shipping_subtext || "Ships within 2-3 days"}</div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Guarantee:</span> {product.guarantee_text || "100% Authentic"}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Variants</h3>
            <div className="flex flex-wrap gap-2">
              {(product.variants || []).map((v: any) => (
                <span key={v.id} className="px-2 py-1 text-xs border rounded text-gray-600">{v.label}</span>
              ))}
              {(!product.variants || product.variants.length === 0) && (
                <span className="text-xs text-gray-400">No variants</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Product Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(product.specifications || []).map((spec: any) => (
            <div key={spec.id} className="text-sm text-gray-700">
              <span className="font-medium">{spec.label}:</span> {spec.value || "-"}
            </div>
          ))}
          {(!product.specifications || product.specifications.length === 0) && (
            <div className="text-sm text-gray-400">No specifications</div>
          )}
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Description</h3>
        <div className="text-sm text-gray-700 whitespace-pre-line">{product.description}</div>
      </div>
    </div>
  );
}
