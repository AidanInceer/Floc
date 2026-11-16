import { noticeEmail } from "@/server/notifications/notice-email";

import { emails } from "./catalogue";
import type { OutboundEmail } from "./model";

const BOOKINGS = "bookings@floc.live";
const RECEIVED = new Date("2026-11-15T14:20:00Z");
const lisbon = { id: 3, name: "Lisbon long weekend", startDate: "2027-03-12", endDate: "2027-03-15", colorKey: "mint" };

export type EmailSample = { key: string; name: string; build: (to: string) => OutboundEmail };

export const EMAIL_SAMPLES: EmailSample[] = [
  { key: "verify", name: "Confirm email", build: (to) => emails.verifyEmail({ to, url: "https://floc.live/api/auth/verify-email?token=sample" }) },
  { key: "reset", name: "Reset password", build: (to) => emails.resetPassword({ to, url: "https://floc.live/reset-password?token=sample" }) },
  { key: "unproven", name: "Booking: not proven", build: (to) => emails.inboundUnproven({ to, bookings: BOOKINGS, received: RECEIVED }) },
  { key: "nothing", name: "Booking: nothing saved", build: (to) => emails.inboundNothingAttached({ to, bookings: BOOKINGS, received: RECEIVED }) },
  {
    key: "partly",
    name: "Booking: partly saved",
    build: (to) =>
      emails.inboundPartlySaved({
        to,
        bookings: BOOKINGS,
        saved: ["TAP-TP1352-booking.pdf", "Memmo-Alfama-invoice.pdf"],
        refused: [
          { name: "itinerary.docx", reason: "Only PDFs and images can go here" },
          { name: "boarding-pass-scan.png", reason: "Files are capped at 8 MB" },
        ],
      }),
  },
  {
    key: "invited",
    name: "Notice: trip invite",
    build: (to) =>
      noticeEmail({ to, title: lisbon.name, href: "/invite/sample", lines: [`Sam invited you to ${lisbon.name}`], parts: [{ kind: "trip_invited", actor: "Sam" }], trip: lisbon }),
  },
  {
    key: "notice",
    name: "Notice (one)",
    build: (to) =>
      noticeEmail({ to, title: lisbon.name, href: "/trip/3/money", lines: [`You still owe £42.50 for ${lisbon.name}`], parts: [{ kind: "still_owe_week", actor: null }], trip: lisbon }),
  },
  {
    key: "digest",
    name: "Notice (several)",
    build: (to) =>
      noticeEmail({
        to,
        title: lisbon.name,
        href: "/inbox",
        lines: [
          `Jo added an expense to ${lisbon.name}`,
          `Alex changed the dates of ${lisbon.name}`,
          `Maya commented on ${lisbon.name}`,
          `Sam nudged you about ${lisbon.name}`,
        ],
        parts: [
          { kind: "expense_added", actor: "Jo" },
          { kind: "trip_dates_changed", actor: "Alex" },
          { kind: "comment_added", actor: "Maya" },
          { kind: "nudge_sent", actor: "Sam" },
        ],
        trip: lisbon,
      }),
  },
  {
    key: "feedback",
    name: "Feedback to Floc",
    build: () =>
      emails.feedback({
        to: "hello@floc.live",
        from: { id: "usr_sample", name: "Priya Shah", email: "priya@example.com" },
        message: "The Money tab is great, but I couldn't find where to change the currency on one expense.\nTried on my phone and on the laptop.",
        page: "/trip/…/money",
        surface: "web 0.237.0",
      }),
  },
];
