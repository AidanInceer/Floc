import "server-only";

import { CONSENT_COOKIE, readConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

import { cookieValue } from "@/lib/consent/consent-cookie";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";

import { recordEvent } from "./analytics";

const MAX_BYTES = 1_000;

export async function receiveEvent(request: Request): Promise<Response> {
  const done = new Response(null, { status: 204 });
  const consent = readConsent(cookieValue(request.headers.get("cookie"), CONSENT_COOKIE), today());
  if (!consent?.analytics) return done;
  try {
    const text = await request.text();
    if (text.length > MAX_BYTES) return done;
    const seen = JSON.parse(text) as { name?: unknown; path?: unknown } | null;
    await recordEvent({ name: seen?.name, surface: "web", path: seen?.path }, consent);
  } catch (error) {
    if (!(error instanceof SyntaxError)) log.warn("analytics.failed", describeError(error));
  }
  return done;
}
