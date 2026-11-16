import { START_TRIP_HREF, phoneRoute } from "@floc/core/notifications/notification-href";

const WEB_LINK = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/;

const route = (path: string) => phoneRoute(path === START_TRIP_HREF ? path : path.split(/[?#]/)[0]);

export function appLinkPath(path: string, host: string | null): string {
  if (path.startsWith("/")) return route(path);
  const match = path.match(WEB_LINK);
  if (match && host && match[1] === host) return route((match[2] ?? "/") + path.slice(match[0].length));
  return path;
}
