/**
 * Everything Floc puts on a device, for the Cookies page (#368). The page draws this list, and a test holds it
 * to what the code sets, so the page cannot say less than the app does.
 */
import { CONSENT_COOKIE, CONSENT_DAYS } from "@floc/core/consent/consent";
import { LIVE_CACHE_PREFIX } from "@floc/core/notes/live/live-epoch";

import { THEME_STORAGE_KEY } from "@/lib/theme";

import { FUNCTIONAL_KEYS } from "../storage/functional-keys";

export type StoredThing = {
  name: string;
  kind: "Cookie" | "Local storage" | "Session storage" | "Browser database";
  category: "necessary" | "functional";
  purpose: string;
  lasts: string;
  /** A cookie's longest life in days. Null for storage with no clock, which stays until the event in `lasts`. */
  days: number | null;
};

export const STORAGE_LIST: StoredThing[] = [
  { name: "better-auth.session_token", kind: "Cookie", category: "necessary", purpose: "Keeps you signed in.", lasts: "60 days", days: 60 },
  { name: "better-auth.session_data", kind: "Cookie", category: "necessary", purpose: "A short copy of your session, so pages load faster.", lasts: "5 minutes", days: 1 },
  { name: "better-auth.state", kind: "Cookie", category: "necessary", purpose: "Holds your place while you sign in with Google.", lasts: "10 minutes", days: 1 },
  { name: CONSENT_COOKIE, kind: "Cookie", category: "necessary", purpose: "Remembers the choice you make on this page.", lasts: "12 months", days: CONSENT_DAYS },
  { name: THEME_STORAGE_KEY, kind: "Local storage", category: "necessary", purpose: "The theme you picked, light or dark.", lasts: "Until you pick Auto", days: null },
  { name: "floc.bookings.asked", kind: "Session storage", category: "necessary", purpose: "Remembers that you answered which trip a forwarded booking belongs to.", lasts: "Until you close the tab", days: null },
  { name: `${LIVE_CACHE_PREFIX}…`, kind: "Browser database", category: "necessary", purpose: "A copy of the notes page you have open, so an edit is not lost when the connection drops.", lasts: "Until you sign out", days: null },
  { name: FUNCTIONAL_KEYS[0], kind: "Local storage", category: "functional", purpose: "How you last sorted Ideas.", lasts: "Until you turn this off", days: null },
];
