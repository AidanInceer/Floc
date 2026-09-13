/**
 * Email (ticket 08: Resend). Asked-for mail — confirming an address, resetting
 * a password, a trip link sent to an address — goes straight out; everything
 * else is a notification and reaches email only through the fallback (#346).
 * With no RESEND_API_KEY the send is logged to the server console (rule 11).
 */
import "server-only";

import { appUrl } from "@/lib/env";

export type OutboundEmail = {
  to: string;
  subject: string;
  /** Plain body; wrapped in the shared shell below. */
  lines: string[];
  cta?: { label: string; url: string };
  /** CTA carries a credential; keep it out of production logs (#149). */
  sensitive?: boolean;
};

/**
 * Whether mail actually leaves the building. False means sends only log, so
 * anything gated on receiving an email must not gate at all (rule 11, #149).
 */
export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function absoluteUrl(path: string) {
  return new URL(path, appUrl()).toString();
}

/**
 * One Resend client for the process, not one per message (ticket 111). Import
 * stays dynamic so a keyless build never pulls the SDK in; the promise (not
 * the client) is memoised so concurrent sends can't race two constructions.
 */
let resendClient: Promise<import("resend").Resend> | null = null;

function resend(key: string) {
  resendClient ??= import("resend").then(({ Resend }) => new Resend(key));
  return resendClient;
}

async function deliver(email: OutboundEmail): Promise<void> {
  const html = renderShell(email);
  const from = process.env.EMAIL_FROM ?? "Floc <no-reply@floc.example>";
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev fallback (rule 11); address is masked so no full address hits the server log (ticket 111).
    // A sensitive CTA is a bearer credential: printed in development, where the
    // log is the only way to follow the link, never in production (#149).
    const showCta =
      email.cta && (!email.sensitive || process.env.NODE_ENV !== "production");
    console.info(
      `[email] → ${maskAddress(email.to)}: ${email.subject}\n${email.lines.join("\n")}${
        showCta ? `\n${email.cta!.label}: ${email.cta!.url}` : ""
      }`,
    );
    return;
  }

  const client = await resend(key);
  await client.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html,
  });
}

/** The one send entry point (ticket 111): a single send is a batch of one. */
export async function sendEmails(batch: OutboundEmail[]): Promise<void> {
  await Promise.all(batch.map(deliver));
}

/** `ada@floc.example` → `a…a@floc.example`: enough to tell apart, not enough to be an address. */
function maskAddress(to: string): string {
  const at = to.lastIndexOf("@");
  if (at <= 0) return "…";
  const local = to.slice(0, at);
  const domain = to.slice(at);
  if (local.length <= 2) return `${local[0]}…${domain}`;
  return `${local[0]}…${local[local.length - 1]}${domain}`;
}

/**
 * One shell for every email. Repainted onto the white-and-pastel palette
 * (ticket 207) — it still carried the retired sand-and-teal notebook colours,
 * so a notification looked like a different product to the page it linked to.
 *
 * The hexes are written out here on purpose and are the one exception to "no
 * hex outside the tokens" (ticket 206): a mail client has no stylesheet, so
 * `var()` never resolves. They are copies of the tokens in globals.css —
 * `--paper`, `--sheet`, `--rule`, `--ink`, `--ink-2`, `--pen`. Change them
 * together.
 */
function renderShell(email: OutboundEmail) {
  const body = email.lines
    .map((l) => `<p style="margin:0 0 12px;line-height:1.55">${escape(l)}</p>`)
    .join("");
  const cta = email.cta
    ? `<p style="margin:24px 0 0"><a href="${escape(safeUrl(email.cta.url))}" style="background:#4e68d8;color:#ffffff;border-radius:999px;padding:10px 16px;text-decoration:none;font-weight:600">${escape(
        email.cta.label,
      )}</a></p>`
    : "";
  // A system sans, not the design faces — next/font can't reach a mail client,
  // and the app's own stack is a webfont with a system fallback anyway. The
  // retired Georgia belonged to the notebook's serif voice (ticket 121).
  return `<div style="background:#f7f6f3;padding:24px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#14141a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e4de;border-radius:16px;padding:24px">
    <p style="margin:0 0 20px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#63636f">Floc</p>
    ${body}${cta}
    <p style="margin:24px 0 0;font-size:12px;color:#63636f">You can turn these emails off in Floc settings.</p>
  </div>
</div>`;
}

/**
 * The one un-escaped interpolation (ticket 113) — escaping alone wouldn't stop
 * `href="javascript:…"`, which needs no quotes to break out. Every CTA URL is
 * app-constructed today, but a catalogue entry is one caller away from an
 * external URL, so the scheme is allow-listed: anything not plainly http(s) or
 * site-relative degrades to the base URL instead of rendering (rule 11).
 */
function safeUrl(url: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // not a URL at all
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

// The catalogue of asked-for mail (ticket 20). Notifications are not here: they are worded by the fallback (#346).
export const emails = {
  /** Trigger: a password sign-up (ticket 149). Google sign-ups never see this. */
  verifyEmail: (args: { to: string; url: string }): OutboundEmail => ({
    to: args.to,
    subject: "Confirm your email for Floc",
    lines: [
      "Confirm this address to start joining trips on Floc.",
      "The link works once and expires within the hour.",
    ],
    cta: { label: "Confirm email", url: args.url },
    sensitive: true,
  }),

  /** Trigger: someone asks to reset a forgotten password (#149). */
  resetPassword: (args: { to: string; url: string }): OutboundEmail => ({
    to: args.to,
    subject: "Reset your Floc password",
    lines: [
      "Someone asked to reset the password on this address.",
      "The link works once and expires within the hour. If this wasn't you, ignore it — nothing has changed.",
    ],
    cta: { label: "Choose a new password", url: args.url },
    sensitive: true,
  }),

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
      `${args.fromName} is planning ${args.tripName} on Floc and wants you in.`,
      "Anyone with this link can join the trip, so keep it to the group.",
    ],
    cta: { label: "See the trip", url: absoluteUrl(`/invite/${args.token}`) },
  }),
};
