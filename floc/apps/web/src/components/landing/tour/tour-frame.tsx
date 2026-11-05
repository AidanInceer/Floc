"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import { SECTION_COLOURS, type SectionColour } from "@floc/core/design/section-colours";
import { NavGlyph } from "@/components/system/icons/nav";
import { AvatarRow, cx } from "@/components/system/ui";
import { TABS } from "@/lib/tabs";
import { sampleGroup } from "../sample-trip";
import type { TourSlide } from "./tour-slides";

const RISE = "tour-rise";
const WASH: Record<SectionColour, string> = { blue: "bg-pastel-blue", yellow: "bg-pastel-yellow", red: "bg-pastel-red", green: "bg-pastel-green" };
const INK: Record<SectionColour, string> = { blue: "text-pastel-blue-ink", yellow: "text-pastel-yellow-ink", red: "text-pastel-red-ink", green: "text-pastel-green-ink" };

/** Each part of the arriving page rises in turn: its top-level blocks and every list row. */
function build(pane: HTMLElement) {
  const parts = pane.querySelectorAll<HTMLElement>(`:scope > *, li, tbody tr`);
  parts.forEach((el, k) => {
    el.classList.remove(RISE);
    el.style.setProperty("--k", String(k));
  });
  void pane.offsetWidth;
  parts.forEach((el) => el.classList.add(RISE));
}

/**
 * The drawn trip page: one header, the trip's own tab bar, and each slide's screen stacked beneath. The open tab's glyph
 * tile glides to its tab and takes the section colour a beat after the new page lands, so the eye follows the page and
 * then the tab. Illustrative, not a live read.
 */
export function TourFrame({ slides, shown, moved, onPick }: { slides: (TourSlide & { shot: ReactNode })[]; shown: number; moved: boolean; onPick: (slide: number, from: Element) => void }) {
  const bar = useRef<HTMLDivElement>(null);
  const tile = useRef<HTMLSpanElement>(null);
  const glyphs = useRef<(HTMLElement | null)[]>([]);
  const panes = useRef<(HTMLDivElement | null)[]>([]);
  const open = TABS.findIndex((t) => t.key === slides[shown].page);
  const colour = SECTION_COLOURS[TABS[open].key] ?? "blue";

  useMeasured(bar, (glide) => {
    const g = glyphs.current[open];
    const t = tile.current;
    const tab = g?.offsetParent as HTMLElement | null;
    if (!g || !t || !tab) return;
    // Why: only a change of tab glides; a resize or font load puts the tile straight on its icon, so it never trails behind.
    t.style.transition = glide ? "" : "none";
    t.style.transform = `translate(${tab.offsetLeft + g.offsetLeft}px, ${tab.offsetTop + g.offsetTop}px)`;
    if (!glide) void t.offsetWidth;
  }, [open]);

  useLayoutEffect(() => {
    const pane = panes.current[shown];
    if (moved && pane) build(pane);
  }, [shown, moved]);

  return (
    <div className="overflow-hidden rounded-md border border-rule bg-paper text-left text-[13px] text-ink shadow-lifted">
      <div className="flex items-center justify-between bg-sheet px-[18px] py-3">
        <span className="font-display text-[19px] font-semibold tracking-[-0.02em]">Sicily</span>
        <AvatarRow people={sampleGroup} max={6} size={22} />
      </div>
      <div ref={bar} className="relative flex items-center justify-center gap-3.5 border-b border-rule bg-sheet px-4 py-2.5">
        <span ref={tile} aria-hidden className={cx("tour-tile absolute left-0 top-0 size-6 rounded-sm", WASH[colour])} />
        {TABS.map((t, i) => {
          const slide = slides.findIndex((s) => s.page === t.key);
          const on = i === open;
          const inner = (
            <>
              <span
                ref={(el) => { glyphs.current[i] = el; }}
                className={cx("tour-glyph relative z-[1] inline-flex size-6 items-center justify-center rounded-sm", on && INK[SECTION_COLOURS[t.key] ?? "blue"])}
              >
                <NavGlyph name={t.key} />
              </span>
              <span>{t.label}</span>
            </>
          );
          const className = cx("tour-tab relative flex items-center gap-1.5 text-xs font-medium", on ? "text-ink" : "text-ink-faint", slide >= 0 && !on && "hover:text-ink");
          return slide < 0 ? (
            <span key={t.key} className={className}>{inner}</span>
          ) : (
            <button key={t.key} type="button" tabIndex={-1} className={cx(className, "relative")} onClick={(e) => onPick(slide, e.currentTarget)}>
              {inner}
            </button>
          );
        })}
      </div>
      <div className="grid h-[500px] overflow-hidden px-[22px] pb-[60px] pt-5">
        {slides.map((s, i) => (
          <div key={s.key} ref={(el) => { panes.current[i] = el; }} inert={i !== shown} className="tour-pane" data-on={i === shown}>
            {s.shot}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Runs `measure(true)` when `deps` change after the first paint, and `measure(false)` on mount, when the box resizes and once the fonts load. */
function useMeasured(box: RefObject<HTMLElement | null>, measure: (glide: boolean) => void, deps: unknown[]) {
  const latest = useRef(measure);
  latest.current = measure;
  const first = useRef(true);
  useLayoutEffect(() => {
    latest.current(!first.current);
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new ResizeObserver(() => latest.current(false));
    watch.observe(el);
    void document.fonts?.ready.then(() => latest.current(false));
    return () => watch.disconnect();
  }, [box]);
}
