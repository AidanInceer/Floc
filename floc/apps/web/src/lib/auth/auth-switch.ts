import { localPath } from "@floc/core/text/local-path";

export function authSwitchHref(to: "/login" | "/signup", redirect: string | undefined): string {
  const back = localPath(redirect, "");
  return back ? `${to}?redirect=${encodeURIComponent(back)}` : to;
}
