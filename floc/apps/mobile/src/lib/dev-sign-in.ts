/**
 * Signing in on a dev build without typing anything (#no-ticket).
 *
 * The dev server holds the test account's credentials in its own `.env` and
 * hands them out on `GET /api/dev/sign-in`, but only when it is not production
 * and both variables are set — otherwise that route 404s. This asks, and then
 * signs in down the ordinary `signIn.email` path, so the token lands in the
 * keychain exactly as a typed sign-in would.
 *
 * `__DEV__` guards the caller too, so nothing about this is in a store build.
 */
import { signIn } from "./auth";
import { API_BASE_URL } from "./config";

/** The account, or null when the server is not offering one. */
async function credentials(): Promise<{ email: string; password: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dev/sign-in`);
    if (!response.ok) return null;
    return (await response.json()) as { email: string; password: string };
  } catch {
    // No server, no LAN, no dev account. All the same answer here.
    return null;
  }
}

/** Null when it worked; otherwise what to say. */
export async function devSignIn(): Promise<string | null> {
  const account = await credentials();
  if (!account) return "No dev account. Set FLOC_DEV_USER_EMAIL and FLOC_DEV_USER_PASSWORD in the web .env.";
  const { error } = await signIn.email(account);
  return error ? "The dev account exists in .env but not in the database." : null;
}
