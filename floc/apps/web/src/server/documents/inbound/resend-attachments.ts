/**
 * The files on an email Resend received (#328). The webhook carries only their
 * names; the bytes sit behind a list call and a one-hour download link each.
 * Plain `fetch`, because the installed `resend` SDK predates receiving.
 */
import "server-only";

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

  return Promise.all(
    data.map(async (file) => {
      const base = {
        filename: file.filename,
        contentType: file.content_type,
        inline: file.content_disposition === "inline",
        sizeBytes: file.size,
      };
      // Why: what would be refused anyway is never pulled into memory.
      if (rejectUpload(file.content_type, file.size)) return { ...base, bytes: null };
      const download = await fetcher(file.download_url);
      if (!download.ok) throw new Error(`Resend download answered ${download.status}`);
      return { ...base, bytes: new Uint8Array(await download.arrayBuffer()) };
    }),
  );
}
