/**
 * The two files phones fetch to trust that a link to this site may open the
 * app instead (#346). Null until the signing details are set, and the routes
 * answer 404 — no half-true association.
 */
const APP_ID = "com.floc.app";
const PATHS = ["/trip/*", "/friends", "/inbox"];

export function assetLinks(fingerprints: string | undefined) {
  const list = (fingerprints ?? "").split(",").map((f) => f.trim()).filter(Boolean);
  if (list.length === 0) return null;
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: APP_ID, sha256_cert_fingerprints: list },
    },
  ];
}

export function appleAssociation(teamId: string | undefined) {
  if (!teamId?.trim()) return null;
  return {
    applinks: {
      details: [{ appIDs: [`${teamId.trim()}.${APP_ID}`], components: PATHS.map((path) => ({ "/": path })) }],
    },
  };
}
