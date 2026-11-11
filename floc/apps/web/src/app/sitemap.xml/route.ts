import { appUrl } from "@/lib/env";
import { sitemapXml } from "@/lib/seo/public-pages";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(sitemapXml(appUrl()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
