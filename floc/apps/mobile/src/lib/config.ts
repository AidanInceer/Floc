/**
 * Where the API is (ticket 289).
 *
 * A phone is never on the same host as the dev server, so `localhost` is the
 * one value that is always wrong on a device — it means the phone itself. In
 * development the URL therefore comes from `EXPO_PUBLIC_API_URL`, which the
 * developer sets to their machine's LAN address; a build without it falls back
 * to production rather than to something that cannot work.
 *
 * `EXPO_PUBLIC_` is the only prefix Expo inlines into the bundle, so anything
 * here is public by construction. Nothing secret may be added to this file —
 * the API is the thing holding the secrets, and it stays that way.
 */
import Constants from "expo-constants";

const PRODUCTION = "https://floc.app";

/**
 * `hostUri` is the machine the Metro bundler is running on — the developer's
 * laptop, reachable from the phone on the same network. Using it means a
 * simulator and a real handset both work with no configuration at all.
 */
function devHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return `http://${hostUri.split(":")[0]}:3000`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? (devHost() ?? PRODUCTION) : PRODUCTION);

export const TRPC_URL = `${API_BASE_URL}/api/trpc`;
