/**
 * A booking forwarded to the shared address (#559, ADR-049). The proven From says whose files it is; the
 * booking's own dates say which trip; anything Floc cannot place waits in the sender's Bookings area.
 *
 * Why the order: nothing is fetched or read until the sender is a known account, the mail is new and under the
 * limit, and the From is proven. So a stranger cannot make Floc pull files, run a reader, or send a reply.
 * Nothing in the mail can name a trip: only the sender's own trips are candidates.
 */
import "server-only";

import { readBoardingPass } from "@floc/core/documents/booking/boarding-pass";
import { bookingCategory, storeBookingDetails, type BookingDetails } from "@floc/core/documents/booking/booking-details";
import { INBOUND_FILES_PER_MAIL } from "@floc/core/documents/booking/booking-inbox";
import { tripForBooking } from "@floc/core/documents/booking/booking-trip";
import { readSchemaOrg } from "@floc/core/documents/booking/schema-org";
import { cleanFileName, rejectUpload } from "@floc/core/documents/documents";
import { today } from "@floc/core/dates/dates";

import { db } from "@/db";
import { findTripAccess } from "@/server/access";
import { emails, type OutboundEmail } from "@/server/auth/email";
import { mailCap } from "@/server/auth/mail/mail-cap";
import { canUseFeature } from "@/server/billing/entitlements";
import { refresh } from "@/server/freshness";
import { recordActivity } from "@/server/notifications/activity";

import { saveWaitingBooking } from "../bookings/booking-inbox";
import { tripsToPlaceIn } from "../bookings/booking-inbox-rows";
import { saveDocument } from "../document-save";
import { isBookingsAddress } from "./inbound-address";
import { claimInboundMail, overInboundLimit, releaseInboundMail } from "./inbound-mail-rows";
import { userIdForEmail } from "./inbound-sender";
import type { ReceivedMail } from "./resend-received";

export type InboundMail = { emailId: string; from: string; to: string[] };

export type InboundAttachment = {
  filename: string;
  contentType: string;
  /** Drawn inside the email body, such as a logo, rather than attached. */
  inline: boolean;
  sizeBytes: number;
  /** Null when it was refused before download: too big, or not a PDF or image. */
  bytes: Uint8Array | null;
};

type Deps = {
  received: () => Promise<ReceivedMail>;
  loadAttachments: () => Promise<InboundAttachment[]>;
  barcodes: (file: { mimeType: string; bytes: Uint8Array }) => Promise<string[]>;
  send: (batch: OutboundEmail[]) => Promise<void>;
  /** The reply limit. Absent uses the process-wide one. */
  replies?: Pick<ReturnType<typeof mailCap>, "allow">;
};

/** Why: a reply is mail Floc sends, so one sender gets few of them however many mails they forward (ADR-036). */
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

/** The account a mail is from, when the mail may go further: sent to the shared address, and not seen before. */
async function knownSender(mail: InboundMail): Promise<{ userId: string; address: string } | null> {
  if (!mail.to.some(isBookingsAddress)) return null;
  const address = addressIn(mail.from);
  // Why only an account holder goes further: the From is forgeable, so answering anyone lets a stranger make Floc mail a third party.
  const userId = address ? await userIdForEmail(address) : null;
  if (!address || !userId) return null;
  return (await claimInboundMail(mail.emailId)) ? { userId, address } : null;
}

type Where = Awaited<ReturnType<typeof tripFor>>;

/** Null when the file is kept, else why not, with the file's cleaned name. */
async function keep(userId: string, file: InboundAttachment, details: BookingDetails | null, access: Where): Promise<string | null> {
  const input = { name: file.filename, mimeType: file.contentType, category: details ? bookingCategory(details) : ("other" as const) };
  let refusal: string | null;
  if (!file.bytes) refusal = rejectUpload(file.contentType, file.sizeBytes) ?? "That file could not be read";
  else if (access) refusal = await saveDocument(access, { ...input, bytes: file.bytes, shared: false, bookingDetails: storeBookingDetails(details) });
  else refusal = await saveWaitingBooking(userId, { ...input, bytes: file.bytes, details });
  // Why: the name is the only text from the mail a reply carries, so it goes out cleaned.
  return refusal ? `${cleanFileName(file.filename)}: ${refusal}` : null;
}

export async function receiveBookingMail(mail: InboundMail, deps: Deps): Promise<void> {
  const sender = await knownSender(mail);
  if (!sender) return;
  try {
    await receiveFrom(sender, mail, deps);
  } catch (error) {
    // Why: Resend sends the mail again after a failure, and a kept claim would drop that retry as a replay.
    await releaseInboundMail(mail.emailId);
    throw error;
  }
}

async function receiveFrom(sender: { userId: string; address: string }, mail: InboundMail, deps: Deps): Promise<void> {
  const received = await deps.received();
  if (received.severalFrom) return;
  // Why: a forged From names a real member, so without proof a stranger could put files in their private Files.
  if (!received.proven) {
    await reply(deps, received, emails.inboundUnproven({ to: sender.address }));
    return;
  }
  // Why only proven mail counts: a stranger's forged mails must not use up the member's own hour.
  if (await overInboundLimit(mail.emailId, sender.userId)) return;

  const attached = (await deps.loadAttachments())
    .filter((file) => !(file.inline && file.contentType.startsWith("image/")))
    .slice(0, INBOUND_FILES_PER_MAIL);
  // Why Pro comes first: reading a booking is the Pro feature, and the readers cost time, so Free mail never runs them.
  const reads = await canUseFeature("bookings.autoFile", sender.userId);
  const details = reads ? await readDetails(received.html, attached, deps) : null;
  const access = await tripFor(sender.userId, details);

  const refused: string[] = [];
  for (const file of attached) {
    const refusal = await keep(sender.userId, file, details, access);
    if (refusal) refused.push(refusal);
  }

  const savedCount = attached.length - refused.length;
  if (savedCount > 0) await receipt(sender.userId, access?.trip.id ?? null);
  if (attached.length === 0 || refused.length > 0) {
    await reply(deps, received, emails.inboundPartlySaved({ to: sender.address, savedCount, refused }));
  }
}

/** The one address a From line names, or null: a line that names two is refused, not guessed at. */
function addressIn(raw: string): string | null {
  const found = raw.slice(0, 500).match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? [];
  return found.length === 1 ? found[0].toLowerCase() : null;
}
