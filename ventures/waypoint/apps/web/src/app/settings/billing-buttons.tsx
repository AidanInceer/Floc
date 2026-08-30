"use client";

/**
 * The two ways out of the billing panel (ticket 247) — start a checkout, or
 * open Stripe's portal. Both ask our own API for a one-off URL and then leave
 * the app, because neither URL can be printed into the page: a checkout
 * session is created per click, and a portal link is a short-lived credential.
 */
import { useState } from "react";

import { Button, ErrorText } from "@/components/ui";

export function BillingAction({
  path,
  body,
  children,
  variant = "secondary",
}: {
  path: string;
  body?: Record<string, string>;
  children: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload: unknown = await response.json().catch(() => null);
      const url =
        payload && typeof payload === "object" && "url" in payload
          ? String((payload as { url: unknown }).url)
          : null;

      if (!url) throw new Error(messageOf(payload));
      window.location.href = url;
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "That didn't work.");
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button variant={variant} onClick={go} disabled={busy}>
        {busy ? "One moment…" : children}
      </Button>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </span>
  );
}

function messageOf(payload: unknown): string {
  return payload && typeof payload === "object" && "error" in payload
    ? String((payload as { error: unknown }).error)
    : "That didn't work.";
}
