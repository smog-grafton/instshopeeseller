const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
const SANCTUM_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface ApiUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  countryId: number | null;
  isSeller?: boolean;
  sellerStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
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
    try {
      const errorData = (await res.json()) as any;
      if (errorData && typeof errorData.message === "string") {
        message = errorData.message;
      }
    } catch {
      message = `Request failed with status ${res.status}`;
    }
    
    const error = new Error(message) as any;
    error.status = res.status;
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
  return apiFetch<any>("/seller/dashboard");
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore logout errors
  }
}
