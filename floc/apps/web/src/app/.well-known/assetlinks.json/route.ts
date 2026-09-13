import { assetLinks } from "@/lib/app-links";

export function GET(): Response {
  const body = assetLinks(process.env.ANDROID_CERT_SHA256);
  return body ? Response.json(body) : new Response(null, { status: 404 });
}
