import type { NextConfig } from "next";

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
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "api.instshopee.test",
        port: "8000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
