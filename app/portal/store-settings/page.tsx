"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSellerPolicyStatus, requestSellerStoreClosure, updateSellerVacationMode, type SellerPolicyStatus } from "@/lib/api-client";

export default function StoreSettingsPage() {
  const [data, setData] = useState<SellerPolicyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getSellerPolicyStatus());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load store settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const toggleVacation = async () => {
    if (!data || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await updateSellerVacationMode(!data.store.vacation_mode);
      setNotice([response.message, ...(response.warnings || [])].join(" "));
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update Vacation Mode.");
    } finally {
      setSaving(false);
    }
  };

  const requestClosure = async () => {
    if (!data || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await requestSellerStoreClosure(note);
      setNotice(response.message);
      setNote("");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to submit the store closure request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <header>
        <h1 className="text-2xl font-black text-neutral-950 sm:text-3xl">Store Status & Closure</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">Pause new orders temporarily or request permanent closure after completing seller obligations.</p>
      </header>
      {loading ? <div className="rounded-lg border bg-white p-6 text-sm text-neutral-500">Loading store status...</div> : null}
      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div> : null}

      {data ? (
        <>
          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">Vacation Mode</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${data.store.vacation_mode ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {data.store.vacation_mode ? "Vacation Mode Active" : "Store Open"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Vacation Mode stops new orders. Existing orders remain your responsibility.</p>
              </div>
              <button type="button" onClick={() => void toggleVacation()} disabled={saving || data.store.is_closed || data.store.closure_status === "pending"} className="min-h-11 rounded-md bg-[#ee4d2d] px-5 text-sm font-bold text-white disabled:opacity-50">
                {data.store.vacation_mode ? "Resume Store" : "Enable Vacation Mode"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">Permanent Store Closure</h2>
              {data.store.closure_status ? <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold capitalize">{data.store.closure_status}</span> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Closure is reviewed by Shopee and is irreversible after approval.</p>
            {data.closure.reasons.length ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-bold text-amber-900">Pending Obligations</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
                  {data.closure.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            ) : <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">This store currently meets the closure eligibility checks.</div>}
            <label htmlFor="closure-note" className="mt-5 block text-sm font-bold text-neutral-700">Note for the review team (optional)</label>
            <textarea id="closure-note" value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 p-3 text-sm text-neutral-950 outline-none focus:border-[#ee4d2d]" />
            <button type="button" onClick={() => void requestClosure()} disabled={saving || !data.closure.eligible || data.store.closure_status === "pending"} className="mt-3 min-h-11 rounded-md border border-red-300 bg-white px-5 text-sm font-bold text-red-700 disabled:opacity-50">Request Store Closure</button>
          </section>
          <Link href="/platform-policies" className="inline-flex min-h-11 items-center text-sm font-bold text-[#ee4d2d] no-underline">Read the Store Closure & Vacation Mode Policy</Link>
        </>
      ) : null}
    </div>
  );
}
