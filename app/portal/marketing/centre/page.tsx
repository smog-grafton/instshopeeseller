"use client";

import { useEffect, useMemo, useState } from "react";
import { getSellerCampaigns, getSellerProducts, getSellerVouchers } from "@/lib/api-client";

export default function MarketingCentrePage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSellerCampaigns(), getSellerVouchers(), getSellerProducts({ per_page: 100 })])
      .then(([c, v, p]) => {
        setCampaigns(c.campaigns || []);
        setVouchers(v.vouchers || []);
        setProducts(p.products?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    campaigns.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    return byType;
  }, [campaigns]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Marketing Centre</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading marketing data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Active Campaigns</div>
              <div className="text-2xl font-semibold text-gray-900">{campaigns.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Vouchers</div>
              <div className="text-2xl font-semibold text-gray-900">{vouchers.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Products</div>
              <div className="text-2xl font-semibold text-gray-900">{products.length}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">Campaign Types</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { key: "ads", label: "Shopee Ads", href: "/portal/marketing/ads" },
                { key: "discount", label: "Discount", href: "/portal/marketing/discount" },
                { key: "campaign", label: "Campaign", href: "/portal/marketing/campaign" },
                { key: "affiliate", label: "Affiliate", href: "/portal/marketing/affiliate" },
                { key: "live_video", label: "Live & Video", href: "/portal/marketing/live-video" },
                { key: "shocking_sale", label: "Shocking Sale", href: "/portal/marketing/shocking-sale" },
                { key: "cheapest", label: "Cheapest", href: "/portal/marketing/cheapest" },
                { key: "vouchers", label: "Vouchers", href: "/portal/marketing/vouchers" },
              ].map((item) => (
                <a key={item.key} href={item.href} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">Active: {counts[item.key] || 0}</div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
