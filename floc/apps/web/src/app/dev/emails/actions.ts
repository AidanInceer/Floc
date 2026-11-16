"use server";

import { notFound } from "next/navigation";

import { requireUser } from "@/server/access";
import { sendEmails } from "@/server/auth/email";
import { emailPreviewOpen, sendSampleTo } from "@/server/email/dev-preview";

export type SendResult = "Sent" | "Not sent" | null;

export async function sendSampleToMe(_previous: SendResult, formData: FormData): Promise<SendResult> {
  if (!emailPreviewOpen()) notFound();
  const me = await requireUser("/dev/emails");
  return (await sendSampleTo(String(formData.get("key") ?? ""), me.email, sendEmails)) ? "Sent" : "Not sent";
}
