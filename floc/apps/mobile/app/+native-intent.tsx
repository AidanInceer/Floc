/** Every link the system hands the app passes through here first (#346): an emailed web link opens its screen. */
import { API_BASE_URL } from "@/lib/config";
import { appLinkPath } from "@/lib/links/app-link";

const host = API_BASE_URL.match(/^https?:\/\/([^/?#]+)/)?.[1] ?? null;

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return appLinkPath(path, host);
}
