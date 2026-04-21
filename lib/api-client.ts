// Support both https://api.example.com and https://api.example.com/api so we never get /api/api/v1
const getApiRoot = () => (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");
const API_BASE = `${getApiRoot()}/api/v1`;
const SANCTUM_BASE = process.env.NEXT_PUBLIC_API_URL ?? getApiRoot();

/** Base URL for /api/v1 (avoids double /api when NEXT_PUBLIC_API_URL ends with /api). Use for EventSource etc. */
export function getApiBaseUrl(): string {
  return API_BASE;
}

export interface ApiUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  countryId: number | null;
  buyerPortalEnabled?: boolean;
  canAccessBuyerPortal?: boolean;
  isSeller?: boolean;
  sellerStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
  prefersSellerPortal?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include", // CRITICAL: Send session cookies
  });

  if (!res.ok) {
    let message = "Request failed";
    let errorData: any = null;
    try {
      errorData = (await res.json()) as any;
      if (errorData && typeof errorData.message === "string") {
        message = errorData.message;
      } else if (errorData?.errors && typeof errorData.errors === "object") {
        const firstError = Object.values(errorData.errors).flat()[0];
        if (typeof firstError === "string") {
          message = firstError;
        }
      }
    } catch {
      message = `Request failed with status ${res.status}`;
    }
    
    const error = new Error(message) as any;
    error.status = res.status;
    if (errorData?.errors) {
      error.errors = errorData.errors;
    }
    throw error;
  }

  return res.json();
}

export async function getCurrentUser() {
  return apiFetch<{ user: ApiUser }>("/auth/me");
}

export interface SellerApplication {
  id: number;
  userId: number;
  shopName: string;
  shopDescription?: string;
  businessType: "individual" | "company";
  identityDocumentUrl?: string;
  businessRegistrationUrl?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export async function getSellerApplication() {
  return apiFetch<{ application: SellerApplication | null }>("/seller/application");
}

export interface SubmitSellerApplicationPayload {
  shop_name: string;
  shop_description?: string;
  business_type: "individual" | "company";
  identity_document_url?: string;
  business_registration_url?: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
}

export async function submitSellerApplication(data: SubmitSellerApplicationPayload) {
  return apiFetch<{ application: SellerApplication }>("/seller/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSellerDashboard() {
  return apiFetch<{
    success: boolean;
    seller: {
      is_seller: boolean;
      seller_status: string | null;
      seller_approved_date?: string | null;
    };
    vendor: {
      id: number;
      name?: string | null;
      slug?: string | null;
    } | null;
    wallet: {
      balance: string;
      available_balance: string;
      pending_balance: string;
      currency: string;
    };
    stats: {
      total_products: number;
      total_orders: number;
      pending_orders: number;
    };
  }>("/seller/dashboard");
}

export async function getWallet() {
  return apiFetch<{ wallet: { balance: string; currency: string; available_balance: string } }>("/wallet?scope=seller");
}

export async function getWalletTransactions() {
  return apiFetch<{ success: boolean; transactions: any }>(`/wallet/transactions?scope=seller`);
}

export async function getDepositPaymentMethods() {
  return apiFetch<{ success: boolean; methods: any[] }>(`/wallet/deposit-methods?scope=seller`);
}

export async function requestWalletTopup(data: {
  amount: number;
  payment_method_id: number;
  reference?: string;
  notes?: string;
  proof?: File | null;
}) {
  const form = new FormData();
  form.append("amount", String(data.amount));
  form.append("payment_method_id", String(data.payment_method_id));
  if (data.reference) form.append("reference", data.reference);
  if (data.notes) form.append("notes", data.notes);
  if (data.proof) form.append("proof", data.proof);
  form.append("scope", "seller");
  return createMultipartRequest(`/wallet/topup/request`, form);
}

export async function requestWalletWithdrawal(data: {
  amount: number;
  bank_account_id?: number;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_name?: string;
  notes?: string;
}) {
  return apiFetch<{ success: boolean; message: string; request: any }>(`/wallet/withdraw/request`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      scope: "seller",
    }),
  });
}

export async function getSellerAnalyticsOverview() {
  return apiFetch<{
    success: boolean;
    overview: {
      total_orders: number;
      total_items: number;
      total_revenue: number;
      gross_sales: number;
      expected_profit: number;
      realized_profit: number;
      pending_profit: number;
      shipping_absorbed: number;
      funding_needed: number;
      reserved_capital: number;
      order_buckets: {
        awaiting_payment: number;
        to_ship: number;
        in_transit: number;
        delivered: number;
        cancelled: number;
      };
    };
    daily: {
      date: string;
      orders: number;
      items: number;
      revenue: number;
      shipping_absorbed: number;
      expected_profit: number;
      realized_profit: number;
    }[];
    top_products: {
      id: number;
      title: string;
      units: number;
      revenue: number;
    }[];
  }>(
    "/seller/analytics/overview",
  );
}

export async function getSellerDashboardMetrics() {
  return apiFetch<{ success: boolean; metrics: any }>(`/seller/dashboard/metrics`);
}

export async function getSellerOrders(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ success: boolean; orders: any }>(`/seller/orders${suffix}`);
}

export async function updateSellerOrderStatus(id: number, data: { status: string; shipping_provider?: string; tracking_number?: string }) {
  return apiFetch<{ success: boolean; message: string; order: any }>(`/seller/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function bulkShipOrders(order_ids: number[], shipping_provider?: string, tracking_numbers?: Record<string, string>) {
  return apiFetch<{ success: boolean; message: string; count: number }>(`/seller/orders/bulk-ship`, {
    method: "POST",
    body: JSON.stringify({ order_ids, shipping_provider, tracking_numbers }),
  });
}

export async function getSellerCampaigns(type?: string) {
  const suffix = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetch<{ success: boolean; campaigns: any[] }>(`/seller/campaigns${suffix}`);
}

export async function createSellerCampaign(data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; campaign: any }>(`/seller/campaigns`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerCampaign(id: number, data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; campaign: any }>(`/seller/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getSellerShockingSale() {
  return apiFetch<{ success: boolean; items: any[]; requests: any[] }>(`/seller/shocking-sale`);
}

export async function requestShockingSaleSlot(product_id: number, requested_price: number) {
  return apiFetch<{ success: boolean; message: string; campaign: any }>(`/seller/shocking-sale/request`, {
    method: "POST",
    body: JSON.stringify({ product_id, requested_price }),
  });
}

export type ShopVoucherPayload = {
  title: string;
  description: string;
  tag?: string;
  valid_till?: string;
  claim_label?: string;
  badge_count?: number;
  used_percent?: number;
  claim_count?: number;
  active?: boolean;
  product_ids?: number[];
};

export async function getSellerVouchers() {
  return apiFetch<{ success: boolean; vouchers: any[] }>("/seller/vouchers");
}

export async function createSellerVoucher(data: ShopVoucherPayload) {
  return apiFetch<{ success: boolean; message: string; voucher: any }>("/seller/vouchers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerVoucher(id: number, data: ShopVoucherPayload) {
  return apiFetch<{ success: boolean; message: string; voucher: any }>(`/seller/vouchers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function assignVoucherProducts(id: number, product_ids: number[]) {
  return apiFetch<{ success: boolean; message: string; voucher: any }>(`/seller/vouchers/${id}/assign-products`, {
    method: "POST",
    body: JSON.stringify({ product_ids }),
  });
}

export async function getSellerBankAccounts() {
  return apiFetch<{ success: boolean; accounts: any[] }>(`/seller/bank-accounts`);
}

export async function createSellerBankAccount(data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; account: any }>(`/seller/bank-accounts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerBankAccount(id: number, data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; account: any }>(`/seller/bank-accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSellerBankAccount(id: number) {
  return apiFetch<{ success: boolean; message: string }>(`/seller/bank-accounts/${id}`, {
    method: "DELETE",
  });
}

export async function getSellerShop() {
  return apiFetch<{ success: boolean; shop: any }>(`/seller/shop`);
}

export async function updateSellerShop(data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; shop: any }>(`/seller/shop`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** Multipart uploads (logo / cover / collection image). */
function sellerMultipart<T>(path: string, form: FormData): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
    },
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error((data as { message?: string }).message || "Request failed") as Error & {
        status?: number;
        errors?: Record<string, string[]>;
      };
      err.status = res.status;
      err.errors = (data as { errors?: Record<string, string[]> }).errors;
      throw err;
    }
    return data as T;
  });
}

export async function uploadSellerShopLogo(file: File) {
  const form = new FormData();
  form.append("logo", file);
  return sellerMultipart<{ success: boolean; message?: string; shop: any }>(`/seller/shop/logo`, form);
}

export async function uploadSellerShopCover(file: File) {
  const form = new FormData();
  form.append("cover", file);
  return sellerMultipart<{ success: boolean; message?: string; shop: any }>(`/seller/shop/cover`, form);
}

export async function uploadSellerCollectionImage(collectionId: number, file: File) {
  const form = new FormData();
  form.append("image", file);
  return sellerMultipart<{ success: boolean; message?: string; collection: any }>(
    `/seller/collections/${collectionId}/image`,
    form
  );
}

export async function getSellerCollections() {
  return apiFetch<{ success: boolean; collections: any[] }>(`/seller/collections`);
}

export async function createSellerCollection(data: Record<string, any> | FormData) {
  if (data instanceof FormData) {
    return sellerMultipart<{ success: boolean; message: string; collection: any }>(`/seller/collections`, data);
  }
  return apiFetch<{ success: boolean; message: string; collection: any }>(`/seller/collections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerCollection(id: number, data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; collection: any }>(`/seller/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function assignCollectionProducts(id: number, product_ids: number[]) {
  return apiFetch<{ success: boolean; message: string; collection: any }>(`/seller/collections/${id}/assign-products`, {
    method: "POST",
    body: JSON.stringify({ product_ids }),
  });
}

export async function getSellerReviews(params?: { rating?: number }) {
  const suffix = params?.rating ? `?rating=${params.rating}` : "";
  return apiFetch<{ success: boolean; reviews: any }>(`/seller/reviews${suffix}`);
}

export async function getSellerSettings() {
  return apiFetch<{ success: boolean; settings: Record<string, any> }>(`/seller/settings`);
}

export async function updateSellerSetting(key: string, value: any) {
  return apiFetch<{ success: boolean; message: string; setting: any }>(`/seller/settings`, {
    method: "POST",
    body: JSON.stringify({ key, value }),
  });
}

export async function getSellerChatThreads() {
  return apiFetch<{ success: boolean; threads: any[] }>(`/seller/chat/threads`);
}

export async function getSellerChatMessages(threadId: string, afterId?: number) {
  const query = afterId ? `?after_id=${afterId}` : "";
  return apiFetch<{ success: boolean; messages: { id: string; text: string; sender_type: string; sender_label?: string; timestamp: string }[] }>(
    `/seller/chat/threads/${threadId}/messages${query}`
  );
}

export async function sendSellerChatMessage(threadId: string, message: string) {
  return apiFetch<{ success: boolean; message: { id: string; text: string; sender_type: string; sender_label?: string; timestamp: string } }>(
    `/seller/chat/threads/${threadId}/send`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}

export async function sendSellerChatTyping(threadId: string, typing: boolean) {
  return apiFetch<{ success: boolean }>(`/seller/chat/threads/${threadId}/typing`, {
    method: "POST",
    body: JSON.stringify({ typing }),
  });
}

export async function getNotifications(type?: string) {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (type === "wallet") query.set("scope", "seller");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ success: boolean; notifications: any }>(`/notifications${suffix}`);
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore logout errors
  }
}

export interface Address {
  id: string;
  region: string;
  fullName: string;
  phoneNumber: string;
  stateArea: string;
  postalCode: string;
  unitNo: string;
  streetAddress: string;
  labelAs: string;
  setAsDefault: boolean;
}

export async function getUserAddresses() {
  return apiFetch<{ addresses: Address[] }>("/addresses");
}

export interface CountryOption {
  id: number;
  code: string;
  name: string;
  callingCode: string | null;
}

export async function getCountries() {
  return apiFetch<{ countries: CountryOption[] }>("/countries");
}

export async function getCategories() {
  return apiFetch<{ categories: any[] }>("/categories");
}

export interface SaveOnboardingStep1Payload {
  shop_name: string;
  pickup_address_id?: number;
  phone?: string;
  invitation_code?: string;
}

export async function saveOnboardingStep1(data: SaveOnboardingStep1Payload) {
  return apiFetch<{ success: boolean; message: string; application: any }>("/seller/onboarding/step1", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type ShippingPreference = "platform" | "own";

export type PreferredCourier = "standard" | "express" | "jnt" | "poslaju" | "dhl" | "cod" | "other";

export interface SaveOnboardingStep2Payload {
  shipping_preference: ShippingPreference;
  preferred_couriers?: PreferredCourier[];
  pickup_address_id?: number;
  cod_enabled?: boolean;
  days_to_ship?: number;
  shipping_terms_accepted: boolean;
}

export async function saveOnboardingStep2(data: SaveOnboardingStep2Payload) {
  return apiFetch<{ success: boolean; message: string; application: any }>("/seller/onboarding/step2", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

const API_BASE_NO_JSON = API_BASE;

/** Step 3: multipart/form-data with optional file uploads */
export async function saveOnboardingStep3(formData: FormData) {
  const res = await fetch(`${API_BASE_NO_JSON}/seller/onboarding/step3`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message || "Request failed") as Error & { status?: number };
    err.status = res.status;
    if ((data as { errors?: Record<string, string[]> }).errors) {
      (err as any).errors = (data as { errors: Record<string, string[]> }).errors;
    }
    throw err;
  }
  return data as { success: boolean; message: string; application: any };
}

export interface SubmitOnboardingPayload {
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
}

export async function submitOnboarding(data: SubmitOnboardingPayload) {
  return apiFetch<{ success: boolean; message: string; application: any }>("/seller/onboarding/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendPhoneVerificationCode(phone: string) {
  return apiFetch<{ success: boolean; message: string; verification_code?: string }>("/seller/onboarding/send-verification-code", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

// Seller products
export interface SellerProduct {
  id: number;
  title: string;
  price: string;
  original_price: string | null;
  stock: number;
  is_active: boolean;
  status?: "draft" | "pending" | "live" | "rejected" | "hidden";
  low_stock?: boolean;
  low_stock_threshold?: number | null;
  max_per_order?: number | null;
  restock_lead_days?: number | null;
  auto_hide_when_out_of_stock?: boolean;
  allow_backorder?: boolean;
  appeal_status?: "pending" | "approved" | "rejected" | null;
  appeal_message?: string | null;
  thumbnail_url: string | null;
  created_at: string;
  catalog_link?: string | null;
}

export interface SellerProductSettings {
  can_edit_products: boolean;
  edit_lock_reason?: string | null;
}

export async function getSellerProducts(params?: { search?: string; status?: "active" | "inactive" | "draft" | "pending" | "live" | "rejected" | "hidden"; per_page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const q = query.toString();
  return apiFetch<{ success: boolean; products: { data: SellerProduct[] } }>(`/seller/products${q ? `?${q}` : ""}`);
}

export async function getSellerProduct(id: number) {
  return apiFetch<{ success: boolean; product: any }>(`/seller/products/${id}`);
}

export async function getSellerProductSettings() {
  return apiFetch<{ success: boolean; settings: SellerProductSettings }>("/seller/products/settings");
}

export async function updateSellerProduct(id: number, data: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function addCatalogProductToShop(catalogId: number) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/catalog-products/${catalogId}/add-to-shop`, {
    method: "POST",
  });
}

export async function createSellerProduct(formData: FormData) {
  const res = await fetch(`${API_BASE_NO_JSON}/seller/products`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message || "Request failed") as Error & { status?: number; errors?: Record<string, string[]> };
    err.status = res.status;
    err.errors = (data as { errors?: Record<string, string[]> }).errors;
    throw err;
  }
  return data as { success: boolean; message: string; product: any };
}

export async function getCatalogProducts(params?: {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
  /** `standard` (default catalog) or `wholesale_centre` */
  listing_type?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (typeof params?.min_price === "number") query.set("min_price", String(params.min_price));
  if (typeof params?.max_price === "number") query.set("max_price", String(params.max_price));
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.listing_type) query.set("listing_type", params.listing_type);
  const q = query.toString();
  return apiFetch<{
    success: boolean;
    products: {
      data: any[];
      total?: number;
      current_page?: number;
      last_page?: number;
      per_page?: number;
    };
    filters?: {
      categories?: string[];
    };
  }>(`/catalog-products${q ? `?${q}` : ""}`);
}

export async function getCatalogProduct(id: number) {
  return apiFetch<{ success: boolean; product: any }>(`/catalog-products/${id}`);
}

export async function uploadProductImages(productId: number, files: File[], thumbnailIndex = -1) {
  const form = new FormData();
  files.forEach((f) => form.append("images[]", f));
  if (thumbnailIndex >= 0) form.append("thumbnail_index", String(thumbnailIndex));
  return createMultipartRequest<{ success: boolean; message: string; product: any }>(
    `/seller/products/${productId}/images`,
    form
  );
}

export async function reorderProductImages(productId: number, order: number[]) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/images/reorder`, {
    method: "POST",
    body: JSON.stringify({ order }),
  });
}

export async function deleteProductImage(productId: number, imageId: number) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function setProductThumbnail(productId: number, imageId: number) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/images/${imageId}/set-thumbnail`, {
    method: "POST",
  });
}

export async function uploadVariantImage(productId: number, variantId: number, file: File) {
  const form = new FormData();
  form.append("image", file);
  return createMultipartRequest<{ success: boolean; message: string; variant: any }>(
    `/seller/products/${productId}/variants/${variantId}/image`,
    form
  );
}

export async function updateVariant(productId: number, variantId: number, data: { sku?: string; price?: number | null; original_price?: number | null; stock?: number | null }) {
  return apiFetch<{ success: boolean; message: string; variant: any }>(`/seller/products/${productId}/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitProductForReview(productId: number) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/submit-review`, {
    method: "POST",
  });
}

export async function submitProductAppeal(productId: number, message: string) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/appeal`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function syncProductFromCatalog(productId: number, replaceImages = false) {
  return apiFetch<{ success: boolean; message: string; product: any }>(`/seller/products/${productId}/sync-catalog`, {
    method: "POST",
    body: JSON.stringify({ replace_images: replaceImages }),
  });
}

function createMultipartRequest<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${API_BASE_NO_JSON}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error((data as { message?: string }).message || "Request failed") as Error & { status?: number; errors?: Record<string, string[]> };
      err.status = res.status;
      err.errors = (data as { errors?: Record<string, string[]> }).errors;
      throw err;
    }
    return data as T;
  });
}
