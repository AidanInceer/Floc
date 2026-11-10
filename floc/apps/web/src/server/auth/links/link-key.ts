import { requireInProduction } from "@/lib/env";

const OWN_SECRET = {
  "calendar-feed": "FLOC_CALENDAR_LINK_SECRET",
  "file-view": "FLOC_FILE_LINK_SECRET",
  "inbound-address": "FLOC_INBOUND_ADDRESS_SECRET",
} as const;

export type LinkKind = keyof typeof OWN_SECRET;

/**
 * Why: every signed link used the session secret, so ending one kind of link meant signing everyone out, and
 * rotating sessions ended every calendar feed and trip address (#582). Each kind may now have its own secret.
 * Unset, it falls back to the session secret, so links made before the change keep working.
 */
export function linkKey(kind: LinkKind): string {
  return process.env[OWN_SECRET[kind]] || requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
}
