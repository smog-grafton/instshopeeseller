function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? "");
}

export function resolveBackendAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  if (path.startsWith("/")) {
    return `${apiBaseUrl}${path}`;
  }

  return `${apiBaseUrl}/storage/${path}`;
}

export function getBuyerBaseUrl(): string {
  const configured = trimTrailingSlash(process.env.NEXT_PUBLIC_BUYER_URL ?? "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const host = window.location.host.replace(/^sellers?\./i, "");
    return `${window.location.protocol}//${host}`;
  }

  return "";
}

export function getBuyerLoginUrl(nextUrl?: string): string {
  const buyerBaseUrl = getBuyerBaseUrl();
  if (!buyerBaseUrl) return "/login";

  const loginUrl = new URL("/login", `${buyerBaseUrl}/`);
  if (nextUrl) {
    loginUrl.searchParams.set("next", nextUrl);
  }
  return loginUrl.toString();
}

/**
 * Check if an image URL is from the backend API (needs unoptimized flag for Next.js Image).
 */
export function isBackendImage(imageSrc: string | null | undefined): boolean {
  if (!imageSrc) return false;

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return false;

  try {
    return new URL(imageSrc).origin === new URL(apiBaseUrl).origin;
  } catch {
    return imageSrc.startsWith(apiBaseUrl);
  }
}
