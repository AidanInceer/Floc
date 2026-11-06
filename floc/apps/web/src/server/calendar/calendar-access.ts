/**
 * Whether a person has given Floc their calendar (#444): the Google account row's `scope`
 * holds the calendar scope. Better Auth owns the row and the tokens in it; this file only
 * reads the scope and, on Remove, narrows it back.
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/schema";
import { GOOGLE_CALENDAR_SCOPE } from "@floc/core/dates/calendar-import";

// Better Auth stores the scopes comma-joined.
const scopesOf = (scope: string | null) => (scope ?? "").split(/[\s,]+/).filter(Boolean);

/** The person's Google account row id when it carries the calendar scope, else null. */
export async function calendarAccountOf(userId: string): Promise<string | null> {
  const row = await db
    .select({ id: account.id, scope: account.scope })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .get();
  return row && scopesOf(row.scope).includes(GOOGLE_CALENDAR_SCOPE) ? row.id : null;
}

/**
 * Why the tokens go with the scope: Google has just revoked the grant, so they are dead, and a
 * row that says "no calendar" must not keep a credential that once could read one.
 */
export async function forgetCalendarScope(userId: string, accountId: string): Promise<void> {
  const row = await db
    .select({ scope: account.scope })
    .from(account)
    .where(and(eq(account.id, accountId), eq(account.userId, userId)))
    .get();
  if (!row) return;
  await db
    .update(account)
    .set({
      scope: scopesOf(row.scope).filter((s) => s !== GOOGLE_CALENDAR_SCOPE).join(","),
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    })
    .where(and(eq(account.id, accountId), eq(account.userId, userId)));
}
