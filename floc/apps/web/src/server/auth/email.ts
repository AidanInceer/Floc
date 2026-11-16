import "server-only";

import { appUrl } from "@/lib/env";
import { countWord } from "@floc/core/text/count-word";

export type OutboundEmail = {
  to: string;
  subject: string;
  lines: string[];
  cta?: { label: string; url: string };
  sensitive?: boolean;
  replyTo?: string;
};

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
  const html = renderShell(email);
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

  const client = await resend(key);
  const { error } = await client.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html,
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

function renderShell(email: OutboundEmail) {
  const body = email.lines
    .map((l) => `<p style="margin:0 0 12px;line-height:1.55">${escape(l)}</p>`)
    .join("");
  const cta = email.cta
    ? `<p style="margin:24px 0 0"><a href="${escape(safeUrl(email.cta.url))}" style="background:#4e68d8;color:#ffffff;border-radius:999px;padding:10px 16px;text-decoration:none;font-weight:600">${escape(
        email.cta.label,
      )}</a></p>`
    : "";
  return `<div style="background:#f7f6f3;padding:24px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#14141a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e4de;border-radius:16px;padding:24px">
    <p style="margin:0 0 20px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#63636f">Floc</p>
    ${body}${cta}
    <p style="margin:24px 0 0;font-size:12px;color:#63636f">You can turn these emails off in Floc settings.</p>
  </div>
</div>`;
}

function safeUrl(url: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
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

export const emails = {
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

  inboundUnproven: (args: { to: string }): OutboundEmail => ({
    to: args.to,
    subject: "We couldn't confirm that email came from you",
    lines: [
      "Nothing was saved. Anyone can put your address on an email, so Floc only keeps files from mail your provider has signed as yours.",
      "If you sent it, upload the files in Bookings on Floc instead. If you didn't, you can ignore this.",
    ],
  }),

  inboundPartlySaved: (args: { to: string; savedCount: number; refused: string[] }): OutboundEmail => ({
    to: args.to,
    subject: args.savedCount === 0 ? "Nothing was saved from your email" : "Some files weren't saved from your email",
    lines: [
      args.refused.length === 0
        ? "That email had no PDF or image attached. Floc keeps the attached files, not the email itself."
        : `Saved ${countWord(args.savedCount, "file")} to Floc. These were left out:`,
      ...args.refused,
    ],
  }),
};
