/** Called every 5 minutes by the Railway cron (`scripts/cron-push.mjs`): reminders, then push, then the email fallback (#346). */
import { sendEmails } from "@/server/auth/email";
import { isCronCaller } from "@/server/notifications/cron-caller";
import { sendDueEmails } from "@/server/notifications/email-fallback";
import { sendExpoPushes } from "@/server/notifications/expo-push";
import { sendDuePushes } from "@/server/notifications/push";
import { sendDueReminders } from "@/server/notifications/reminders";

export const runtime = "nodejs";

/** Why: one channel failing (Expo down) must not stop the others from sending. */
async function attempt(name: string, work: () => Promise<number>): Promise<number | null> {
  try {
    return await work();
  } catch (error) {
    console.error(`[cron] ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isCronCaller(request.headers.get("authorization"))) return new Response(null, { status: 404 });
  const result = {
    reminders: await attempt("reminders", () => sendDueReminders()),
    pushes: await attempt("push", () => sendDuePushes(sendExpoPushes)),
    emails: await attempt("email", () => sendDueEmails(sendEmails)),
  };
  const failed = Object.values(result).includes(null);
  return Response.json(result, { status: failed ? 500 : 200 });
}
