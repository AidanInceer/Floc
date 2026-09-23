/**
 * Why: the same Better Auth instance and user table as the web — a second door into one identity.
 * Only the session store differs: a phone has no cookie jar, so the Expo plugin keeps the token
 * and replays it as a bearer header. It goes in the keychain (`expo-secure-store`), never
 * `AsyncStorage`, which leaves a live credential readable on a rooted device and in a backup.
 * Signing out revokes this device only; the web session is a different row (#289).
 */
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: "floc",
      storagePrefix: "floc",
      storage: SecureStore,
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;

// Why: `floc://` is a trusted origin on the server, so the redirect carrying the token lands in
// the app — otherwise a phone resets in a browser and has to type the password again.
export const RESET_REDIRECT = "floc://reset-password";

// Same reason as RESET_REDIRECT.
export const VERIFY_REDIRECT = "floc://verified";

// Why: read fresh per request, not captured — a rolling session rotates the token, and a
// captured one works right up until it silently does not. Async because the keychain is a real read.
export async function authHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}
