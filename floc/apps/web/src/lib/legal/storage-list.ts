import { ANALYTICS_KEEP_DAYS } from "@floc/core/analytics/events";
import { CONSENT_CATEGORIES, CONSENT_COOKIE, CONSENT_DAYS } from "@floc/core/consent/consent";
import { LIVE_CACHE_PREFIX } from "@floc/core/notes/live/live-epoch";

import { MOTION_STORAGE_KEY } from "@/lib/motion/still";
import { THEME_STORAGE_KEY } from "@/lib/theme";

import { FUNCTIONAL_KEYS, FUNCTIONAL_PREFIXES } from "../storage/functional-keys";

export type StoredThing = {
  name: string;
  kind: "Cookie" | "Local storage" | "Session storage" | "Browser database";
  category: "necessary" | "functional";
  purpose: string;
  lasts: string;
  days: number | null;
};

export const STORAGE_LIST: StoredThing[] = [
  { name: "better-auth.session_token", kind: "Cookie", category: "necessary", purpose: "Keeps you signed in.", lasts: "60 days", days: 60 },
  { name: "better-auth.session_data", kind: "Cookie", category: "necessary", purpose: "A short copy of your session, so pages load faster.", lasts: "5 minutes", days: 1 },
  { name: "better-auth.state", kind: "Cookie", category: "necessary", purpose: "Holds your place while you sign in with Google.", lasts: "10 minutes", days: 1 },
  { name: CONSENT_COOKIE, kind: "Cookie", category: "necessary", purpose: "Remembers the choice you make on this page.", lasts: "12 months", days: CONSENT_DAYS },
  { name: THEME_STORAGE_KEY, kind: "Local storage", category: "necessary", purpose: "The theme you picked, light or dark.", lasts: "Until you pick Auto", days: null },
  { name: MOTION_STORAGE_KEY, kind: "Local storage", category: "necessary", purpose: "That you turned animations off on Explore before signing in.", lasts: "Until you turn them back on", days: null },
  { name: "floc.bookings.asked", kind: "Session storage", category: "necessary", purpose: "Remembers that you answered which trip a forwarded booking belongs to.", lasts: "Until you close the tab", days: null },
  { name: `${LIVE_CACHE_PREFIX}…`, kind: "Browser database", category: "necessary", purpose: "A copy of the notes page you have open, so an edit is not lost when the connection drops.", lasts: "Until you sign out", days: null },
  { name: FUNCTIONAL_KEYS[0], kind: "Local storage", category: "functional", purpose: "How you last sorted Ideas.", lasts: "Until you turn this off", days: null },
  { name: `${FUNCTIONAL_PREFIXES[0]}…`, kind: "Local storage", category: "functional", purpose: "Which headings you folded on a notes page.", lasts: "Until you turn this off", days: null },
];

const months = (days: number) => Math.round(days / 30.4);
const longestNecessaryCookie = Math.max(...STORAGE_LIST.filter((s) => s.category === "necessary" && s.kind === "Cookie").map((s) => s.days ?? 0));

const CATEGORY_TERMS: Record<(typeof CONSENT_CATEGORIES)[number]["key"], { examples: string; duration: string; consent: string }> = {
  necessary: {
    examples: "Sign-in session cookies, the record of your cookie preferences, your chosen theme and animation setting, and a temporary copy of an open notes page.",
    duration: `From the end of your visit up to ${months(longestNecessaryCookie)} months`,
    consent: "Not required",
  },
  functional: {
    examples: "Local storage that remembers how you sort Ideas and which sections you collapse in Notes.",
    duration: "Until you withdraw consent",
    consent: "Required",
  },
  analytics: {
    examples: "No cookie and no storage on your device. Each count is recorded on our server only.",
    duration: `Counts are deleted after ${months(ANALYTICS_KEEP_DAYS)} months`,
    consent: "Required",
  },
};

export const STORAGE_CATEGORIES = CONSENT_CATEGORIES.map((category) => ({ ...category, ...CATEGORY_TERMS[category.key] }));
