/**
 * Feedback from a signed-in member to Floc's own mailbox (#271). Nothing is stored: the mail is the record.
 * The message is never logged (ADR-046).
 */
import "server-only";

import { feedbackPage, type FeedbackResult, type FeedbackSurface } from "@floc/core/feedback/feedback";
import { TEXT_CAPS, asText } from "@floc/core/text/text";

import { CONTACT_EMAIL } from "@/lib/legal/facts";
import { emailConfigured, sendEmails } from "@/server/auth/email";
import { writeLimiter } from "@/server/http/write-limiter";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";

type Sender = { id: string; name: string; email: string };
type Words = { message: unknown; page: unknown; surface: FeedbackSurface; appVersion: unknown };

/** Why (rule 11): with no mail provider a send only reaches the server log, so in production the form hides. */
export function feedbackOpen(): boolean {
  return emailConfigured() || process.env.NODE_ENV !== "production";
}

// Why: five at once, then one every twelve minutes for each person, so the mailbox cannot be flooded from one account.
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
      {
        to: process.env.FEEDBACK_TO || CONTACT_EMAIL,
        replyTo: from.email,
        subject: `Feedback from ${from.name}`,
        lines: [
          ...message.split(/\n+/).map((line) => line.trim()).filter(Boolean),
          `From ${from.name}, ${from.email}, user ${from.id}`,
          `Page ${feedbackPage(words.page)}`,
          `${words.surface} ${version}`,
        ],
      },
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
