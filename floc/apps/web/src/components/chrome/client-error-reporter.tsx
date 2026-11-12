"use client";

import { useEffect } from "react";

import { clientErrorBeacon } from "@/lib/client-error/beacon";

/** Sends uncaught browser errors to `/api/client-error`. Draws nothing. */
export function ClientErrorReporter() {
  useEffect(() => {
    const beacon = clientErrorBeacon(
      (body) => navigator.sendBeacon("/api/client-error", body),
      () => window.location.pathname,
    );
    const onError = (event: ErrorEvent) => beacon.report(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => beacon.report(event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
