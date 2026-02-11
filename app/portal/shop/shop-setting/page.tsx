"use client";

import { useEffect, useState } from "react";
import { getSellerSettings, updateSellerSetting } from "@/lib/api-client";

export default function ShopSettingPage() {
  const [loading, setLoading] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const [autoReply, setAutoReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSellerSettings()
      .then((res) => {
        const settings = res.settings || {};
        setHolidayMode(Boolean(settings.holiday_mode?.value ?? false));
        setAutoReply(settings.auto_reply?.value || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateSellerSetting("holiday_mode", holidayMode);
      await updateSellerSetting("auto_reply", autoReply);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading shop settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Shop</div>
        <h1 className="text-xl font-semibold text-gray-900">Shop Setting</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={holidayMode} onChange={(e) => setHolidayMode(e.target.checked)} />
          Enable holiday mode (temporarily hide products)
        </label>
        <div>
          <div className="text-sm font-semibold text-gray-800">Auto-reply message</div>
          <textarea
            value={autoReply}
            onChange={(e) => setAutoReply(e.target.value)}
            rows={3}
            className="mt-2 w-full border border-gray-200 rounded p-2 text-sm"
            placeholder="Thanks for your message. We will reply within 24 hours."
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
