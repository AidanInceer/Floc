import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Better Auth + the libSQL driver both want the Node runtime, not Edge.
  serverExternalPackages: ["@libsql/client", "better-auth"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default config;
