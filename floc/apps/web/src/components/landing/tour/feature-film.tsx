"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode, RefObject } from "react";

import { cx } from "@/components/system/ui";
import { nearestSlide, stepSlide } from "@/lib/landing/carousel";

import { Glyph } from "../landing-glyph";
import type { SlideTone, TourSlide } from "./tour-slides";

export type FilmSlide = TourSlide & { shot: ReactNode };

const TONE: Record<SlideTone, { slide: string; chip: string }> = {
  yellow: { slide: "bg-pastel-yellow text-pastel-yellow-ink", chip: "bg-pastel-yellow text-pastel-yellow-ink border-pastel-yellow-edge" },
  blue: { slide: "bg-pastel-blue text-pastel-blue-ink", chip: "bg-pastel-blue text-pastel-blue-ink border-pastel-blue-edge" },
  red: { slide: "bg-pastel-red text-pastel-red-ink", chip: "bg-pastel-red text-pastel-red-ink border-pastel-red-edge" },
  green: { slide: "bg-pastel-green text-pastel-green-ink", chip: "bg-pastel-green text-pastel-green-ink border-pastel-green-edge" },
};

function useFilm(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const starts = useCallback(() => {
    const slides = [...(track.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? [])];
    const first = slides[0]?.offsetLeft ?? 0;
    return slides.map((s) => s.offsetLeft - first);
  }, []);

  const go = useCallback(
    (i: number) => {
      const node = track.current;
      if (!node) return;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      node.scrollTo({ left: starts()[stepSlide(i, 0, count)] ?? 0, behavior: still ? "auto" : "smooth" });
    },
    [count, starts],
  );

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const sync = () => setCurrent(nearestSlide(starts(), node.scrollLeft));
    node.addEventListener("scroll", sync, { passive: true });
    return () => node.removeEventListener("scroll", sync);
  }, [starts]);

  return { track, current, go };
}

// Touch and trackpads scroll natively; a mouse gets drag-to-scroll, then snaps one slide on.
function useMouseDrag(track: RefObject<HTMLDivElement | null>, current: number, go: (i: number) => void) {
  const drag = useRef<{ x: number; left: number } | null>(null);
  // A drag ends in a click on whatever slide it let go over; that click must not pick it.
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft };
    dragged.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: globalThis.PointerEvent) => {
      if (drag.current && track.current) track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    };
    const up = (e: globalThis.PointerEvent) => {
      const dx = drag.current ? e.clientX - drag.current.x : 0;
      drag.current = null;
      dragged.current = Math.abs(dx) > 5;
      setDragging(false);
      go(Math.abs(dx) > 60 ? current + (dx < 0 ? 1 : -1) : current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, current, go, track]);

  return { dragging, dragged, onPointerDown };
}

function SlideCard({ slide, index, count, active }: { slide: FilmSlide; index: number; count: number; active: boolean }) {
  return (
    <article
      data-slide={index}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}: ${slide.tab}`}
      className={cx("film-slide", TONE[slide.tone].slide, !active && "is-resting")}
    >
      <div className="film-text">
        <span className="grid size-[38px] place-items-center rounded-[12px] bg-sheet/65">
          <Glyph name={slide.icon} className="size-[18px]" />
        </span>
        <h3 className="mt-[22px] text-[clamp(1.6rem,3vw,2.1rem)] leading-[1.05] tracking-[-0.03em] text-ink">{slide.title}</h3>
        <p className="mt-3.5 text-md text-ink-soft">{slide.line}</p>
        {slide.proExtra ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <Glyph name="star" className="size-[13px] shrink-0 text-pro-gold" />
            {slide.proExtra}
          </p>
        ) : null}
        <div className="film-was flex flex-col gap-1.5">
          <span className="typed text-current opacity-85">Instead of</span>
          <s className="text-md decoration-[1.5px]">&ldquo;{slide.before}&rdquo;</s>
        </div>
      </div>
      <div className="film-shot" aria-hidden>
        {slide.shot}
      </div>
    </article>
  );
}

/** "Everything in one place": a filmstrip of drawn trip pages, one feature a slide. */
export function FeatureFilm({ slides }: { slides: FilmSlide[] }) {
  const { track, current, go } = useFilm(slides.length);
  const { dragging, dragged, onPointerDown } = useMouseDrag(track, current, go);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const picked = (e.target as HTMLElement).closest<HTMLElement>("[data-slide]")?.dataset.slide;
    if (picked !== undefined && !dragged.current) go(Number(picked));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      go(current + (e.key === "ArrowRight" ? 1 : -1));
    }
  };

  return (
    <div>
      <h2 className="text-center text-[clamp(1.7rem,3.5vw,2.5rem)]">Everything in one place</h2>
      <div className="mt-6 flex flex-wrap justify-center gap-2 p-0.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={i === current}
            onClick={() => go(i)}
            className={cx(
              "inline-flex shrink-0 items-center gap-[7px] rounded-full border py-2 pl-[11px] pr-3.5 text-sm transition-colors",
              i === current ? cx(TONE[s.tone].chip, "font-semibold") : "border-rule bg-sheet text-ink-soft hover:border-rule-strong hover:text-ink",
            )}
          >
            <Glyph name={s.icon} />
            {s.tab}
          </button>
        ))}
      </div>
      <div
        ref={track}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Features"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onClick={onClick}
        className={cx("film-track scroll-x-bare", dragging && "is-dragging")}
      >
        {slides.map((s, i) => (
          <SlideCard key={s.key} slide={s} index={i} count={slides.length} active={i === current} />
        ))}
      </div>
    </div>
  );
}
