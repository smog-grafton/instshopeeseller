"use client";

import { useEffect, useState } from "react";
import { createSellerCampaign, getSellerCampaigns } from "@/lib/api-client";

export default function SloanPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    getSellerCampaigns("loan")
      .then((c) => setApplications(c.campaigns || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onApply = async () => {
    if (!amount || !duration || !purpose) return;
    setSaving(true);
    try {
      await createSellerCampaign({
        type: "loan",
        title: `Loan Request ${amount}`,
        status: "draft",
        meta: { amount: Number(amount), duration_months: Number(duration), purpose },
      });
      setAmount("");
      setDuration("");
      setPurpose("");
      loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Finance</div>
        <h1 className="text-xl font-semibold text-gray-900">SLoan for Sellers</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Apply for SLoan</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Loan amount"
            type="number"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (months)"
            type="number"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Purpose"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <button
          onClick={onApply}
          disabled={saving}
          className="mt-4 h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Submitting..." : "Submit Application"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Applications</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No loan applications.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{app.title}</div>
                  <div className="text-xs text-gray-500">Amount: {app.meta?.amount || "—"} • Duration: {app.meta?.duration_months || "—"} months</div>
                </div>
                <div className="text-xs text-gray-500">Status: {app.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
