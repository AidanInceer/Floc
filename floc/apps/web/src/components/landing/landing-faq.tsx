"use client";

import { useState, type CSSProperties } from "react";
import type { FaqItem } from "@/lib/landing/faq";

import { cx } from "@/components/system/ui";
import { Glyph } from "./landing-glyph";

export function LandingFaq({ items }: { items: FaqItem[] }) {
  const [selectedKey, setSelectedKey] = useState(items[0]?.key ?? "");
  const activeIndex = Math.max(0, items.findIndex((item) => item.key === selectedKey));
  const active = items[activeIndex];

  if (!active) return null;

  return (
    <div style={{ "--faq-rows": items.length } as CSSProperties}>
      <h2 className="band-title">Before you ask</h2>
      <div className="mt-7 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)] md:gap-7">
        <div className="border-t border-rule" role="group" aria-label="Questions">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={index === activeIndex}
              aria-controls="landing-faq-answer"
              onClick={() => setSelectedKey(item.key)}
              className={cx(
                "grid min-h-[68px] w-full grid-cols-[38px_minmax(0,1fr)_16px] items-center gap-3 border-b border-rule text-left font-display text-lg font-semibold tracking-tight transition-colors hover:bg-sheet-2 hover:text-pen",
                index === activeIndex && "bg-sheet-2 text-pen",
              )}
            >
              <span className="font-mono text-[11px] font-normal text-ink-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.question}</span>
              <Glyph name="arrow" className="size-4 text-ink-faint" />
            </button>
          ))}
        </div>
        <div
          id="landing-faq-answer"
          aria-live="polite"
          aria-atomic="true"
          className="h-80 overflow-y-auto rounded-[22px] bg-pastel-blue px-6 py-6 sm:px-8 sm:py-8 md:h-[calc(var(--faq-rows)*4.25rem)]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-pastel-blue-ink">
            Answer / {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-4 font-display text-[clamp(1.6rem,2.8vw,2.25rem)] font-semibold leading-tight tracking-[-0.035em]">
            {active.question}
          </h3>
          <p className="mt-3 max-w-[52ch] text-md leading-relaxed text-ink-soft">{active.answer}</p>
        </div>
      </div>
    </div>
  );
}
