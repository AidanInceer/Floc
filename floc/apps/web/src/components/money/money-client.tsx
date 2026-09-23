"use client";

// The money tab's display-only currency convert toggle (money overhaul).
import { useState } from "react";

import type { Currency } from "@/db/schema";
import {
  convertMinor,
  formatMoney,
  formatTicker,
} from "@floc/core/money/money";

function SwapGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4.5h8L8.4 2.9M12 9.5H4l1.6 1.6" />
    </svg>
  );
}

/**
 * Shows an amount in its ledger currency; if the viewer's home currency
 * differs and a rate is available, a swap glyph flips the display to home
 * (money overhaul). Display only — the stored amount never changes. Absent a
 * rate, the glyph doesn't render and only the real amount shows (rule 11).
 */
export function ConvertAmount({
  amountMinor,
  currency,
  home,
  rate,
  className,
}: {
  amountMinor: number;
  currency: Currency;
  home: Currency;
  /** Home-per-unit multiplier, or null when unavailable. */
  rate: number | null;
  className?: string;
}) {
  const [showHome, setShowHome] = useState(false);
  const canConvert = rate !== null && home !== currency;

  if (!canConvert) {
    return (
      <span className={className}>{formatMoney(amountMinor, currency)}</span>
    );
  }

  const homeMinor = convertMinor(amountMinor, currency, home, rate as number);

  return (
    <button
      type="button"
      onClick={() => setShowHome((v) => !v)}
      className={className}
      title={showHome ? "Show recorded amount" : `Show in ${home}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}
    >
      <span className="text-ink-faint transition-transform hover:text-pen">
        <SwapGlyph />
      </span>
      <span
        key={showHome ? "home" : "orig"}
        style={{ animation: "fadeSwap .18s ease" }}
      >
        {formatTicker(
          showHome ? homeMinor : amountMinor,
          showHome ? home : currency,
        )}
      </span>
      <style>{`@keyframes fadeSwap{from{opacity:.3}to{opacity:1}}`}</style>
    </button>
  );
}

