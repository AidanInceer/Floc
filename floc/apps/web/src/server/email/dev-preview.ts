import type { OutboundEmail } from "./model";
import { EMAIL_SAMPLES } from "./samples";

/** The preview of every email (#653) is for development: production never serves it, whatever else is set. */
export function emailPreviewOpen(): boolean {
  return process.env.NODE_ENV !== "production";
}

type Send = (batch: OutboundEmail[]) => Promise<boolean[]>;

/** Sends one sample to the signed-in address, with no reply-to, so a test mail never answers someone else. */
export async function sendSampleTo(key: string, to: string, send: Send): Promise<boolean> {
  const sample = EMAIL_SAMPLES.find((s) => s.key === key);
  if (!sample) return false;
  const [ok] = await send([{ ...sample.build(to), to, replyTo: undefined }]);
  return ok;
}
