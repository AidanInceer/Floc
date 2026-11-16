import { requireInProduction } from "@/lib/env";

const OWN_SECRET = {
  "calendar-feed": "FLOC_CALENDAR_LINK_SECRET",
  "file-view": "FLOC_FILE_LINK_SECRET",
  "inbound-address": "FLOC_INBOUND_ADDRESS_SECRET",
  "invite-link": "FLOC_INVITE_LINK_SECRET",
} as const;

export type LinkKind = keyof typeof OWN_SECRET;

export function linkKey(kind: LinkKind): string {
  return process.env[OWN_SECRET[kind]] || requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
}
