/**
 * Who the dev sign-in door will let you in as (#no-ticket).
 *
 * WHY MORE THAN ONE. Half of what Floc does only exists between people —
 * somebody else claimed the suncream, somebody else paid for the chalet, an
 * invite you have not answered. From one seat none of it is visible, so the
 * door offers the whole seeded cast and you walk round the trip.
 *
 * THE PASSWORD IS SHARED AND HARDCODED, and that is fine exactly here: these
 * accounts only exist on a local file database, `db:seed` is the only thing
 * that makes them, and `devSignInEnabled` shuts the door outside development.
 * Nothing else may ever sign in this way — `passwordFor` returns null for any
 * address that is not the env account or a `.seed.floc.test` one, so a leaked
 * request naming a real user gets the same 404 as a shut door.
 */
import { like } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { SEED_DOMAIN, SEED_PASSWORD, isSeedEmail } from "@/db/seed/identity";

import { devSignInEnabled } from "./dev-sign-in";

export type DevAccount = { email: string; name: string };

/** The env account first — it is the one you are usually testing as. */
export async function listDevAccounts(): Promise<DevAccount[]> {
  if (!devSignInEnabled()) return [];

  const rows = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(like(user.email, `%.${SEED_DOMAIN}`))
    .all();

  return [
    { email: process.env.FLOC_DEV_USER_EMAIL!, name: "You (dev account)" },
    ...rows.sort((a, b) => a.email.localeCompare(b.email)),
  ];
}

/** Null for anybody the door does not know — the caller turns that into a 404. */
export function passwordFor(email: string | null): string | null {
  if (!devSignInEnabled()) return null;
  if (!email || email === process.env.FLOC_DEV_USER_EMAIL) {
    return process.env.FLOC_DEV_USER_PASSWORD!;
  }
  return isSeedEmail(email) ? SEED_PASSWORD : null;
}
