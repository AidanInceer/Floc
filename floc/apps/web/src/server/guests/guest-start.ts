/**
 * Starting a guest (#442, ADR-029): the one way in, since the plugin's own
 * endpoint is disabled. The guest is made first and counted after, from the
 * address Better Auth stamped on the session; one over the limit is deleted
 * again before it can answer anything.
 */
import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { session, user } from "@/db/schema";
import { Refusal } from "@floc/core/errors/refusal";
import { auth } from "@/server/auth/auth";
import { guestsFromIpOverLimit } from "@/server/guests/guest-ip";

type AnonymousApi = { signInAnonymous: (args: { headers: Headers }) => Promise<{ token: string; user: { id: string } } | null> };

export async function startGuest(name: string): Promise<{ id: string; name: string }> {
  const made = await (auth.api as unknown as AnonymousApi).signInAnonymous({ headers: await headers() });
  if (!made) throw new Refusal("That did not work. Try again.");

  const stamped = await db.select({ ip: session.ipAddress }).from(session).where(eq(session.token, made.token)).get();
  if (stamped?.ip && (await guestsFromIpOverLimit(stamped.ip))) {
    await db.delete(user).where(and(eq(user.id, made.user.id), eq(user.isAnonymous, true)));
    throw new Refusal("Too many new guests from here. Try again in an hour, or make a free account.");
  }

  await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, made.user.id));
  return { id: made.user.id, name };
}
