import { localPath } from "@floc/core/text/local-path";

/** Why: switching between sign in and sign up lost the trip you came for (#572). */
export function authSwitchHref(to: "/login" | "/signup", redirect: string | undefined): string {
  const back = localPath(redirect, "");
  return back ? `${to}?redirect=${encodeURIComponent(back)}` : to;
}
