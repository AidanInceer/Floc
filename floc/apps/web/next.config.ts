import type { NextConfig } from "next";

// Redeploy touchpoint — see chore commit.
const config: NextConfig = {
  reactStrictMode: true,
  // @floc/core ships TypeScript source, not a build (#286) — a workspace
  // package with no build step is one less thing to be stale in dev.
  transpilePackages: ["@floc/core"],
  // Better Auth + the libSQL driver both want the Node runtime, not Edge.
  serverExternalPackages: ["@libsql/client", "better-auth"],
  experimental: {
    // Next caps Server Action bodies at 1 MB, so a 2 MB upload threw before
    // `rejectUpload` saw it (ticket 239). Headroom over the 10 MB cap keeps
    // the refusal ours.
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default config;
