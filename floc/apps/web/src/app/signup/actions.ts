"use server";

/**
 * Signup's one mutation (ticket 117, S11).
 *
 * It was an inline `"use server"` closure inside the page — the convention is
 * that a mutation lives in its route folder's `actions.ts`, and a one-line
 * mutation is not an exception to it. `AuthForm` is a Client Component, so
 * this is the only way it can reach the server at all.
 */
import type { SignupChannel } from "@/db/schema";
import { getSession } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";

const VIA_VALUES = ["whatsapp", "email", "link", "direct"] as const;

/** Records how someone arrived, once they have an account to hang it on. */
export async function captureChannel(via: string): Promise<void> {
  const session = await getSession();
  if (!session?.user) return;

  // Anything unrecognised is "direct" rather than a rejection: this is an
  // analytics-ish breadcrumb, and a bad `?via=` must never block a signup.
  const channel = (VIA_VALUES as readonly string[]).includes(via)
    ? (via as SignupChannel)
    : "direct";

  await ensureProfile(session.user.id, { signupChannel: channel });
}
