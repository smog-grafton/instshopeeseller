"use client";

import { useEffect, useState } from "react";
import { getSellerApplication, getUserAddresses, saveOnboardingStep2, type PreferredCourier } from "@/lib/api-client";

export default function ShippingSettingPage() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [shippingPreference, setShippingPreference] = useState<"platform" | "own">("platform");
  const [preferredCouriers, setPreferredCouriers] = useState<PreferredCourier[]>([]);
  const [pickupAddressId, setPickupAddressId] = useState<number | null>(null);
  const [codEnabled, setCodEnabled] = useState(false);
  const [daysToShip, setDaysToShip] = useState("");
  const [shippingTermsAccepted, setShippingTermsAccepted] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSellerApplication(), getUserAddresses()])
      .then(([app, addr]) => {
        const application: any = app.application;
        if (application) {
          setShippingPreference(application.shipping_preference || "platform");
          setPreferredCouriers(application.preferred_couriers || []);
          setPickupAddressId(application.pickup_address_id || null);
          setCodEnabled(Boolean(application.cod_enabled));
          setDaysToShip(application.days_to_ship ? String(application.days_to_ship) : "");
        }
        setAddresses(addr.addresses || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCourier = (value: PreferredCourier) => {
    setPreferredCouriers((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveOnboardingStep2({
        shipping_preference: shippingPreference,
        preferred_couriers: shippingPreference === "platform" ? preferredCouriers : [],
        pickup_address_id: pickupAddressId || undefined,
        cod_enabled: codEnabled,
        days_to_ship: daysToShip ? Number(daysToShip) : undefined,
        shipping_terms_accepted: shippingTermsAccepted,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Order</div>
        <h1 className="text-xl font-semibold text-gray-900">Shipping Setting</h1>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading shipping settings...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">Shipping Preference</div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={shippingPreference === "platform"}
                  onChange={() => setShippingPreference("platform")}
                />
                Platform Shipping
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={shippingPreference === "own"}
                  onChange={() => setShippingPreference("own")}
                />
                Own Logistics
              </label>
            </div>
          </div>

          {shippingPreference === "platform" && (
            <div>
              <div className="text-sm font-semibold text-gray-800">Preferred Couriers</div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {(["standard", "express", "jnt", "poslaju", "dhl", "cod"] as PreferredCourier[]).map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <input type="checkbox" checked={preferredCouriers.includes(c)} onChange={() => toggleCourier(c)} />
                    {c.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-gray-800">Pickup Address</div>
            <select
              value={pickupAddressId || ""}
              onChange={(e) => setPickupAddressId(e.target.value ? Number(e.target.value) : null)}
              className="mt-2 h-9 px-3 border border-gray-200 rounded text-sm w-full"
            >
              <option value="">Select address</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.streetAddress}, {a.stateArea} {a.postalCode}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
              Enable Cash on Delivery
            </label>
            <input
              type="number"
              placeholder="Days to ship (1-14)"
              value={daysToShip}
              onChange={(e) => setDaysToShip(e.target.value)}
              className="h-9 px-3 border border-gray-200 rounded text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shippingTermsAccepted} onChange={(e) => setShippingTermsAccepted(e.target.checked)} />
            I agree to the shipping terms
          </label>

          <div>
            <button
              onClick={onSave}
              disabled={saving}
              className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
