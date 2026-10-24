/**
 * A booking forwarded to a trip's address lands in the sender's own files
 * (#328, ADR-027). No parsing: the address says which trip, the From says
 * whose files.
 *
 * Why the attachments are fetched last: they are only downloaded once the
 * sender is known to be on the trip, so a stranger cannot make Floc pull
 * their files.
 */
import "server-only";

import { rejectUpload } from "@floc/core/documents/documents";

import { findTripAccess } from "@/server/access";
import { emails, type OutboundEmail } from "@/server/auth/email";

import { saveDocument } from "../document-save";
import { tripForInboundAddress } from "./inbound-address";
import { userIdForEmail } from "./inbound-sender";

export type InboundMail = { from: string; to: string[]; subject: string };

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
  loadAttachments: () => Promise<InboundAttachment[]>;
  send: (batch: OutboundEmail[]) => Promise<void>;
};

export async function receiveBookingMail(mail: InboundMail, deps: Deps): Promise<void> {
  const sender = addressIn(mail.from);
  if (!sender) return;

  const access = await accessFor(mail, sender);
  if (!access) {
    await deps.send([emails.inboundRefused({ to: sender })]);
    return;
  }

  const attached = (await deps.loadAttachments()).filter(
    (file) => !(file.inline && file.contentType.startsWith("image/")),
  );
  const refused: string[] = [];
  for (const file of attached) {
    const refusal = file.bytes
      ? await saveDocument(access, {
          name: file.filename,
          mimeType: file.contentType,
          bytes: file.bytes,
          category: "other",
          shared: false,
        })
      : (rejectUpload(file.contentType, file.sizeBytes) ?? "That file could not be read");
    if (refusal) refused.push(`${file.filename}: ${refusal}`);
  }

  if (attached.length === 0 || refused.length > 0) {
    const savedCount = attached.length - refused.length;
    await deps.send([
      emails.inboundPartlySaved({ to: sender, tripName: access.trip.name, savedCount, refused }),
    ]);
  }
}

async function accessFor(mail: InboundMail, sender: string) {
  const tripId = mail.to.map(tripForInboundAddress).find((id) => id !== null);
  if (tripId == null) return null;
  const userId = await userIdForEmail(sender);
  return userId ? findTripAccess(tripId, userId) : null;
}

function addressIn(raw: string): string | null {
  const match = /<([^>]+)>/.exec(raw);
  const address = (match ? match[1] : raw).trim().toLowerCase();
  return address.includes("@") ? address : null;
}
