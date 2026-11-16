import type { FeedbackResult, FeedbackSurface } from "@floc/core/feedback/feedback";

export type FeedbackPort = {
  sendFeedback(
    viewer: { id: string; name: string; email: string },
    input: { message: string; page: string; surface: FeedbackSurface; appVersion: string },
  ): Promise<FeedbackResult>;
};
