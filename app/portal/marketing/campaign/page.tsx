"use client";

import { useEffect, useState } from "react";
import { createSellerCampaign, getSellerCampaigns, updateSellerCampaign } from "@/lib/api-client";

export default function CampaignPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    getSellerCampaigns("campaign")
      .then((c) => setCampaigns(c.campaigns || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createSellerCampaign({
        type: "campaign",
        title,
        status: "draft",
        start_at: startAt || null,
        end_at: endAt || null,
        meta: { goal },
      });
      setTitle("");
      setGoal("");
      setStartAt("");
      setEndAt("");
      loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Marketing Centre</div>
        <h1 className="text-xl font-semibold text-gray-900">Campaign</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Create Campaign</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Goal (e.g. 500 orders)"
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
          <input
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded text-sm"
          />
        </div>
        <button
          onClick={onCreate}
          disabled={saving}
          className="mt-4 h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Campaign"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">My Campaigns</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No campaigns yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{c.title}</div>
                  <div className="text-xs text-gray-500">Goal: {c.meta?.goal || "—"}</div>
                </div>
                <button
                  onClick={() => updateSellerCampaign(c.id, { status: c.status === "running" ? "paused" : "running" }).then(loadData)}
                  className="text-xs text-blue-600"
                >
                  {c.status === "running" ? "Pause" : "Run"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
