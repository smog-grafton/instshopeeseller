"use client";

import { useEffect, useState } from "react";
import { getSellerSettings, updateSellerSetting } from "@/lib/api-client";

export default function ShopSettingPage() {
  const [loading, setLoading] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const [autoReply, setAutoReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    getSellerSettings()
      .then((res) => {
        const settings = res.settings || {};
        setHolidayMode(Boolean(settings.holiday_mode?.value ?? false));
        setAutoReply(settings.auto_reply?.value || "");
      })
      .catch(() => setNotice({ type: "err", text: "Could not load settings." }))
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await updateSellerSetting("holiday_mode", holidayMode);
      await updateSellerSetting("auto_reply", autoReply);
      setNotice({ type: "ok", text: "Settings saved." });
    } catch (e: any) {
      setNotice({ type: "err", text: e.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-gray-500">Loading shop settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 pb-10 sm:px-0">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Shop</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">Shop settings</h1>
        <p className="mt-1 text-sm text-gray-600">Control holiday mode and automated chat replies.</p>
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
          <h2 className="text-sm font-semibold text-gray-900">Holiday mode</h2>
          <p className="text-xs text-gray-500">When enabled, your listings can be hidden from buyers (per platform rules).</p>
        </div>
        <div className="p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-4 transition hover:bg-gray-50">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              checked={holidayMode}
              onChange={(e) => setHolidayMode(e.target.checked)}
            />
            <span className="text-sm text-gray-800">
              <span className="font-medium">Enable holiday mode</span>
              <span className="mt-1 block text-xs font-normal text-gray-600">
                Temporarily pause normal selling visibility where supported.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900">Auto-reply</h2>
          <p className="text-xs text-gray-500">Shown to buyers when you are not available to chat immediately.</p>
        </div>
        <div className="p-4 sm:p-5">
          <textarea
            value={autoReply}
            onChange={(e) => setAutoReply(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            placeholder="Thanks for your message. We will reply within 24 hours."
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
