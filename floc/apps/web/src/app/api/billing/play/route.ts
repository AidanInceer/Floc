/** Google Play real-time developer notifications, pushed by Pub/Sub with a signed ID token. */
import { applyPlayNotification } from "@/server/billing/store/store-notifications";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const status = await applyPlayNotification(request.headers.get("authorization"), body);
  return new Response(null, { status });
}
