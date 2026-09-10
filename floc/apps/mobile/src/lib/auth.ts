/**
 * Signing in on a phone (ticket 289).
 *
 * The SAME Better Auth instance and the SAME user table the web app uses —
 * this is a second door into one identity, not a second identity. What differs
 * is only where the session lives: a browser has a cookie jar, a phone does
 * not, so the Expo plugin stores the session token and replays it as a bearer
 * header on every request.
 *
 * THE TOKEN GOES IN THE KEYCHAIN, never plain storage. `expo-secure-store` is
 * Keychain on iOS and Keystore-backed EncryptedSharedPreferences on Android;
 * `AsyncStorage` would leave a live session credential readable on a rooted or
 * jailbroken device, and readable in a device backup.
 *
 * Signing out here revokes only this device's session. The web session is a
 * different row and is left alone.
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

/**
 * Where a reset link comes back to (#no-ticket).
 *
 * Better Auth answers the link in the mail with a redirect to this address
 * carrying the token, and `floc://` is a trusted origin on the server, so the
 * hop lands in the app rather than on the website. A phone that reset its
 * password in a browser would then have to come back and type it again.
 */
export const RESET_REDIRECT = "floc://reset-password";

/** Where a verification link comes back to. Same reason as above. */
export const VERIFY_REDIRECT = "floc://verified";

/**
 * The header the API expects, or nothing when signed out.
 *
 * Read fresh on every request rather than captured once: the token is rotated
 * on a rolling session, and a captured one would keep working right up until
 * it silently did not. Async because the store it comes from is the keychain,
 * which is a real read off the device rather than a value in memory.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}
