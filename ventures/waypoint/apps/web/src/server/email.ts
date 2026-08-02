/**
 * Transactional email (ticket 08: Resend) and the v1 catalogue (ticket 20).
 *
 * Categories map 1:1 onto the four `user_profile.notify_*` booleans (ticket
 * 07). Genuinely transactional mail (an invite the recipient asked for by
 * tapping a link) always sends; everything else is suppressible.
 *
 * With no RESEND_API_KEY the send is logged to the server console instead —
 * so the whole flow is exercisable before the account exists.
 */
import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { appUrl } from "@/lib/env";

export type EmailCategory = "invites" | "votes" | "money" | "nudges";

const CATEGORY_COLUMN = {
  invites: "notifyInvites",
  votes: "notifyVotes",
  money: "notifyMoney",
  nudges: "notifyNudges",
} as const;

export type OutboundEmail = {
  to: string;
  subject: string;
  /** Plain body; wrapped in the shared shell below. */
  lines: string[];
  cta?: { label: string; url: string };
  category: EmailCategory;
  /** Transactional mail ignores the recipient's category toggle. */
  transactional?: boolean;
  /** Recipient's user id — needed to read their preference. */
  toUserId?: string;
};

export function absoluteUrl(path: string) {
  return new URL(path, appUrl()).toString();
}

/**
 * One Resend client for the process, not one per message (ticket 111).
 *
 * The import stays dynamic so a build without the key never pulls the SDK in,
 * and the promise is memoised rather than the client so two concurrent sends
 * can't race two constructions.
 */
let resendClient: Promise<import("resend").Resend> | null = null;

function resend(key: string) {
  resendClient ??= import("resend").then(({ Resend }) => new Resend(key));
  return resendClient;
}

/** The send itself, once the category gate has already been cleared. */
async function deliver(email: OutboundEmail): Promise<boolean> {
  const html = renderShell(email);
  const from = process.env.EMAIL_FROM ?? "Waypoint <no-reply@waypoint.example>";
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Deliberate dev fallback: never silently drop mail without a trace.
    // The address is masked — the log has to say *which* mailbox without
    // putting a full address in the server log (ticket 111).
    console.info(
      `[email:${email.category}] → ${maskAddress(email.to)}: ${email.subject}\n${email.lines.join("\n")}${
        email.cta ? `\n${email.cta.label}: ${email.cta.url}` : ""
      }`,
    );
    return true;
  }

  const client = await resend(key);
  await client.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html,
  });
  return true;
}

/**
 * The one way out of the building (ticket 111).
 *
 * There were two entry points — `sendEmail` for one message, this for many —
 * and the singular one read `user_profile` per message, so a six-person expense
 * cost six round trips before a single mail left. One batched entry point does
 * both jobs: a single send is a batch of one, and the preference lookup is
 * always one query. Same rules, same defaults (missing profile → on,
 * transactional → always).
 */
export async function sendEmails(batch: OutboundEmail[]): Promise<void> {
  if (batch.length === 0) return;

  const gated = batch.filter((e) => !e.transactional && e.toUserId);
  const allowedByUser = new Map<string, typeof userProfile.$inferSelect>();

  if (gated.length) {
    const profiles = await db
      .select()
      .from(userProfile)
      .where(inArray(userProfile.userId, [...new Set(gated.map((e) => e.toUserId!))]))
      .all();
    for (const p of profiles) allowedByUser.set(p.userId, p);
  }

  await Promise.all(
    batch.map((email) => {
      if (!email.transactional && email.toUserId) {
        const profile = allowedByUser.get(email.toUserId);
        if (profile && !profile[CATEGORY_COLUMN[email.category]]) return Promise.resolve(false);
      }
      // Preference already settled above, so the per-send lookup is skipped.
      return deliver(email);
    }),
  );
}

/** `ada@waypoint.example` → `a…a@waypoint.example`: enough to tell apart, not enough to be an address. */
function maskAddress(to: string): string {
  const at = to.lastIndexOf("@");
  if (at <= 0) return "…";
  const local = to.slice(0, at);
  const domain = to.slice(at);
  if (local.length <= 2) return `${local[0]}…${domain}`;
  return `${local[0]}…${local[local.length - 1]}${domain}`;
}

/** One shell for every email; matches the app's sand/marine palette. */
function renderShell(email: OutboundEmail) {
  const body = email.lines
    .map((l) => `<p style="margin:0 0 12px;line-height:1.55">${escape(l)}</p>`)
    .join("");
  const cta = email.cta
    ? `<p style="margin:24px 0 0"><a href="${escape(safeUrl(email.cta.url))}" style="background:#0f6270;color:#f7f3ec;border-radius:6px;padding:10px 16px;text-decoration:none;font-weight:600">${escape(
        email.cta.label,
      )}</a></p>`
    : "";
  return `<div style="background:#f7f3ec;padding:24px;font-family:'Segoe UI',system-ui,sans-serif;color:#17282d">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2dacc;border-radius:10px;padding:24px">
    <p style="margin:0 0 20px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#566a6e">Waypoint</p>
    ${body}${cta}
    <p style="margin:24px 0 0;font-size:12px;color:#8b9698">You can turn these emails off in Waypoint settings.</p>
  </div>
</div>`;
}

/**
 * The one interpolation in this file that wasn't escaped (ticket 113).
 *
 * Escaping alone would close the attribute-injection hole but not the other
 * one: `href="javascript:…"` needs no quotes to break out of. Every CTA URL is
 * app-constructed today, so neither is live — but a catalogue entry is one
 * caller away from taking a URL from somewhere else, and outbound mail is
 * exactly where you do not want to find that out.
 *
 * So the scheme is allow-listed, not sanitised: anything that isn't plainly
 * http(s) or a site-relative path degrades to the app's own base URL rather
 * than being rendered. A broken button in one email beats a live link in a
 * thousand (rule 11).
 */
function safeUrl(url: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // Not a URL at all — fall through.
  }
  return "/";
}

function escape(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}

/* -------------------------------------------------------------------------- */
/* The catalogue (ticket 20) — five emails, all instant, no digests in v1      */
/* -------------------------------------------------------------------------- */

export const emails = {
  /** Trigger: an admin shares the trip link to a named email address. */
  invite: (args: {
    to: string;
    tripName: string;
    fromName: string;
    token: string;
  }): OutboundEmail => ({
    to: args.to,
    subject: `${args.fromName} invited you to ${args.tripName}`,
    lines: [
      `${args.fromName} is planning ${args.tripName} on Waypoint and wants you in.`,
      "Anyone with this link can join the trip, so keep it to the group.",
    ],
    cta: { label: "See the trip", url: absoluteUrl(`/invite/${args.token}`) },
    category: "invites",
    // Asked-for and one-shot: always sends.
    transactional: true,
  }),

  /** Trigger: one member nudges another. Deep-links to the tab it's about. */
  nudge: (args: {
    to: string;
    toUserId: string;
    tripId: number;
    tripName: string;
    fromName: string;
    tab: string;
    message?: string | null;
  }): OutboundEmail => ({
    to: args.to,
    toUserId: args.toUserId,
    subject: `${args.fromName} nudged you about ${args.tripName}`,
    lines: [
      `${args.fromName} is waiting on you for ${args.tripName}.`,
      args.message?.trim() ? `“${args.message.trim()}”` : `It's the ${args.tab} tab.`,
    ],
    cta: {
      label: `Open ${args.tab}`,
      url: absoluteUrl(`/trip/${args.tripId}/${args.tab}`),
    },
    category: "nudges",
  }),

  /** Trigger: someone posts a new idea. */
  ideaPosted: (args: {
    to: string;
    toUserId: string;
    tripId: number;
    tripName: string;
    fromName: string;
    idea: string;
  }): OutboundEmail => ({
    to: args.to,
    toUserId: args.toUserId,
    subject: `New idea for ${args.tripName}`,
    lines: [`${args.fromName} suggested: “${args.idea}”`, "Say what you think."],
    cta: {
      label: "Vote on it",
      url: absoluteUrl(`/trip/${args.tripId}/ideas`),
    },
    category: "votes",
  }),

  /** Trigger: an expense is added that the recipient owes a share of. */
  expenseAdded: (args: {
    to: string;
    toUserId: string;
    tripId: number;
    tripName: string;
    fromName: string;
    description: string;
    share: string;
  }): OutboundEmail => ({
    to: args.to,
    toUserId: args.toUserId,
    subject: `${args.fromName} added a cost to ${args.tripName}`,
    lines: [
      `${args.fromName} logged “${args.description}”.`,
      `Your share is ${args.share}. Nothing has moved — Waypoint only keeps the ledger.`,
    ],
    cta: { label: "See the money", url: absoluteUrl(`/trip/${args.tripId}/money`) },
    category: "money",
  }),

  /** Trigger: a friend request via a profile bubble. */
  friendRequest: (args: {
    to: string;
    toUserId: string;
    fromName: string;
  }): OutboundEmail => ({
    to: args.to,
    toUserId: args.toUserId,
    subject: `${args.fromName} wants to be travel friends`,
    lines: [`${args.fromName} sent you a friend request on Waypoint.`],
    cta: { label: "Open friends", url: absoluteUrl("/friends") },
    category: "invites",
  }),
};
