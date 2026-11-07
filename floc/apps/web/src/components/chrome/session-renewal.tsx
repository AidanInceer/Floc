"use client";

import { useEffect } from "react";

import { renewSessionCache } from "@/lib/auth-client";
import { CHECK_EVERY_MS, sessionRenewal } from "@/lib/session-renewal";

/** Keeps a signed-in tab's session cookie cache fresh, so page loads skip the session lookup. Draws nothing. */
export function SessionRenewal() {
  useEffect(() => {
    const renewal = sessionRenewal(renewSessionCache, () => Date.now());
    const check = () => void renewal.check(document.visibilityState === "visible");
    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return null;
}
