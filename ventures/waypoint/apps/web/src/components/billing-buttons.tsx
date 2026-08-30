"use client";

/**
 * The two ways out of the billing panel (ticket 247) — start a checkout, or
 * open Stripe's portal. Both ask our own API for a one-off URL and then leave
 * the app, because neither URL can be printed into the page: a checkout
 * session is created per click, and a portal link is a short-lived credential.
 */
import { useState } from "react";
import type { ReactNode } from "react";

import Link from "next/link";

import { Button, ErrorText, cx } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { yearlySaving } from "@/lib/subscription-copy";
import type { Currency } from "@/lib/currency";
import type { BillingInterval } from "@/lib/plans";

export function BillingAction({
  path,
  body,
  children,
  variant = "secondary",
  className,
}: {
  path: string;
  body?: Record<string, string>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  /** Given, it replaces the shared button skin — the Pro block is gold. */
  className?: string;
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

  const label = busy ? "One moment…" : children;

  return (
    <span className={cx("flex flex-col gap-1", className ? "w-full" : "inline-flex")}>
      {className ? (
        <button type="button" onClick={go} disabled={busy} className={className}>
          {label}
        </button>
      ) : (
        <Button variant={variant} onClick={go} disabled={busy}>
          {label}
        </Button>
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </span>
  );
}

function messageOf(payload: unknown): string {
  return payload && typeof payload === "object" && "error" in payload
    ? String((payload as { error: unknown }).error)
    : "That didn't work.";
}

/**
 * The Pro block's two ways in (ticket 250). One button per interval, so
 * choosing and buying are the same press — no picker to set first.
 *
 * Yearly leads because it is the better deal; monthly sits beside it in the
 * quieter skin rather than underneath, so neither reads as the small print.
 *
 * `canBuy` false — signed out, or already Pro — makes both buttons links: a
 * checkout needs an account to attach the subscription to.
 */
export function ProUpgrade({
  prices,
  canBuy,
  href,
}: {
  prices: { interval: BillingInterval; amountMinor: number; currency: Currency }[];
  canBuy: boolean;
  href: string;
}) {
  const monthly = prices.find((p) => p.interval === "monthly");
  const yearly = prices.find((p) => p.interval === "yearly");

  const saving =
    monthly && yearly
      ? yearlySaving(monthly.amountMinor, yearly.amountMinor)
      : null;

  // No prices to quote — still sell Pro, just without the figures.
  if (!monthly && !yearly) {
    return (
      <Link href={href} className={cx(proButtonBase, proButtonLead)}>
        Upgrade now
      </Link>
    );
  }

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {yearly ? (
        <ProButton
          price={yearly}
          caption={saving ? `a year · save ${saving}%` : "a year"}
          skin={proButtonLead}
          canBuy={canBuy}
          href={href}
        />
      ) : null}
      {monthly ? (
        <ProButton
          price={monthly}
          caption="a month"
          skin={proButtonQuiet}
          canBuy={canBuy}
          href={href}
        />
      ) : null}
    </div>
  );
}

// A fixed height, so "One moment…" — one line where the price is two — does
// not shrink the button it replaces.
const proButtonBase =
  "lift flex h-[4.75rem] w-full items-center justify-center rounded-md px-6 text-center transition-colors";
const proButtonLead = "bg-pro-gold text-pro";
const proButtonQuiet =
  "border border-pro-gold bg-transparent text-pro-ink hover:bg-pro-2";

function ProButton({
  price,
  caption,
  skin,
  canBuy,
  href,
}: {
  price: { interval: BillingInterval; amountMinor: number; currency: Currency };
  caption: string;
  skin: string;
  canBuy: boolean;
  href: string;
}) {
  const face = (
    <span className="flex flex-col items-center gap-0.5">
      <span className="font-display text-md font-semibold tracking-tight">
        {formatMoney(price.amountMinor, price.currency)}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
        {caption}
      </span>
    </span>
  );

  if (!canBuy) {
    return (
      <Link href={href} className={cx(proButtonBase, skin)}>
        {face}
      </Link>
    );
  }

  return (
    <BillingAction
      path="/api/billing/checkout"
      body={{ interval: price.interval }}
      className={cx(proButtonBase, skin, "disabled:opacity-70")}
    >
      {face}
    </BillingAction>
  );
}
