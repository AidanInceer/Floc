import "server-only";

import { feedbackPage, type FeedbackResult, type FeedbackSurface } from "@floc/core/feedback/feedback";
import { TEXT_CAPS, asText } from "@floc/core/text/text";

import { CONTACT_EMAIL } from "@/lib/legal/facts";
import { emailConfigured, emails, sendEmails } from "@/server/auth/email";
import { writeLimiter } from "@/server/http/write-limiter";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";

type Sender = { id: string; name: string; email: string };
type Words = { message: unknown; page: unknown; surface: FeedbackSurface; appVersion: unknown };

export function feedbackOpen(): boolean {
  return emailConfigured() || process.env.NODE_ENV !== "production";
}

const processState = globalThis as typeof globalThis & { flocFeedbackSenders?: ReturnType<typeof writeLimiter> };
const senders = (processState.flocFeedbackSenders ??= writeLimiter({ capacity: 5, perSecond: 1 / 720 }));

const defaults = { send: sendEmails, limiter: senders, open: feedbackOpen };

export async function sendFeedback(from: Sender, words: Words, { send, limiter, open } = defaults): Promise<FeedbackResult> {
  const message = asText(words.message).trim().slice(0, TEXT_CAPS.feedback);
  if (!message) return "empty";
  if (!open()) return "closed";
  if (!limiter.allow(from.id)) return "limited";

  const version = asText(words.appVersion).trim().slice(0, 40) || "unknown";
  try {
    const accepted = await send([
      emails.feedback({
        to: process.env.FEEDBACK_TO || CONTACT_EMAIL,
        from,
        message,
        page: feedbackPage(words.page),
        surface: `${words.surface} ${version}`,
      }),
    ]);
    if (accepted.every(Boolean)) {
      log.info("feedback.sent", { surface: words.surface });
      return "sent";
    }
  } catch (error) {
    log.warn("feedback.failed", describeError(error));
    return "failed";
  }
  log.warn("feedback.failed", { surface: words.surface });
  return "failed";
}
