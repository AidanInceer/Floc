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

  const kept = data
    .filter((file) => !(file.content_disposition === "inline" && String(file.content_type).startsWith("image/")))
    .slice(0, INBOUND_FILES_PER_MAIL);

  const files: InboundAttachment[] = [];
  for (const file of kept) {
    const base = { filename: file.filename, contentType: file.content_type, inline: file.content_disposition === "inline", sizeBytes: file.size };
    if (rejectUpload(file.content_type, file.size)) {
      files.push({ ...base, bytes: null });
      continue;
    }
    const download = await fetcher(file.download_url);
    if (!download.ok) throw new Error(`Resend download answered ${download.status}`);
    const bytes = new Uint8Array(await download.arrayBuffer());
    const tooBig = rejectUpload(file.content_type, bytes.byteLength) !== null;
    files.push(tooBig ? { ...base, sizeBytes: bytes.byteLength, bytes: null } : { ...base, bytes });
  }
  return files;
}
