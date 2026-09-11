import type { NextConfig } from "next";

// Redeploy touchpoint — see chore commit.
const config: NextConfig = {
  reactStrictMode: true,
  // `pnpm verify` builds into `.next-verify` so it never writes over the
  // `.next` a running `next dev` owns — the dev servers can stay up.
  distDir: process.env.FLOC_NEXT_DIST_DIR ?? ".next",
  // The phone app reads this dev server over the LAN, so its requests arrive
  // from a different origin than localhost (ticket 289). The host is per
  // machine, so it comes from the environment rather than the repo.
  allowedDevOrigins: process.env.FLOC_LAN_HOST ? [process.env.FLOC_LAN_HOST] : [],
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
