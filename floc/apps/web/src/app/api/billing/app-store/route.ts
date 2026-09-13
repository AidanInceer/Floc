/** Apple's App Store Server Notifications V2. The signature on the payload is the whole of the trust. */
import { applyAppStoreNotification } from "@/server/billing/store/store-notifications";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  return new Response(null, { status: await applyAppStoreNotification(body) });
}
