"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSellerReviews } from "@/lib/api-client";
import { isBackendImage } from "@/lib/utils";

export default function ReviewManagementPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState("all");

  const fetchReviews = () => {
    setLoading(true);
    getSellerReviews(rating === "all" ? undefined : { rating: Number(rating) })
      .then((res) => setReviews(res.reviews?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [rating]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Customer Service</div>
        <h1 className="text-xl font-semibold text-gray-900">Review Management</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
          <button onClick={fetchReviews} className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Reviews</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No reviews found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const product = review.product;
              const imageUrl = product?.thumbnail_url || "/images/common/no-image.png";
              return (
                <div key={review.id} className="p-4 flex flex-col md:flex-row gap-3">
                  <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50">
                    <Image
                      src={imageUrl}
                      alt={product?.title || "Product"}
                      width={48}
                      height={48}
                      className="object-cover w-12 h-12"
                      unoptimized={isBackendImage(imageUrl)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{product?.title || "Product"}</div>
                    <div className="text-xs text-gray-500">Rating: {review.rating} • {review.reviewed_at || ""}</div>
                    <div className="text-sm text-gray-700 mt-1">{review.comment || "No comment."}</div>
                    <div className="text-xs text-gray-500 mt-1">By: {review.user?.name || review.username || "Customer"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
