/** Android has no built-in handler for webcal links, so Google Calendar takes them (#334). */
export function subscribeUrl(feedUrl: string, platform: "ios" | "android"): string {
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  return platform === "ios"
    ? webcal
    : `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
}
