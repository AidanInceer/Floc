import { appleAssociation } from "@/lib/app-links";

export function GET(): Response {
  const body = appleAssociation(process.env.APPLE_TEAM_ID);
  return body ? Response.json(body) : new Response(null, { status: 404 });
}
