/**
 * Email (ticket 08: Resend). Asked-for mail — confirming an address, resetting
 * a password, a reply to a forwarded booking, feedback — goes straight out;
 * everything else is a notification and reaches email only through the
 * fallback (#346). Every mail is drawn by `server/email` (#653). With no
 * RESEND_API_KEY the send is logged to the server console (rule 11).
 */
import "server-only";

import { appUrl } from "@/lib/env";
import type { OutboundEmail } from "@/server/email/model";
import { renderEmail } from "@/server/email/render";

export type { OutboundEmail } from "@/server/email/model";
export { emails } from "@/server/email/catalogue";

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

/** False only when the provider refused the mail; the console fallback counts as delivered (rule 11). */
async function deliver(email: OutboundEmail): Promise<boolean> {
  const from = process.env.EMAIL_FROM ?? "Floc <no-reply@floc.live>";
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
    return true;
  }

  const { html, text } = renderEmail(email, { now: new Date() });
  const client = await resend(key);
  const { error } = await client.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html,
    text,
    ...(email.replyTo ? { replyTo: email.replyTo } : {}),
  });
  return !error;
}

/** The one send entry point (ticket 111): a single send is a batch of one. */
export async function sendEmails(batch: OutboundEmail[]): Promise<boolean[]> {
  return Promise.all(batch.map(deliver));
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
