"use client";

import { useLayoutEffect } from "react";
import type { ReactNode } from "react";

import { CANVAS_ZOOM_EVENT } from "@/components/globe/pixel-ratio";
import { Glyph } from "@/components/system/icons/landing";
import { cx } from "@/components/system/ui";
import { TourFrame } from "./tour-frame";
import type { SlideTone, TourSlide } from "./tour-slides";
import { useTour } from "./use-tour";
import "./feature-tour.css";

export type TourPanel = TourSlide & { shot: ReactNode };

const INK: Record<SlideTone, string> = {
  yellow: "text-pastel-yellow-ink",
  blue: "text-pastel-blue-ink",
  red: "text-pastel-red-ink",
  green: "text-pastel-green-ink",
};
const WASH: Record<SlideTone, string> = {
  yellow: "bg-pastel-yellow",
  blue: "bg-pastel-blue",
  red: "bg-pastel-red",
  green: "bg-pastel-green",
};

function Copy({ slide, fresh }: { slide: TourPanel; fresh: boolean }) {
  return (
    <div className="tour-text" data-fresh={fresh || undefined}>
      <span className="tour-rv grid size-[38px] place-items-center rounded-md bg-sheet/65">
        <Glyph name={slide.icon} className="size-[18px]" />
      </span>
      <h3 className="tour-rv mt-[22px] text-[clamp(1.6rem,3vw,2.1rem)] leading-[1.05] tracking-[-0.03em] text-ink">{slide.title}</h3>
      <p className="tour-rv mt-3.5 text-md text-ink-soft">{slide.line}</p>
      {slide.proExtra ? (
        <p className="tour-rv mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <Glyph name="star" className="size-[13px] shrink-0 text-pro-mark" />
          {slide.proExtra}
        </p>
      ) : null}
      <div className="tour-rv tour-was flex flex-col items-start gap-2">
        <span className="typed text-current">Instead of</span>
        <span className="tour-bub max-w-full rounded-md rounded-bl-sm bg-sheet px-3.5 py-2 text-md text-balance text-ink">&ldquo;{slide.before}&rdquo;</span>
      </div>
    </div>
  );
}

const arrow = "grid size-10 max-[560px]:size-11 place-items-center rounded-sm border border-rule-strong bg-sheet text-ink-soft transition-colors hover:border-pen hover:text-pen";

/** "Everything in one place": one drawn trip page that changes feature when you press an arrow or a tab. It never moves on its own. */
export function FeatureTour({ slides }: { slides: TourPanel[] }) {
  const tour = useTour(slides.length);
  const { refs, index, shown, rested, moved, go, step } = tour;

  useLayoutEffect(() => {
    const shot = refs.shot.current;
    if (!shot) return;
    const fit = () => {
      const z = (shot.clientWidth / 700).toFixed(3);
      if (shot.style.getPropertyValue("--z") === z) return;
      shot.style.setProperty("--z", z);
      shot.style.setProperty("--canvas-zoom", z);
      window.dispatchEvent(new Event(CANVAS_ZOOM_EVENT));
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(shot);
    return () => watch.disconnect();
  }, [refs.shot]);

  return (
    <div>
      <h2 className="band-title text-center">Everything in one place</h2>
      <div
        ref={refs.stage}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Features"
        {...tour.stageProps}
        className={cx("tour-stage", WASH[slides[rested].tone])}
      >
        <span ref={refs.wipe} aria-hidden className={cx("tour-wipe", WASH[slides[index].tone])} />
        <div ref={refs.text} className={cx("tour-copy", INK[slides[shown].tone])} aria-live="polite">
          {slides.map((s) => (
            <div key={s.key} aria-hidden inert className="tour-ghost">
              <Copy slide={s} fresh={false} />
            </div>
          ))}
          <Copy key={shown} slide={slides[shown]} fresh={moved} />
        </div>
        <div ref={refs.shot} className="tour-shot" aria-hidden>
          <TourFrame slides={slides} shown={shown} moved={moved} onPick={(i, from) => go(i, from)} />
        </div>
      </div>
      <div className="mt-[18px] flex items-center justify-center gap-2.5">
        <button type="button" aria-label="Previous feature" className={arrow} onClick={(e) => step(-1, e.currentTarget)}>
          <Glyph name="back" />
        </button>
        <span className="nums min-w-11 text-center text-sm text-ink-soft">
          {index + 1} / {slides.length}
        </span>
        <button type="button" aria-label="Next feature" className={arrow} onClick={(e) => step(1, e.currentTarget)}>
          <Glyph name="arrow" />
        </button>
      </div>
    </div>
  );
}
