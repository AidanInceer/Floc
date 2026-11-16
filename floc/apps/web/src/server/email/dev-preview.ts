import type { OutboundEmail } from "./model";
import { EMAIL_SAMPLES } from "./samples";

export function emailPreviewOpen(): boolean {
  return process.env.NODE_ENV !== "production";
}

type Send = (batch: OutboundEmail[]) => Promise<boolean[]>;

export async function sendSampleTo(key: string, to: string, send: Send): Promise<boolean> {
  const sample = EMAIL_SAMPLES.find((s) => s.key === key);
  if (!sample) return false;
  const [ok] = await send([{ ...sample.build(to), to, replyTo: undefined }]);
  return ok;
}
