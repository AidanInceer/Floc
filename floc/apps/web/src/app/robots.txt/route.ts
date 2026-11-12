import { appUrl } from "@/lib/env";
import { robotsTxt } from "@/lib/seo/public-pages";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(robotsTxt(appUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
