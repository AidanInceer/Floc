import { START_TRIP_HREF, phoneRoute } from "@floc/core/notifications/notification-href";

/** Why: a regex, not `URL` — React Native's `URL` leaves `host` and `pathname` unimplemented. */
const WEB_LINK = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/;

/** Why: Start a trip is told apart by its query, so it is matched before the query is dropped (#626). */
const route = (path: string) => phoneRoute(path === START_TRIP_HREF ? path : path.split(/[?#]/)[0]);

/** The route a link opens (#346): one to this site becomes the phone's own route; anything else passes through. */
export function appLinkPath(path: string, host: string | null): string {
  if (path.startsWith("/")) return route(path);
  const match = path.match(WEB_LINK);
  if (match && host && match[1] === host) return route((match[2] ?? "/") + path.slice(match[0].length));
  return path;
}
