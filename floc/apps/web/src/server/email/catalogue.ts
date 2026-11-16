/**
 * The catalogue of asked-for mail (ticket 20), in the layouts Aidan picked (#653, ADR-062): account and booking
 * mail is a card. Notifications are not here: the fallback words them (#346).
 */
import { countWord } from "@floc/core/text/count-word";

import { appUrl } from "@/lib/env";

import type { OutboundEmail } from "./model";

const REACHED = (bookings: string) => `You got this because an email from this address reached ${bookings}.`;
const FORWARDED = (bookings: string) => `You got this because you forwarded an email to ${bookings}.`;

/** Why: drawn in UK time, where Floc is run (ADR-058); a reply goes out seconds after the mail lands. */
const RECEIVED_AT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const receivedAt = (d: Date) => RECEIVED_AT.format(d);
const partlySaved = (saved: number, refused: number) =>
  saved === 0 ? "No file could be saved." : `Saved ${countWord(saved, "file")} to Floc. ${refused} ${refused === 1 ? "was" : "were"} left out.`;
const openBookings = () => ({ label: "Open Bookings", url: new URL("/bookings", appUrl()).toString() });

export const emails = {
  /** Trigger: a password sign-up (ticket 149). Google sign-ups never see this. */
  verifyEmail: (args: { to: string; url: string }): OutboundEmail => ({
    to: args.to,
    subject: "Confirm your email for Floc",
    layout: "card",
    heading: "Confirm your email",
    lines: ["Confirm this address to start joining trips on Floc."],
    cta: { label: "Confirm email", url: args.url },
    note: "The link works once and expires within the hour.",
    why: "You got this because this address was used to sign up to Floc. If that wasn't you, ignore this email.",
    sensitive: true,
  }),

  /** Trigger: someone asks to reset a forgotten password (#149). */
  resetPassword: (args: { to: string; url: string }): OutboundEmail => ({
    to: args.to,
    subject: "Reset your Floc password",
    layout: "card",
    heading: "Choose a new password",
    lines: ["Someone asked to reset the password on this address."],
    cta: { label: "Choose a new password", url: args.url },
    note: "The link works once and expires within the hour. If this wasn't you, ignore it — nothing has changed.",
    why: "You got this because a password reset was asked for on this address.",
    sensitive: true,
  }),

  /** Trigger: mail from a member's address that their mail provider did not sign, so it may be forged (#328). */
  inboundUnproven: (args: { to: string; bookings: string; received: Date }): OutboundEmail => ({
    to: args.to,
    subject: "We couldn't confirm that email came from you",
    layout: "card",
    box: { title: receivedAt(args.received), status: "Not saved" },
    facts: [["Sent to", args.bookings], ["Saved", "Nothing"]],
    lines: ["Anyone can put your address on an email, so Floc only keeps files from mail your provider has signed as yours. If you didn't send it, you can ignore this."],
    steps: ["Open Bookings on Floc.", "Upload the files there."],
    cta: openBookings(),
    why: REACHED(args.bookings),
  }),

  /** Trigger: a forwarded booking with no PDF or image attached (#328). */
  inboundNothingAttached: (args: { to: string; bookings: string; received: Date }): OutboundEmail => ({
    to: args.to,
    subject: "Nothing was saved from your email",
    layout: "card",
    box: { title: receivedAt(args.received), status: "Nothing saved" },
    facts: [["Sent to", args.bookings], ["Attached", "No files"]],
    lines: ["That email had no PDF or image attached. Floc keeps the attached files, not the email itself."],
    steps: ["Forward it again with the PDF or image attached.", "Or upload the file in Bookings on Floc."],
    cta: openBookings(),
    why: FORWARDED(args.bookings),
  }),

  /** Trigger: a forwarded booking with a file Floc had to leave out (#328, #559). File names arrive cleaned. */
  inboundPartlySaved: (args: { to: string; bookings: string; saved: string[]; refused: { name: string; reason: string }[] }): OutboundEmail => ({
    to: args.to,
    subject: args.saved.length === 0 ? "Nothing was saved from your email" : "Some files weren't saved from your email",
    layout: "card",
    heading: args.saved.length === 0 ? "Nothing was saved from your email" : "Some files weren't saved",
    lines: [partlySaved(args.saved.length, args.refused.length)],
    rows: [
      ...args.saved.map((name) => ({ text: name, tag: { word: "Saved", tone: "green" as const } })),
      ...args.refused.map((f) => ({ text: f.name, note: f.reason, tag: { word: "Left out", tone: "red" as const } })),
    ],
    cta: openBookings(),
    why: FORWARDED(args.bookings),
  }),

  /** Trigger: a signed-in member sends feedback to Floc's own mailbox (#271). */
  feedback: (args: { to: string; from: { id: string; name: string; email: string }; message: string; page: string; surface: string }): OutboundEmail => ({
    to: args.to,
    replyTo: args.from.email,
    subject: `Feedback from ${args.from.name}`,
    layout: "card",
    lines: [],
    quote: args.message.split(/\n+/).map((line) => line.trim()).filter(Boolean),
    facts: [["From", `${args.from.name}, ${args.from.email}`], ["User", args.from.id], ["Page", args.page], ["Surface", args.surface]],
    why: `Sent by the feedback form. Reply to answer ${args.from.name}.`,
  }),
};
