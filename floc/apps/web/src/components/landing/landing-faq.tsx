import type { FaqItem } from "@/lib/landing/faq";

import { Glyph } from "./landing-glyph";

export function LandingFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <h2 className="band-title">Before you ask</h2>
      <div className="border-t border-rule">
        {items.map((q) => (
          <details key={q.key} className="landing-faq group border-b border-rule">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-lg font-semibold tracking-tight">
              {q.question}
              <Glyph name="plus" className="size-4 shrink-0 text-ink-soft transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="max-w-[60ch] pb-6 text-ink-soft">{q.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
