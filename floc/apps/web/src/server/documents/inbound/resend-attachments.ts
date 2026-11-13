/**
 * The files on an email Resend received (#328). The webhook carries only their
 * names; the bytes sit behind a list call and a one-hour download link each.
 * Plain `fetch`, because the installed `resend` SDK predates receiving.
 */
import "server-only";

import { INBOUND_FILES_PER_MAIL } from "@floc/core/documents/booking/booking-inbox";
import { rejectUpload } from "@floc/core/documents/documents";

import type { InboundAttachment } from "./booking-mail";

type Listed = {
  filename: string;
  size: number;
  content_type: string;
  content_disposition?: string;
  download_url: string;
};

export async function resendAttachments(
  emailId: string,
  apiKey: string,
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<InboundAttachment[]> {
  const listed = await fetcher(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!listed.ok) throw new Error(`Resend listed attachments with ${listed.status}`);
  const { data } = (await listed.json()) as { data: Listed[] };

  // Why the cap comes before any download: a mail with hundreds of attachments must not be pulled into memory (#559).
  const kept = data
    .filter((file) => !(file.content_disposition === "inline" && String(file.content_type).startsWith("image/")))
    .slice(0, INBOUND_FILES_PER_MAIL);

  const files: InboundAttachment[] = [];
  for (const file of kept) {
    const base = { filename: file.filename, contentType: file.content_type, inline: file.content_disposition === "inline", sizeBytes: file.size };
    // Why: what would be refused anyway is never pulled into memory.
    if (rejectUpload(file.content_type, file.size)) {
      files.push({ ...base, bytes: null });
      continue;
    }
    const download = await fetcher(file.download_url);
    if (!download.ok) throw new Error(`Resend download answered ${download.status}`);
    const bytes = new Uint8Array(await download.arrayBuffer());
    // Why: the listed size is only a claim, so the real one is checked too.
    const tooBig = rejectUpload(file.content_type, bytes.byteLength) !== null;
    files.push(tooBig ? { ...base, sizeBytes: bytes.byteLength, bytes: null } : { ...base, bytes });
  }
  return files;
}
