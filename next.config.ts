import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiPattern = (() => {
  if (!apiUrl) return null;

  try {
    const parsed = new URL(apiUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deo.shopeemobile.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cf.shopee.com.my",
        pathname: "/**",
      },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
};

export default nextConfig;
