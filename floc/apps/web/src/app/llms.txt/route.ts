import { appUrl } from "@/lib/env";

import { llmsTxt } from "./llms-txt";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsTxt(appUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
