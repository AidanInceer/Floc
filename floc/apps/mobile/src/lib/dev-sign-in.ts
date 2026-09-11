/**
 * Signing in on a dev build without typing anything (#no-ticket).
 *
 * The dev server holds the test accounts' credentials in its own `.env` and in
 * the seed, and hands them out on `GET /api/dev/sign-in`, but only when it is
 * not production and both variables are set — otherwise that route 404s. This
 * asks, and then signs in down the ordinary `signIn.email` path, so the token
 * lands in the keychain exactly as a typed sign-in would.
 *
 * MORE THAN ONE ACCOUNT, because half of Floc only exists between people: a
 * claim somebody else made, money somebody else paid, an invite you have not
 * answered. `pnpm db:seed` makes the cast; this lets you be any of them.
 *
 * `__DEV__` guards the caller too, so nothing about this is in a store build.
 */
import { signIn } from "./auth";
import { API_BASE_URL } from "./config";

export type DevAccount = { email: string; name: string; password: string };

/** The roster, or null when the server is not offering one. */
export async function devAccounts(): Promise<DevAccount[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dev/sign-in`);
    if (!response.ok) return null;
    const body = (await response.json()) as {
      email: string;
      password: string;
      accounts?: DevAccount[];
    };
    // `accounts` arrived after the top-level pair; fall back so a phone built
    // against the newer server still works against an older one.
    if (body.accounts?.length) return body.accounts;
    return [{ email: body.email, name: "Dev account", password: body.password }];
  } catch {
    // No server, no LAN, no dev account. All the same answer here.
    return null;
  }
}

/**
 * Null when it worked; otherwise what to say. Omit the account to take the
 * first one, which is always your own.
 *
 * SAYS WHAT ACTUALLY BROKE. This used to guess — every failure printed "the
 * dev account exists in .env but not in the database", which sent an hour
 * chasing a database that was fine. A guess that names the wrong cause is
 * worse than no message, so the server's own words are passed through.
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
