import { type ApiUser } from "@/lib/api-client";
import { getBuyerBaseUrl } from "@/lib/utils";

export type SellerPortalAccessState = "buyer" | "onboarding" | "pending" | "approved" | "suspended";

export type SellerPortalRedirect =
  | { type: "external"; href: string }
  | { type: "internal"; href: string };

function buildBuyerAccountUrl(): string {
  const buyerBaseUrl = getBuyerBaseUrl();

  if (!buyerBaseUrl) {
    return "/user/account/profile";
  }

  return new URL("/user/account/profile", `${buyerBaseUrl}/`).toString();
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/portal/my-onboarding" || pathname.startsWith("/portal/my-onboarding/");
}

export function hasMerchantApplicationEntry(search = ""): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  return params.get("entry") === "merchant-application";
}

export function rememberMerchantApplicationEntry(search = ""): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (hasMerchantApplicationEntry(search)) {
    window.sessionStorage.setItem("merchant_application_entry", "1");
    return true;
  }

  return window.sessionStorage.getItem("merchant_application_entry") === "1";
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/portal/my-account" || pathname === "/portal/dashboard";
}

export function resolveSellerPortalAccessState(user?: ApiUser | null): SellerPortalAccessState {
  if (!user) {
    return "buyer";
  }

  if (typeof user.prefersSellerPortal === "boolean") {
    if (!user.prefersSellerPortal) {
      return "buyer";
    }
  } else if (typeof user.canAccessBuyerPortal === "boolean" && user.canAccessBuyerPortal) {
    return "buyer";
  }

  if (user.sellerStatus === "approved") {
    return "approved";
  }

  if (user.sellerStatus === "pending") {
    return "pending";
  }

  if (user.sellerStatus === "suspended") {
    return "suspended";
  }

  return "onboarding";
}

export function resolveSellerPortalEntry(user?: ApiUser | null): SellerPortalRedirect {
  const state = resolveSellerPortalAccessState(user);

  if (state === "buyer") {
    return { type: "external", href: buildBuyerAccountUrl() };
  }

  if (state === "approved" || state === "pending" || state === "suspended") {
    return { type: "internal", href: "/portal/my-account" };
  }

  return { type: "internal", href: "/portal/my-onboarding" };
}

export function resolveSellerPortalRoute(user: ApiUser, pathname: string, allowMerchantApplication = false): SellerPortalRedirect | null {
  const state = resolveSellerPortalAccessState(user);

  if (state === "buyer") {
    if (allowMerchantApplication && isOnboardingPath(pathname)) {
      return null;
    }

    return { type: "external", href: buildBuyerAccountUrl() };
  }

  if (state === "approved") {
    return isOnboardingPath(pathname) || pathname === "/portal/dashboard" ? { type: "internal", href: "/portal/my-account" } : null;
  }

  if (state === "pending" || state === "suspended") {
    return isDashboardPath(pathname) ? null : { type: "internal", href: "/portal/my-account" };
  }

  return isOnboardingPath(pathname) ? null : { type: "internal", href: "/portal/my-onboarding" };
}
