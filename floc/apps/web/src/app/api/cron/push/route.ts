/** Called every 5 minutes by the Railway cron (`scripts/cron-push.mjs`). */
import { isCronCaller } from "@/server/notifications/cron-caller";
import { sendExpoPushes } from "@/server/notifications/expo-push";
import { sendDuePushes } from "@/server/notifications/push";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isCronCaller(request.headers.get("authorization"))) return new Response(null, { status: 404 });
  const sent = await sendDuePushes(sendExpoPushes);
  return Response.json({ sent });
}
