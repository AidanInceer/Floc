import { phoneRoute } from "@floc/core/notifications/notification-href";

/** Why: a regex, not `URL` — React Native's `URL` leaves `host` and `pathname` unimplemented. */
const WEB_LINK = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/;

/** The route a link opens (#346): one to this site becomes the phone's own route; anything else passes through. */
export function appLinkPath(path: string, host: string | null): string {
  if (path.startsWith("/")) return phoneRoute(path.split(/[?#]/)[0]);
  const match = path.match(WEB_LINK);
  if (match && host && match[1] === host) return phoneRoute(match[2] ?? "/");
  return path;
}
