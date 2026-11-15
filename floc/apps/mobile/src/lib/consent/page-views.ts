/** What the phone sends for a screen view (#368): nothing at all without a yes to analytics. */
import type { ConsentChoice } from "@floc/core/consent/consent";

export type ScreenView = { name: "page.view"; path: string; surface: "ios" | "android" };

export function screenView(path: string, os: string, consent: ConsentChoice): ScreenView | null {
  if (!consent.analytics) return null;
  return { name: "page.view", path, surface: os === "ios" ? "ios" : "android" };
}
