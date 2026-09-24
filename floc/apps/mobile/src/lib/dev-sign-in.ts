/**
 * Why: signing in on a dev build without typing anything. Asks `GET /api/dev/sign-in` for the
 * seeded credentials, then signs in down the ordinary `signIn.email` path, so the token lands in
 * the keychain as a typed sign-in would. The whole cast, not one account — half of Floc only
 * exists between people. `__DEV__` guards the caller too, so none of this is in a store build.
 */
import { signIn } from "./auth";
import { API_BASE_URL } from "./config";

export type DevAccount = { email: string; name: string; password: string };

// The roster, or null when the server is not offering one.
export async function devAccounts(): Promise<DevAccount[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dev/sign-in`);
    if (!response.ok) return null;
    const body = (await response.json()) as {
      email: string;
      password: string;
      accounts?: DevAccount[];
    };
    // Why: `accounts` arrived after the top-level pair — fall back for an older server.
    if (body.accounts?.length) return body.accounts;
    return [{ email: body.email, name: "Dev account", password: body.password }];
  } catch {
    // No server, no LAN, no dev account — all the same answer here.
    return null;
  }
}

/**
 * Null when it worked; otherwise what to say. Omit the account for the first, which is your own.
 *
 * Why: the server's own words, passed through. This used to print one guess for every failure and
 * sent an hour chasing a database that was fine.
 */
export async function devSignIn(account?: DevAccount): Promise<string | null> {
  const chosen = account ?? (await devAccounts())?.[0];
  if (!chosen) {
    return "No dev account. Set FLOC_DEV_USER_EMAIL and FLOC_DEV_USER_PASSWORD in the web .env.";
  }

  const { error } = await signIn.email({
    email: chosen.email,
    password: chosen.password,
  });
  if (!error) return null;
  return `Sign-in failed at ${API_BASE_URL}: ${error.message ?? error.statusText ?? error.status}`;
}
