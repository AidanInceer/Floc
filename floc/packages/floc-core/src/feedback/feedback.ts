export const FEEDBACK_SURFACES = ["web", "ios", "android"] as const;
export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number];

export type FeedbackResult = "sent" | "empty" | "limited" | "failed" | "closed";

export const FEEDBACK_SENT = "Sent. Thank you.";

export const FEEDBACK_PROBLEMS: Record<Exclude<FeedbackResult, "sent">, string> = {
  empty: "Write a few words first.",
  limited: "That's a lot of feedback at once. Try again in a few minutes.",
  failed: "That didn't send. Your words are still here; try again.",
  closed: "Feedback is not set up yet. Email us instead.",
};

export function feedbackPage(raw: unknown): string {
  if (typeof raw !== "string") return "unknown";
  const path = raw.split(/[?#]/)[0].trim();
  return /^\/[\w\-./()[\]@~%]*$/.test(path) ? path.slice(0, 200) : "unknown";
}
