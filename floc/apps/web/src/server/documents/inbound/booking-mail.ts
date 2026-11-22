import "server-only";

import { and, count, eq, gt, sql } from "drizzle-orm";

import { readBoardingPass } from "@floc/core/documents/booking/boarding-pass";
import { bookingCategory, storeBookingDetails, type BookingDetails } from "@floc/core/documents/booking/booking-details";
import { INBOUND_FILES_PER_MAIL, INBOUND_MAILS_PER_HOUR } from "@floc/core/documents/booking/booking-inbox";
import { tripForBooking } from "@floc/core/documents/booking/booking-trip";
import { readSchemaOrg } from "@floc/core/documents/booking/schema-org";
import { cleanFileName, rejectUpload } from "@floc/core/documents/documents";
import { today } from "@floc/core/dates/dates";

import { db } from "@/db";
import { inboundMail, user } from "@/db/schema";
import { findTripAccess } from "@/server/access";
import { emails, type OutboundEmail } from "@/server/auth/email";
import { mailCap } from "@/server/auth/mail/mail-cap";
import { canUseFeature } from "@/server/billing/entitlements";
import { refresh } from "@/server/freshness";
import { recordActivity } from "@/server/notifications/activity";

import { saveWaitingBooking } from "../bookings/booking-inbox";
import { tripsToPlaceIn } from "../bookings/booking-inbox-rows";
import { saveDocument } from "../document-save";
import { bookingsAddressForReply, isBookingsAddress } from "./inbound-address";
import type { ReceivedMail } from "./resend-received";

const HOUR_MS = 60 * 60 * 1000;

async function claimInboundMail(emailId: string): Promise<boolean> {
  const rows = await db
    .insert(inboundMail)
    .values({ emailId })
    .onConflictDoNothing()
    .returning({ emailId: inboundMail.emailId })
    .all();
  return rows.length === 1;
}

async function releaseInboundMail(emailId: string): Promise<void> {
  await db.delete(inboundMail).where(eq(inboundMail.emailId, emailId)).run();
}

async function overInboundLimit(emailId: string, userId: string, now = new Date()): Promise<boolean> {
  await db.update(inboundMail).set({ userId }).where(eq(inboundMail.emailId, emailId)).run();
  const row = await db
    .select({ n: count() })
    .from(inboundMail)
    .where(and(eq(inboundMail.userId, userId), gt(inboundMail.createdAt, new Date(now.getTime() - HOUR_MS))))
    .get();
  return (row?.n ?? 0) > INBOUND_MAILS_PER_HOUR;
}

async function userIdForEmail(email: string): Promise<string | null> {
  const row = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(sql`lower(${user.email})`, email.trim().toLowerCase()), eq(user.emailVerified, true)))
    .get();
  return row?.id ?? null;
}

export type InboundMail = { emailId: string; from: string; to: string[] };

export type InboundAttachment = {
  filename: string;
  contentType: string;
  inline: boolean;
  sizeBytes: number;
  bytes: Uint8Array | null;
};

type Deps = {
  received: () => Promise<ReceivedMail>;
  loadAttachments: () => Promise<InboundAttachment[]>;
  barcodes: (file: { mimeType: string; bytes: Uint8Array }) => Promise<string[]>;
  send: (batch: OutboundEmail[]) => Promise<unknown>;
  replies?: Pick<ReturnType<typeof mailCap>, "allow">;
};

const inboundReplies = mailCap({ perDay: 3 });

async function reply(deps: Deps, mail: ReceivedMail, email: OutboundEmail): Promise<void> {
  if (mail.automated || !(deps.replies ?? inboundReplies).allow("inbound", email.to)) return;
  await deps.send([email]);
}

async function readDetails(html: string | null, files: InboundAttachment[], deps: Deps): Promise<BookingDetails | null> {
  const fromMail = readSchemaOrg(html);
  if (fromMail) return fromMail;
  for (const file of files) {
    if (!file.bytes) continue;
    for (const text of await deps.barcodes({ mimeType: file.contentType, bytes: file.bytes })) {
      const pass = readBoardingPass(text, today());
      if (pass) return pass;
    }
  }
  return null;
}

async function tripFor(userId: string, details: BookingDetails | null) {
  if (!details) return null;
  const tripId = tripForBooking(details, await tripsToPlaceIn(userId));
  return tripId === null ? null : findTripAccess(tripId, userId);
}

async function receipt(userId: string, tripId: number | null): Promise<void> {
  await db.transaction((tx) =>
    recordActivity(tx, {
      kind: tripId === null ? "booking_waiting" : "booking_filed",
      tripId,
      actorId: userId,
      subjectId: null,
      href: tripId === null ? "/bookings" : `/trip/${tripId}/files`,
      affected: [userId],
    }),
  );
  refresh({ kind: "inbox" });
}

async function knownSender(mail: InboundMail): Promise<{ userId: string; address: string } | null> {
  if (!mail.to.some(isBookingsAddress)) return null;
  const address = addressIn(mail.from);
  const userId = address ? await userIdForEmail(address) : null;
  if (!address || !userId) return null;
  return (await claimInboundMail(mail.emailId)) ? { userId, address } : null;
}

type Where = Awaited<ReturnType<typeof tripFor>>;

type Kept = { name: string; refusal: string | null };

async function keep(userId: string, file: InboundAttachment, details: BookingDetails | null, access: Where): Promise<Kept> {
  const input = { name: file.filename, mimeType: file.contentType, category: details ? bookingCategory(details) : ("other" as const) };
  let refusal: string | null;
  if (!file.bytes) refusal = rejectUpload(file.contentType, file.sizeBytes) ?? "That file could not be read";
  else if (access) refusal = await saveDocument(access, { ...input, bytes: file.bytes, shared: false, bookingDetails: storeBookingDetails(details) });
  else refusal = await saveWaitingBooking(userId, { ...input, bytes: file.bytes, details });
  return { name: cleanFileName(file.filename), refusal };
}

export async function receiveBookingMail(mail: InboundMail, deps: Deps): Promise<void> {
  const sender = await knownSender(mail);
  if (!sender) return;
  try {
    await receiveFrom(sender, mail, deps);
  } catch (error) {
    await releaseInboundMail(mail.emailId);
    throw error;
  }
}

async function receiveFrom(sender: { userId: string; address: string }, mail: InboundMail, deps: Deps): Promise<void> {
  const received = await deps.received();
  if (received.severalFrom) return;
  if (!received.proven) {
    await reply(deps, received, emails.inboundUnproven({ to: sender.address, bookings: bookingsAddressForReply(), received: new Date() }));
    return;
  }
  if (await overInboundLimit(mail.emailId, sender.userId)) return;

  const attached = (await deps.loadAttachments())
    .filter((file) => !(file.inline && file.contentType.startsWith("image/")))
    .slice(0, INBOUND_FILES_PER_MAIL);
  const reads = await canUseFeature("bookings.autoFile", sender.userId);
  const details = reads ? await readDetails(received.html, attached, deps) : null;
  const access = await tripFor(sender.userId, details);

  const kept: Kept[] = [];
  for (const file of attached) kept.push(await keep(sender.userId, file, details, access));
  const saved = kept.filter((k) => !k.refusal).map((k) => k.name);
  const refused = kept.flatMap((k) => (k.refusal ? [{ name: k.name, reason: k.refusal }] : []));

  if (saved.length > 0) await receipt(sender.userId, access?.trip.id ?? null);
  if (attached.length === 0) {
    await reply(deps, received, emails.inboundNothingAttached({ to: sender.address, bookings: bookingsAddressForReply(), received: new Date() }));
  } else if (refused.length > 0) {
    await reply(deps, received, emails.inboundPartlySaved({ to: sender.address, bookings: bookingsAddressForReply(), saved, refused }));
  }
}

function addressIn(raw: string): string | null {
  const found = raw.slice(0, 500).match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? [];
  return found.length === 1 ? found[0].toLowerCase() : null;
}
