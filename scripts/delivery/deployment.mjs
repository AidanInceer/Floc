import { deployedStatus } from "./status.mjs";

export const DEPLOY_URL = process.env.FLOC_DEPLOY_URL ?? "https://floc.live";

async function answer(request, url) {
  try {
    const response = await request(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    return response.ok ? response : null;
  } catch { return null; }
}

/** Live means production itself reports the merge commit, not that GitHub saw a deployment start. */
export async function deploymentStatus(sha, { url = DEPLOY_URL, request = fetch, github = () => null } = {}) {
  const health = await answer(request, new URL("/api/health", url));
  const healthSha = health ? (await health.json()).sha : null;
  const homeOk = healthSha === sha ? Boolean(await answer(request, url)) : false;
  return deployedStatus({ healthSha, homeOk, github: github(sha) }, sha);
}
