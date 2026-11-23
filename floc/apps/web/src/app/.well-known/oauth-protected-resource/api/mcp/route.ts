import { auth } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return auth.handler(request);
}
