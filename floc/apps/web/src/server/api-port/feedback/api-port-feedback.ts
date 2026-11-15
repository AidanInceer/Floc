import "server-only";

import type { FlocPort } from "@floc/api/port";

import { sendFeedback } from "@/server/feedback/feedback";

export const feedbackPort: Pick<FlocPort, "sendFeedback"> = {
  sendFeedback: (viewer, input) => sendFeedback(viewer, input),
};
