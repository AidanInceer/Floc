import { eq, like } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { SEED_DOMAIN, SEED_PASSWORD, isSeedEmail } from "@/db/seed/identity";

import { devSignInEnabled } from "./dev-sign-in";

export type DevAccount = { email: string; name: string };

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

export async function devAccountEmail(userId: string): Promise<string | null> {
  if (!devSignInEnabled()) return null;
  const row = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).get();
  return row?.email ?? null;
}

export function passwordFor(email: string | null): string | null {
  if (!devSignInEnabled()) return null;
  if (!email || email === process.env.FLOC_DEV_USER_EMAIL) {
    return process.env.FLOC_DEV_USER_PASSWORD!;
  }
  return isSeedEmail(email) ? SEED_PASSWORD : null;
}
