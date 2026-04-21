"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  getUserAddresses,
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
  submitOnboarding,
  getCountries,
  getSellerApplication,
  Address,
  CountryOption,
  ShippingPreference,
  type PreferredCourier,
} from "@/lib/api-client";
import { isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const STEP_IDS = { step1: "311300", step2: "311301", step3: "311302", step4: "311303" } as const;

type OnboardingApplicationSnapshot = {
  shop_name?: string;
  phone?: string;
  invitation_code?: string;
  shipping_preference?: ShippingPreference;
  preferred_couriers?: PreferredCourier[];
  cod_enabled?: boolean;
  days_to_ship?: number | string | null;
  identity_document_url?: string;
  business_registration_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
};

type ApiErrorWithFields = Error & {
  errors?: Record<string, string[]>;
};

export default function OnboardingFormPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const formId = params.formId as string;
  const stepId = params.stepId as string;

  const [shopName, setShopName] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showNotificationTooltip, setShowNotificationTooltip] = useState(false);
  const [showSupportTooltip, setShowSupportTooltip] = useState(false);
  const [showChatTooltip, setShowChatTooltip] = useState(false);

  // Step 2
  const [shippingPreference, setShippingPreference] = useState<ShippingPreference | "">("");
  const [preferredCouriers, setPreferredCouriers] = useState<PreferredCourier[]>([]);
  const [codEnabled, setCodEnabled] = useState(false);
  const [daysToShip, setDaysToShip] = useState<number>(3);
  const [shippingTermsAccepted, setShippingTermsAccepted] = useState(false);
  // Step 3
  const [identityDocFront, setIdentityDocFront] = useState<File | null>(null);
  const [identityDocBack, setIdentityDocBack] = useState<File | null>(null);
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState("");
  const [businessRegistrationUrl, setBusinessRegistrationUrl] = useState("");
  // Step 4
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const COURIER_OPTIONS: { value: PreferredCourier; label: string }[] = [
    { value: "standard", label: "Standard Shipping" },
    { value: "express", label: "Express" },
    { value: "jnt", label: "J&T" },
    { value: "poslaju", label: "Pos Laju" },
    { value: "dhl", label: "DHL" },
    { value: "cod", label: "Cash on Delivery (COD)" },
    { value: "other", label: "Other" },
  ];
  const MAX_IMAGE_MB = 5;
  const MAX_PDF_MB = 10;

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (!user) return;
    getSellerApplication()
      .then((res) => {
        const app = res.application as OnboardingApplicationSnapshot | null;
        if (!app) return;
        if (app.shop_name) setShopName(app.shop_name);
        if (app.phone) setPhone(String(app.phone).replace(/^\+\d+/, "") || app.phone);
        if (app.invitation_code) setInvitationCode(app.invitation_code);
        if (app.shipping_preference) setShippingPreference(app.shipping_preference);
        if (Array.isArray(app.preferred_couriers) && app.preferred_couriers.length) setPreferredCouriers(app.preferred_couriers);
        if (typeof app.cod_enabled === "boolean") setCodEnabled(app.cod_enabled);
        if (app.days_to_ship != null) setDaysToShip(Number(app.days_to_ship) || 3);
        if (app.identity_document_url) setIdentityDocumentUrl(app.identity_document_url);
        if (app.business_registration_url) setBusinessRegistrationUrl(app.business_registration_url);
        if (app.bank_account_name) setBankAccountName(app.bank_account_name);
        if (app.bank_account_number) setBankAccountNumber(app.bank_account_number);
        if (app.bank_name) setBankName(app.bank_name);
      })
      .catch(() => {});
  }, [user]);

  const loadCountries = async () => {
    try {
      const res = await getCountries();
      setCountries(res.countries.filter((c) => c.callingCode));
      const defaultCountry = res.countries.find((c) => c.code === "MY") ?? res.countries[0];
      if (defaultCountry?.callingCode) {
        setSelectedCountry(defaultCountry);
      }
    } catch (e) {
      console.error("Failed to load countries:", e);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await getUserAddresses();
      setAddresses(response.addresses);
      // Select default address if available
      const defaultAddress = response.addresses.find((addr) => addr.setAsDefault);
      if (defaultAddress) {
        setSelectedAddressId(Number(defaultAddress.id));
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  };

  const fullPhoneNumber = selectedCountry?.callingCode
    ? `+${selectedCountry.callingCode}${phone.replace(/\D/g, "")}`
    : phone;

  const handleSave = async () => {
    if (!shopName.trim()) {
      alert("Please enter a shop name");
      return;
    }

    setSaving(true);
    try {
      await saveOnboardingStep1({
        shop_name: shopName,
        pickup_address_id: selectedAddressId ?? undefined,
        phone: fullPhoneNumber.trim() || undefined,
        invitation_code: invitationCode.trim().toUpperCase() || undefined,
      });
      alert("Form saved successfully!");
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to save form"));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (stepId === STEP_IDS.step1) {
      if (!shopName.trim()) {
        alert("Please enter a shop name to continue");
        return;
      }
      setSaving(true);
      try {
        await saveOnboardingStep1({
          shop_name: shopName,
          pickup_address_id: selectedAddressId ?? undefined,
          phone: fullPhoneNumber.trim() || undefined,
          invitation_code: invitationCode.trim().toUpperCase() || undefined,
        });
        router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step2}`);
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to save form"));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (stepId === STEP_IDS.step2) {
      if (!shippingPreference) {
        alert("Please select a shipping option");
        return;
      }
      if (shippingPreference === "platform" && preferredCouriers.length === 0) {
        alert("Please select at least one shipping channel");
        return;
      }
      if (!shippingTermsAccepted) {
        alert("You must agree to the shipping terms to continue");
        return;
      }
      setSaving(true);
      try {
        await saveOnboardingStep2({
          shipping_preference: shippingPreference,
          preferred_couriers: shippingPreference === "platform" ? preferredCouriers : undefined,
          pickup_address_id: selectedAddressId ?? undefined,
          cod_enabled: codEnabled,
          days_to_ship: daysToShip,
          shipping_terms_accepted: true,
        });
        router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step3}`);
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to save"));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (stepId === STEP_IDS.step3) {
      const hasIdentity = !!identityDocFront || !!identityDocumentUrl.trim();
      if (!hasIdentity) {
        alert("Please upload the front of your ID or provide an identity document URL.");
        return;
      }
      if (!selfieFile) {
        alert("Please upload a selfie with your ID.");
        return;
      }
      const formData = new FormData();
      if (identityDocFront) formData.append("identity_document_front", identityDocFront);
      if (identityDocBack) formData.append("identity_document_back", identityDocBack);
      if (businessRegFile) formData.append("business_registration", businessRegFile);
      if (selfieFile) formData.append("selfie_with_id", selfieFile);
      if (identityDocumentUrl.trim()) formData.append("identity_document_url", identityDocumentUrl.trim());
      if (businessRegistrationUrl.trim()) formData.append("business_registration_url", businessRegistrationUrl.trim());
      setSaving(true);
      try {
        await saveOnboardingStep3(formData);
        router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step4}`);
      } catch (error: unknown) {
        const err = error as ApiErrorWithFields;
        const msg = err.errors ? Object.values(err.errors).flat().join(" ") : getErrorMessage(error, "Failed to save");
        alert(msg || "Failed to save");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmitApplication = async () => {
    setSaving(true);
    try {
      await submitOnboarding({
        bank_account_name: bankAccountName.trim() || undefined,
        bank_account_number: bankAccountNumber.trim() || undefined,
        bank_name: bankName.trim() || undefined,
      });
      window.location.href = "/";
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to submit application"));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (stepId === STEP_IDS.step2) router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step1}`);
    else if (stepId === STEP_IDS.step3) router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step2}`);
    else if (stepId === STEP_IDS.step4) router.push(`/portal/my-onboarding/form/${formId}/${STEP_IDS.step3}`);
  };

  const getUserAvatar = () => {
    if (user?.avatarUrl) {
      return resolveBackendAssetUrl(user.avatarUrl);
    }
    return null;
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const formatAddress = (address: Address) => {
    return `${address.fullName} | ${address.phoneNumber}\n${address.streetAddress}${address.unitNo ? `, ${address.unitNo}` : ""}\n${address.stateArea}\n${address.postalCode}`;
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-14">
        <div className="h-14 flex items-center justify-between px-4 max-w-[1232px] mx-auto">
          <div className="flex items-center ml-4">
            <Link href="/portal/my-onboarding">
              <Image
                src="/assets/images/logos/logo-orange.svg"
                alt="Shopee"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center relative max-w-[259px]">
            <div className="flex items-center w-full h-14 px-4 gap-2 cursor-pointer">
              {getUserAvatar() ? (
                <Image
                  src={getUserAvatar()!}
                  alt={user?.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0"
                  unoptimized={isBackendImage(getUserAvatar())}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className = "w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0";
                      fallback.textContent = getUserInitials();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {getUserInitials()}
                </div>
              )}
              <div className="flex-1 text-sm text-gray-700">
                <div className="max-w-[160px] text-sm leading-tight overflow-hidden whitespace-nowrap text-ellipsis">
                  {user?.name || "User"}
                </div>
              </div>
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-gray-700 flex-shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.25 9.19 4.28 5.22a.75.75 0 0 0-1.06 1.06l4.5 4.5a.75.75 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-1.06-1.06L8.25 9.19Z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[580px] pb-16 bg-gray-50">
        <div className="max-w-[1232px] mx-auto px-4 py-8">
          <div className="flex gap-4">
            {/* Form Card */}
            <div className="flex-1 bg-white rounded shadow-sm">
              {/* Progress Stepper */}
              <div className="border-b border-gray-200 mx-6">
                  <div className="flex justify-center items-center my-12">
                  <div className="flex items-center w-full max-w-[944px] min-w-[944px]">
                    {/* Step 1 - Shop Information */}
                    <div className="flex-1 flex flex-col items-center relative">
                      <div className={`w-2.5 h-2.5 rounded-full mb-3 flex-shrink-0 ${stepId === STEP_IDS.step1 ? "bg-orange-600" : "bg-gray-300"}`}></div>
                      <div className="text-center mt-3 ml-2">
                        <div className={`text-base max-w-[200px] ${stepId === STEP_IDS.step1 ? "font-medium text-gray-900" : "text-gray-400"}`}>Shop Information</div>
                      </div>
                      <div className="absolute top-[5px] left-[50%] w-[calc(100%-42px)] h-px bg-gray-200 transform translate-x-[97px]"></div>
                    </div>

                    {/* Step 2 - Shipping Channel */}
                    <div className="flex-1 flex flex-col items-center relative">
                      <div className={`w-2.5 h-2.5 rounded-full mb-3 flex-shrink-0 ${stepId === STEP_IDS.step2 ? "bg-orange-600" : "bg-gray-300"}`}></div>
                      <div className="text-center mt-3 ml-2">
                        <div className={`text-base max-w-[200px] ${stepId === STEP_IDS.step2 ? "font-medium text-gray-900" : "text-gray-400"}`}>Shipping Channel</div>
                      </div>
                      <div className="absolute top-[5px] left-[50%] w-[calc(100%-42px)] h-px bg-gray-200 transform translate-x-[97px]"></div>
                    </div>

                    {/* Step 3 - Seller Verification */}
                    <div className="flex-1 flex flex-col items-center relative">
                      <div className={`w-2.5 h-2.5 rounded-full mb-3 flex-shrink-0 ${stepId === STEP_IDS.step3 ? "bg-orange-600" : "bg-gray-300"}`}></div>
                      <div className="text-center mt-3 ml-2">
                        <div className={`text-base max-w-[200px] ${stepId === STEP_IDS.step3 ? "font-medium text-gray-900" : "text-gray-400"}`}>Seller Verification</div>
                      </div>
                      <div className="absolute top-[5px] left-[50%] w-[calc(100%-42px)] h-px bg-gray-200 transform translate-x-[97px]"></div>
                    </div>

                    {/* Step 4 - Submit */}
                    <div className="flex-1 flex flex-col items-center relative w-fit">
                      <div className={`w-2.5 h-2.5 rounded-full mb-3 flex-shrink-0 ${stepId === STEP_IDS.step4 ? "bg-orange-600" : "bg-gray-300"}`}></div>
                      <div className="text-center mt-3 ml-2">
                        <div className={`text-base max-w-[200px] ${stepId === STEP_IDS.step4 ? "font-medium text-gray-900" : "text-gray-400"}`}>Submit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 pb-8">
                <form className="max-w-[944px] mx-auto" onSubmit={(e) => e.preventDefault()}>
                  {stepId === STEP_IDS.step1 && (
                  <div>
                    {/* Shop Name */}
                    <div className="flex items-start mb-6">
                      <label htmlFor="shop_name" className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                        <span className="text-red-500 mr-1">*</span>
                        Shop Name
                      </label>
                      <div className="flex-1 relative">
                        <div className="inline-table w-full max-w-[384px]">
                          <div className="relative inline-table w-full h-8 border border-gray-200 rounded">
                            <input
                              id="shop_name"
                              type="text"
                              maxLength={35}
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              placeholder="Input"
                              className="inline-block w-full h-[30px] px-3 border-0 outline-0 text-sm text-gray-700 bg-transparent rounded"
                            />
                            <div className="table-cell w-[1px] h-[30px] pl-2 pr-3 align-middle text-right pointer-events-none">
                              <span className="text-sm text-gray-400">{shopName.length}/35</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pickup Address (optional for now) */}
                    <div className="flex items-start mb-6">
                      <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                        Pickup Address <span className="text-gray-400 text-xs ml-1">(optional)</span>
                      </label>
                      <div className="flex-1">
                        {selectedAddress ? (
                          <div className="max-w-[384px]">
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-[18px] pt-2">{formatAddress(selectedAddress)}</p>
                            <button
                              type="button"
                              onClick={() => setShowAddressModal(true)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAddressModal(true)}
                            className="h-8 px-3 border border-gray-200 rounded text-sm text-left text-gray-500 hover:border-orange-600 max-w-[384px] w-full"
                          >
                            Select pickup address
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email (optional for now) */}
                    <div className="flex items-start mb-6">
                      <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                        Email <span className="text-gray-400 text-xs ml-1">(optional)</span>
                      </label>
                      <div className="flex-1">
                        <div className="max-w-[384px]">
                          <div className="text-sm text-gray-700 leading-[32px]">{user?.email}</div>
                          <div className="pt-1 text-xs text-gray-500 leading-4">
                            This is a mandatory step for us to communicate with you efficiently.{" "}
                            <a href="#" className="text-blue-600 hover:underline">
                              Unable to verify?
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone Number (optional for now) */}
                    <div className="flex items-start mb-6">
                      <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                        Phone Number <span className="text-gray-400 text-xs ml-1">(optional)</span>
                      </label>
                      <div className="flex-1">
                        <div className="max-w-[384px] relative">
                          <div className="flex border border-gray-200 rounded overflow-hidden">
                            <div
                              className="flex items-center h-8 min-w-[80px] pl-3 pr-2 border-r border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100"
                              onClick={() => setCountryDropdownOpen((o) => !o)}
                            >
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                +{selectedCountry?.callingCode ?? "..."}
                              </span>
                              <svg className="w-4 h-4 ml-1 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Input"
                              className="flex-1 min-w-0 h-8 px-3 border-0 outline-0 text-sm text-gray-700"
                            />
                          </div>
                          {countryDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setCountryDropdownOpen(false)} />
                              <div className="absolute left-0 top-full mt-1 w-full max-h-56 overflow-hidden bg-white border border-gray-200 rounded shadow-lg z-20">
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder="Search country..."
                                  className="w-full h-9 px-3 border-b border-gray-100 text-sm outline-0"
                                />
                                <div className="overflow-y-auto max-h-48">
                                  {countries
                                    .filter(
                                      (c) =>
                                        !countrySearch.trim() ||
                                        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                        (c.callingCode && c.callingCode.includes(countrySearch))
                                    )
                                    .map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                                        onClick={() => {
                                          setSelectedCountry(c);
                                          setCountryDropdownOpen(false);
                                          setCountrySearch("");
                                        }}
                                      >
                                        <span className="text-gray-700">{c.name}</span>
                                        <span className="text-gray-500">+{c.callingCode}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Invitation Code */}
                    <div className="flex items-start">
                      <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                        Invitation Code <span className="text-gray-400 text-xs ml-1">(optional)</span>
                      </label>
                      <div className="flex-1">
                        <div className="max-w-[384px] space-y-2">
                          <input
                            type="text"
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                            placeholder="e.g. SHOPEE-X2"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                          <p className="text-xs text-gray-500">
                            Add the invitation code given to you by support or an admin. You can continue without one.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {stepId === STEP_IDS.step2 && (
                    <div className="space-y-6">
                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                          <span className="text-red-500 mr-1">*</span> Shipping preference
                        </label>
                        <div className="flex-1 max-w-[480px] space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="shipping_preference"
                              checked={shippingPreference === "platform"}
                              onChange={() => setShippingPreference("platform")}
                              className="rounded border-gray-300 text-orange-600"
                            />
                            <span className="text-sm text-gray-700">Use platform logistics</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="shipping_preference"
                              checked={shippingPreference === "own"}
                              onChange={() => setShippingPreference("own")}
                              className="rounded border-gray-300 text-orange-600"
                            />
                            <span className="text-sm text-gray-700">I will arrange my own shipping</span>
                          </label>
                        </div>
                      </div>

                      {shippingPreference === "platform" && (
                        <div className="flex items-start mb-6">
                          <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                            <span className="text-red-500 mr-1">*</span> Preferred couriers
                          </label>
                          <div className="flex-1 max-w-[480px] flex flex-wrap gap-3">
                            {COURIER_OPTIONS.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={preferredCouriers.includes(opt.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) setPreferredCouriers((c) => [...c, opt.value]);
                                    else setPreferredCouriers((c) => c.filter((x) => x !== opt.value));
                                  }}
                                  className="rounded border-gray-300 text-orange-600"
                                />
                                <span className="text-sm text-gray-700">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          Pickup / warehouse address
                        </label>
                        <div className="flex-1 max-w-[480px]">
                          {selectedAddress ? (
                            <div>
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-[18px] pt-2">{formatAddress(selectedAddress)}</p>
                              <button type="button" onClick={() => setShowAddressModal(true)} className="text-sm text-blue-600 hover:text-blue-700">
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAddressModal(true)}
                              className="h-8 px-3 border border-gray-200 rounded text-sm text-left text-gray-500 hover:border-orange-600 max-w-[384px] w-full"
                            >
                              Select pickup address
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4" />
                        <div className="flex-1 max-w-[480px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={codEnabled}
                              onChange={(e) => setCodEnabled(e.target.checked)}
                              className="rounded border-gray-300 text-orange-600"
                            />
                            <span className="text-sm text-gray-700">Enable Cash on Delivery (COD)</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                          Days to ship
                        </label>
                        <div className="flex-1 max-w-[120px]">
                          <input
                            type="number"
                            min={1}
                            max={14}
                            value={daysToShip}
                            onChange={(e) => setDaysToShip(Math.min(14, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                          <p className="text-xs text-gray-500 mt-1">1–14 days</p>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4" />
                        <div className="flex-1 max-w-[480px]">
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={shippingTermsAccepted}
                              onChange={(e) => setShippingTermsAccepted(e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 mt-0.5"
                            />
                            <span className="text-sm text-gray-700">
                              I agree to the shipping terms and will use the selected channels and pickup address for orders.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {stepId === STEP_IDS.step3 && (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Upload clear photos of your ID and a selfie. Blurry or edited images may be rejected.
                      </p>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          <span className="text-red-500 mr-1">*</span> ID document (front)
                        </label>
                        <div className="flex-1 max-w-[400px]">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f && f.size <= MAX_IMAGE_MB * 1024 * 1024) setIdentityDocFront(f);
                              else if (f) alert(`File must be under ${MAX_IMAGE_MB}MB`);
                            }}
                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
                          />
                          {identityDocFront && <p className="text-xs text-gray-500 mt-1">{identityDocFront.name} ({(identityDocFront.size / 1024).toFixed(1)} KB)</p>}
                          <p className="text-xs text-gray-500 mt-0.5">JPG or PNG, max {MAX_IMAGE_MB}MB</p>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          ID document (back) <span className="text-gray-400 text-xs ml-1">(optional)</span>
                        </label>
                        <div className="flex-1 max-w-[400px]">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f && f.size <= MAX_IMAGE_MB * 1024 * 1024) setIdentityDocBack(f);
                              else if (f) alert(`File must be under ${MAX_IMAGE_MB}MB`);
                            }}
                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
                          />
                          {identityDocBack && <p className="text-xs text-gray-500 mt-1">{identityDocBack.name}</p>}
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          <span className="text-red-500 mr-1">*</span> Selfie with ID
                        </label>
                        <div className="flex-1 max-w-[400px]">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f && f.size <= MAX_IMAGE_MB * 1024 * 1024) setSelfieFile(f);
                              else if (f) alert(`File must be under ${MAX_IMAGE_MB}MB`);
                            }}
                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
                          />
                          {selfieFile && <p className="text-xs text-gray-500 mt-1">{selfieFile.name}</p>}
                          <p className="text-xs text-gray-500 mt-0.5">Hold your ID next to your face. Max {MAX_IMAGE_MB}MB</p>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          Business registration <span className="text-gray-400 text-xs ml-1">(optional, for companies)</span>
                        </label>
                        <div className="flex-1 max-w-[400px]">
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f && f.size <= MAX_PDF_MB * 1024 * 1024) setBusinessRegFile(f);
                              else if (f) alert(`File must be under ${MAX_PDF_MB}MB`);
                            }}
                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
                          />
                          {businessRegFile && <p className="text-xs text-gray-500 mt-1">{businessRegFile.name}</p>}
                          <p className="text-xs text-gray-500 mt-0.5">PDF or image, max {MAX_PDF_MB}MB</p>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4 pt-1">
                          Or paste URL <span className="text-gray-400 text-xs ml-1">(optional)</span>
                        </label>
                        <div className="flex-1 max-w-[400px] space-y-2">
                          <input
                            type="url"
                            value={identityDocumentUrl}
                            onChange={(e) => setIdentityDocumentUrl(e.target.value)}
                            placeholder="Identity document URL"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                          <input
                            type="url"
                            value={businessRegistrationUrl}
                            onChange={(e) => setBusinessRegistrationUrl(e.target.value)}
                            placeholder="Business registration URL"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {stepId === STEP_IDS.step4 && (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        Bank details are optional during onboarding. You can submit now and add or update payout accounts later in Finance &gt; Bank Accounts.
                      </div>
                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                          Bank account name <span className="text-gray-400 text-xs ml-1">(optional)</span>
                        </label>
                        <div className="flex-1 max-w-[384px]">
                          <input
                            type="text"
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            placeholder="Account holder name"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                        </div>
                      </div>
                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                          Bank account number <span className="text-gray-400 text-xs ml-1">(optional)</span>
                        </label>
                        <div className="flex-1 max-w-[384px]">
                          <input
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            placeholder="Account number"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                        </div>
                      </div>
                      <div className="flex items-start mb-6">
                        <label className="w-[200px] flex items-center justify-end min-h-8 mr-4 text-sm text-right flex-shrink-0 leading-4">
                          Bank name <span className="text-gray-400 text-xs ml-1">(optional)</span>
                        </label>
                        <div className="flex-1 max-w-[384px]">
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Bank name"
                            className="w-full h-8 px-3 border border-gray-200 rounded text-sm text-gray-700 outline-0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer Buttons */}
              <div className="border-t border-gray-200 px-6 py-6 flex justify-between gap-2">
                <div>
                  {(stepId === STEP_IDS.step2 || stepId === STEP_IDS.step3 || stepId === STEP_IDS.step4) && (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={saving}
                      className="h-10 px-4 border border-gray-200 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {stepId !== STEP_IDS.step4 && (
                    <>
                      {stepId === STEP_IDS.step1 && (
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="h-10 px-4 mr-2 border border-gray-200 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={saving}
                        className="h-10 px-4 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Next"}
                      </button>
                    </>
                  )}
                  {stepId === STEP_IDS.step4 && (
                    <button
                      type="button"
                      onClick={handleSubmitApplication}
                      disabled={saving}
                      className="h-10 px-4 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                    >
                      {saving ? "Submitting..." : "Submit application"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Desktop Only (same as /portal/my-onboarding) */}
      <aside className="hidden md:block fixed top-14 right-0 z-[6665] w-12 bg-white border-l border-gray-200" style={{ height: "calc(100vh - 56px)" }}>
        <div className="flex flex-col items-center py-3 h-full">
          {/* Notification Icon */}
          <div className="relative mb-1">
            <button
              type="button"
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onMouseEnter={() => setShowNotificationTooltip(true)}
              onMouseLeave={() => setShowNotificationTooltip(false)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                <path d="M17.7639 5.68389C16.5418 3.54531 13.4582 3.54531 12.2361 5.68389C12.1244 5.87936 11.9166 5.99999 11.6914 5.99999H9.21429C8.14917 5.99999 7.28572 6.86344 7.28572 7.92856V18.0066C7.28572 18.6411 7.09788 19.2615 6.74588 19.7895L6.10797 20.7464C5.97646 20.9437 5.9642 21.1973 6.07607 21.4063C6.18794 21.6154 6.40578 21.7458 6.64286 21.7458H23.3571C23.5942 21.7458 23.8121 21.6154 23.9239 21.4063C24.0358 21.1973 24.0235 20.9437 23.892 20.7464L23.2541 19.7895C22.9021 19.2615 22.7143 18.6411 22.7143 18.0066V7.92856C22.7143 6.86344 21.8508 5.99999 20.7857 5.99999H18.3086C18.0834 5.99999 17.8756 5.87936 17.7639 5.68389Z" fill="#EE4D2D" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 23H18V23.375C18 23.6562 17.9493 23.9277 17.8552 24.1826C17.466 25.2368 16.3354 26 15 26C13.6646 26 12.534 25.2368 12.1448 24.1826C12.0507 23.9277 12 23.6562 12 23.375V23Z" fill="#EE4D2D" />
              </svg>
            </button>
            {showNotificationTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Notification
              </div>
            )}
          </div>

          {/* Support / Contact Shopee Icon */}
          <div className="relative mb-1">
            <button
              type="button"
              onMouseEnter={() => setShowSupportTooltip(true)}
              onMouseLeave={() => setShowSupportTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded relative"
              aria-label="Contact Shopee"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path fillRule="evenodd" clipRule="evenodd" d="M25.503 19.0641V14.6286C24.8376 9.97631 20.8366 6.4 16.0002 6.4C11.2647 6.4 7.32995 9.82885 6.54336 14.3393V19.1577C6.54336 19.6229 6.16623 20 5.70102 20C4.17801 20 2.94336 18.7654 2.94336 17.2423V15.7577C2.94336 14.3329 4.0238 13.1605 5.41002 13.0152C6.71087 8.3904 10.9596 5 16.0002 5C21.0366 5 25.2825 8.38471 26.5872 13.0035C28.2106 13.0808 29.503 14.4215 29.503 16.0641V16.9359C29.503 18.6282 28.1312 20 26.439 20C25.9221 20 25.503 19.581 25.503 19.0641ZM17.8731 26.1226C17.8731 25.4322 17.3135 24.8726 16.6231 24.8726H15.1231C14.4328 24.8726 13.8731 25.4322 13.8731 26.1226C13.8731 26.8129 14.4328 27.3726 15.1231 27.3726H16.6231C17.3135 27.3726 17.8731 26.8129 17.8731 26.1226Z" fill="#EE4D2D" />
                <path d="M8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16V18C24 21.3137 21.3137 24 18 24H14C10.6863 24 8 21.3137 8 18L8 16Z" fill="#EE4D2D" />
                <path d="M18.7897 13.4838V13.4838C17.9512 13.8196 17.2379 14.4079 16.7486 15.1671L16.607 15.3868C16.6042 15.3912 16.6071 15.397 16.6122 15.3973L16.6495 15.4001C17.5465 15.4664 18.4311 15.6491 19.2811 15.9435L19.4443 16" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
                <path d="M11.9131 14.4723C11.9131 13.8648 12.4056 13.3723 13.0131 13.3723C13.6206 13.3723 14.1131 13.8648 14.1131 14.4723V15.7723C14.1131 16.3798 13.6206 16.8723 13.0131 16.8723C12.4056 16.8723 11.9131 16.3798 11.9131 15.7723V14.4723Z" fill="white" />
                <path d="M26.2998 17.5V19C26.2998 22.866 23.1658 26 19.2998 26H15.2998" stroke="#EE4D2D" strokeWidth="0.8" />
              </svg>
            </button>
            {showSupportTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Contact Shopee
              </div>
            )}
          </div>

          {/* Chat Icon */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowChatTooltip(true)}
              onMouseLeave={() => setShowChatTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
              aria-label="Chat"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.2167 19.0562C16.0309 19.0562 19.9335 15.4619 19.9335 11.0281C19.9335 6.59431 16.0309 3 11.2167 3C6.40261 3 2.5 6.59431 2.5 11.0281C2.5 13.3008 3.52536 15.3529 5.17326 16.8135L4.64469 19.1019C4.47937 19.8176 5.18393 20.4191 5.84238 20.1243L8.87974 18.7644C9.62348 18.9546 10.4072 19.0562 11.2167 19.0562ZM7.07629 12.3661C7.67805 12.3661 8.16588 11.8669 8.16588 11.2511C8.16588 10.6353 7.67805 10.1361 7.07629 10.1361C6.47452 10.1361 5.98669 10.6353 5.98669 11.2511C5.98669 11.8669 6.47452 12.3661 7.07629 12.3661ZM10.9988 10.1361C11.6006 10.1361 12.0884 10.6353 12.0884 11.2511C12.0884 11.8669 11.6006 12.3661 10.9988 12.3661C10.8332 12.3661 10.6755 12.328 10.535 12.2603C10.1652 12.082 9.90922 11.6972 9.90922 11.2511C9.90922 10.6353 10.3971 10.1361 10.9988 10.1361ZM14.9213 10.1361C15.5231 10.1361 16.0109 10.6353 16.0109 11.2511C16.0109 11.8669 15.5231 12.3661 14.9213 12.3661C14.7558 12.3661 14.5982 12.328 14.4576 12.2604C14.0878 12.0821 13.8318 11.6972 13.8318 11.2511C13.8318 10.6353 14.3196 10.1361 14.9213 10.1361ZM21.0951 11.0278C21.0951 15.2797 18.0653 18.7353 14.0463 19.8587C14.6796 20.0505 15.3563 20.1542 16.0593 20.1542C16.6574 20.1542 17.2365 20.0791 17.7861 19.9386L20.0304 20.9434C20.5169 21.1612 21.0375 20.7168 20.9153 20.1879L20.5248 18.497C21.7424 17.4178 22.5 15.9016 22.5 14.2223C22.5 12.8155 21.9683 11.523 21.0798 10.5062C21.0899 10.6786 21.0951 10.8525 21.0951 11.0278Z" fill="#EE4D2D" />
              </svg>
            </button>
            {showChatTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Chat
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Notification Panel - Desktop Only (same as /portal/my-onboarding) */}
      {showNotificationPanel && (
        <div className="hidden md:block fixed top-14 right-12 z-[6664] w-80 bg-white border-l border-gray-200 shadow-lg" style={{ height: "calc(100vh - 56px)" }}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-600">Notification</h3>
              <button
                type="button"
                onClick={() => setShowNotificationPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 99 96" className="w-24 h-24 mb-4">
              <g fill="none" fillRule="evenodd" transform="translate(.5)">
                <rect width="98" height="96" />
                <g transform="translate(4 8.447)">
                  <g stroke="#D8D8D8" transform="translate(16)">
                    <path fill="#FFF" d="M28.363419,1.05327496 C29.4912997,1.05327496 30.4539995,1.43133378 31.138389,2.0579615 C31.8296868,2.69091432 32.2321345,3.57520326 32.2321345,4.55327496 L32.2321345,4.55327496 L24.863419,5.05327496 L24.863419,4.55327496 C24.863419,3.58677665 25.2551698,2.71177665 25.8885453,2.07840123 C26.5219207,1.4450258 27.3969207,1.05327496 28.363419,1.05327496 Z" />
                    <path fill="#FAFAFA" d="M37.6410741,55.2137964 C37.5144483,57.4418941 36.5589026,59.4481758 35.0779888,60.9290896 C33.485502,62.5215764 31.285502,63.5065499 28.8554491,63.5065499 L28.8554491,63.5065499 L28.1978734,63.5065499 C25.8139899,63.5065499 23.6514927,62.5586583 22.0667548,61.0191955 C20.5913184,59.5859114 19.6165927,57.6398779 19.4303943,55.4686146 L19.4303943,55.4686146 Z" />
                    <path fill="#FFF" d="M28.4892236,4.47854076 C33.6031795,4.47854076 38.2380108,6.58097726 41.618519,9.98769303 C45.0095815,13.405045 47.1388924,18.1344672 47.2269329,23.3654571 L47.2269329,23.3654571 L47.2298823,45.956401 L55.9539884,52.5070496 C56.3313056,52.7903649 56.5533225,53.2347069 56.5533225,53.7065499 C56.5533225,54.100431 56.4015331,54.4588737 56.1531958,54.7265035 C55.9067561,54.992088 55.5653408,55.1684832 55.1828231,55.2010662 L55.1828231,55.2010662 L2.00011041,55.2065499 C1.53050799,55.2065499 1.08800691,54.9866256 0.804445079,54.6123007 C0.567823964,54.2999414 0.472136838,53.9248225 0.506959909,53.5632549 C0.541489439,53.2047351 0.704093512,52.8594033 0.98502544,52.6020091 L0.98502544,52.6020091 L9.74859829,45.954859 L9.74852902,23.720792 C9.83780147,18.3279168 11.9528492,13.5249589 15.3257191,10.0656052 C18.7090961,6.59547491 23.357962,4.47854076 28.4892236,4.47854076 Z" />
                    <line x1="3" x2="54" y1="51.053" y2="51.053" />
                  </g>
                  <ellipse cx="45" cy="74.107" fill="#F2F2F2" rx="45" ry="5" />
                  <path fill="#D8D8D8" d="M79.0373555,10.04 C80.6942098,10.04 82.0373555,11.3831458 82.0373555,13.04 C82.0373555,14.6968542 80.6942098,16.04 79.0373555,16.04 C77.3805013,16.04 76.0373555,14.6968542 76.0373555,13.04 C76.0373555,11.3831458 77.3805013,10.04 79.0373555,10.04 Z M71.0373555,7.04 C72.141925,7.04 73.0373555,7.9354305 73.0373555,9.04 C73.0373555,10.1445695 72.141925,11.04 71.0373555,11.04 C69.932786,11.04 69.0373555,10.1445695 69.0373555,9.04 C69.0373555,7.9354305 69.932786,7.04 71.0373555,7.04 Z M77.5373555,0.04 C78.9180674,0.04 80.0373555,1.15928813 80.0373555,2.54 C80.0373555,3.92071187 78.9180674,5.04 77.5373555,5.04 C76.1566437,5.04 75.0373555,3.92071187 75.0373555,2.54 C75.0373555,1.15928813 76.1566437,0.04 77.5373555,0.04 Z M77.5373555,1.04 C76.7089284,1.04 76.0373555,1.71157288 76.0373555,2.54 C76.0373555,3.36842712 76.7089284,4.04 77.5373555,4.04 C78.3657827,4.04 79.0373555,3.36842712 79.0373555,2.54 C79.0373555,1.71157288 78.3657827,1.04 77.5373555,1.04 Z" opacity=".5" />
                  <path fill="#FFF" stroke="#D8D8D8" d="M37.6153846,13.5537653 L37.6153846,33.069148 L32.4596425,33.069148 L32.459,35.534 L30.0874537,33.069148 L11.5,33.069148 L11.5,13.6612564 L37.6153846,13.5537653 Z" />
                  <rect width="19.507" height="1" x="15.587" y="19.169" fill="#D8D8D8" rx=".5" transform="matrix(-1 0 0 1 50.68 0)" />
                  <path fill="#D8D8D8" d="M15.9937331,24.1955558 L26.8833971,24.1955558 C27.1082845,24.1955558 27.2905918,24.3778631 27.2905918,24.6027504 C27.2905918,24.8276378 27.1082845,25.0099451 26.8833971,25.0099451 L15.9937331,25.0099451 C15.7688457,25.0099451 15.5865385,24.8276378 15.5865385,24.6027504 C15.5865385,24.3778631 15.7688457,24.1955558 15.9937331,24.1955558 Z" transform="matrix(-1 0 0 1 42.877 0)" />
                </g>
              </g>
            </svg>
            <p className="text-gray-400 text-sm">You have not received any notification</p>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-medium mb-4">Select Pickup Address</h2>
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => {
                      setSelectedAddressId(Number(address.id));
                      setSelectedAddress(address);
                      setShowAddressModal(false);
                    }}
                    className={`p-4 border rounded cursor-pointer hover:border-orange-600 ${
                      selectedAddressId === Number(address.id) ? "border-orange-600 bg-orange-50" : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">{formatAddress(address)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
