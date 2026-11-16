import Constants from "expo-constants";

const PRODUCTION = "https://floc.live";

function devHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return `http://${hostUri.split(":")[0]}:3000`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? (devHost() ?? PRODUCTION) : PRODUCTION);

export const TRPC_URL = `${API_BASE_URL}/api/trpc`;

export function inviteUrl(token: string): string {
  return `${API_BASE_URL}/invite/${token}`;
}
