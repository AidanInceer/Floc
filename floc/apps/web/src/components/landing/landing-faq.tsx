import type { FaqItem, FaqKey } from "@/lib/landing/faq";

import { Glyph, type GlyphName } from "./landing-glyph";
import "./landing-faq.css";

/** Each question's tile: the pastel of the part of Floc it is about. */
const TILE: Record<FaqKey, { tone: string; glyph: GlyphName }> = {
  free: { tone: "yellow", glyph: "check" },
  account: { tone: "blue", glyph: "people" },
  booking: { tone: "red", glyph: "files" },
  money: { tone: "green", glyph: "money" },
  pro: { tone: "pro", glyph: "weather" },
};

/** The question first (ADR-024). One answer open at a time; `name` makes the details an exclusive group, no script. */
export function LandingFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;

  return (
    <div className="landing-faq-wrap">
      <h2 className="band-title landing-faq-title" id="landing-faq-heading">
        Before you ask
      </h2>
      <div
        className="landing-faq-list"
        role="group"
        aria-labelledby="landing-faq-heading"
      >
        {items.map((item, i) => (
          <details
            key={item.key}
            name="landing-faq"
            open={i === 0}
            className="landing-faq-row"
          >
            <summary>
              <span
                className="landing-faq-tile"
                data-tone={TILE[item.key].tone}
              >
                <Glyph name={TILE[item.key].glyph} className="size-[15px]" />
              </span>
              <span className="landing-faq-q">{item.question}</span>
              <span className="landing-faq-plus" aria-hidden>
                <Glyph name="plus" className="size-3.5" />
              </span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
