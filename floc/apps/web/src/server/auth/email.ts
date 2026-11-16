import "server-only";

import { appUrl } from "@/lib/env";
import type { OutboundEmail } from "@/server/email/model";
import { renderEmail } from "@/server/email/render";

export type { OutboundEmail } from "@/server/email/model";
export { emails } from "@/server/email/catalogue";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function absoluteUrl(path: string) {
  return new URL(path, appUrl()).toString();
}

let resendClient: Promise<import("resend").Resend> | null = null;

function resend(key: string) {
  resendClient ??= import("resend").then(({ Resend }) => new Resend(key));
  return resendClient;
}

async function deliver(email: OutboundEmail): Promise<boolean> {
  const from = process.env.EMAIL_FROM ?? "Floc <no-reply@floc.live>";
  const key = process.env.RESEND_API_KEY;

  if (!key) {
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

export async function sendEmails(batch: OutboundEmail[]): Promise<boolean[]> {
  return Promise.all(batch.map(deliver));
}

function maskAddress(to: string): string {
  const at = to.lastIndexOf("@");
  if (at <= 0) return "…";
  const local = to.slice(0, at);
  const domain = to.slice(at);
  if (local.length <= 2) return `${local[0]}…${domain}`;
  return `${local[0]}…${local[local.length - 1]}${domain}`;
}
