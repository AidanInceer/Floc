"use client";

import { useState } from "react";

import type { Currency } from "@/db/schema";
import {
  convertMinor,
  formatMoney,
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
        {formatMoney(
          showHome ? homeMinor : amountMinor,
          showHome ? home : currency,
        )}
      </span>
      <style>{`@keyframes fadeSwap{from{opacity:.3}to{opacity:1}}`}</style>
    </button>
  );
}

