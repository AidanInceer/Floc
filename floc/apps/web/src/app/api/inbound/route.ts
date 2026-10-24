/**
 * Resend's received-email webhook (#328, ADR-027). The signature check is the
 * whole security of this route: without it anyone could post files into a
 * trip, so an unsigned body is refused before its JSON is read.
 */
import { documentsEnabled } from "@/server/documents/document-store";
import { receiveBookingMail } from "@/server/documents/inbound/booking-mail";
import { resendAttachments } from "@/server/documents/inbound/resend-attachments";
import { webhookSigned } from "@/server/documents/inbound/webhook-signature";
import { sendEmails } from "@/server/auth/email";

export const runtime = "nodejs";

type Received = {
  type: string;
  data: { email_id: string; from: string; to?: string[]; received_for?: string[]; subject?: string };
};

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey || !process.env.FLOC_INBOUND_DOMAIN || !documentsEnabled()) {
    return new Response("Not configured", { status: 503 });
  }

  const body = await request.text();
  if (!webhookSigned(body, request.headers, secret)) {
    return new Response("Bad signature", { status: 400 });
  }

  const event = JSON.parse(body) as Received;
  if (event.type !== "email.received") return new Response("ok");

  const { data } = event;
  await receiveBookingMail(
    {
      from: data.from,
      to: [...(data.to ?? []), ...(data.received_for ?? [])],
      subject: data.subject ?? "",
    },
    { loadAttachments: () => resendAttachments(data.email_id, apiKey), send: sendEmails },
  );
  return new Response("ok");
}
