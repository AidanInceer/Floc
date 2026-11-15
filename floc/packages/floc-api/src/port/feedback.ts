/** The feedback half of the port (#271). */
import type { FeedbackResult, FeedbackSurface } from "@floc/core/feedback/feedback";

export type FeedbackPort = {
  /** One message to Floc's own mailbox. Never throws for a failed send: the client keeps the words and says why. */
  sendFeedback(
    viewer: { id: string; name: string; email: string },
    input: { message: string; page: string; surface: FeedbackSurface; appVersion: string },
  ): Promise<FeedbackResult>;
};
