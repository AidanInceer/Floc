import type { NextConfig } from "next";

import { contentSecurityPolicy } from "./src/lib/http/csp";

const CSP = contentSecurityPolicy({ nonce: null, host: null, dev: process.env.NODE_ENV !== "production" });

const config: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.FLOC_NEXT_DIST_DIR ?? ".next",
  eslint: { ignoreDuringBuilds: process.env.FLOC_VERIFY_BUILD === "1" },
  typescript: { ignoreBuildErrors: process.env.FLOC_VERIFY_BUILD === "1" },
  allowedDevOrigins: process.env.FLOC_LAN_HOST ? [process.env.FLOC_LAN_HOST] : [],
  transpilePackages: ["@floc/core", "@floc/editor", "@floc/globe"],
  serverExternalPackages: ["@libsql/client", "better-auth", "yjs", "zxing-wasm", "unpdf"],
  experimental: {
    staleTimes: { dynamic: 30, static: 30 },
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default config;
