import { applyAppStoreNotification } from "@/server/billing/store/store-notifications";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  return new Response(null, { status: await applyAppStoreNotification(body) });
}
