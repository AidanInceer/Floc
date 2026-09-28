"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";

import { PRO_FEATURES, type ProStage } from "@/lib/landing/pro-tour";
import { litAt, stepWipe, wipeAt } from "@/lib/landing/pro-wipe";

import { Glyph } from "../landing-glyph";
import { ProPage } from "./pro-page";
import { FEATURE_GLYPH } from "./pro-glyphs";
import { useWipe, type WipeMode } from "./use-wipe";

/** The same trip page without and with Pro. A gold wiper sweeps across once; drag it back to compare. */
export function ProWiper({ stage, mode, onHold }: { stage: ProStage; mode: WipeMode; onHold: () => void }) {
  const { x, set } = useWipe(mode);
  const device = useRef<HTMLDivElement>(null);
  const lit = stage.keys.map((_, i) => litAt(x, i));

  const drag = (e: PointerEvent) => {
    const box = device.current?.getBoundingClientRect();
    if (box) set(wipeAt(e.clientX, box.left, box.width));
  };

  return (
    <div className="grid grid-cols-[minmax(0,36rem)] justify-center gap-6 lg:grid-cols-[minmax(0,36rem)_minmax(0,17rem)] lg:gap-10">
      <div
        ref={device}
        className="pro-wipe relative mt-7 cursor-ew-resize touch-pan-y select-none"
        style={{ "--x": x } as CSSProperties}
        data-start={x < 0.06 || undefined}
        data-end={x > 0.94 || undefined}
        onPointerDown={(e) => {
          onHold();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag(e);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && drag(e)}
      >
        <div aria-hidden className="grid overflow-hidden rounded-[22px] border border-rule-strong shadow-lifted">
          <ProPage stage={stage} />
          <ProPage stage={stage} lit={lit} />
        </div>
        <span className="pro-wipe-bar pointer-events-none absolute inset-y-0 w-0">
          <span aria-hidden className="pro-tag pro-tag-pro">
            <Glyph name="star" className="size-2.5 fill-current" />
            Pro
          </span>
          <span aria-hidden className="pro-tag pro-tag-free">
            Free
          </span>
          <button
            type="button"
            role="slider"
            aria-label="Compare free and Pro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(x * 100)}
            aria-valuetext={x > 0.5 ? "Pro" : "Free"}
            onKeyDown={(e) => {
              const next = stepWipe(x, e.key);
              if (next === null) return;
              e.preventDefault();
              onHold();
              set(next);
            }}
            className="pro-grip pointer-events-auto absolute -left-[17px] top-1/2 -mt-[17px] grid size-[34px] place-items-center rounded-full bg-pro-gold text-pro shadow-lifted"
          >
            <Glyph name="grip" className="size-3.5" />
          </button>
        </span>
      </div>
      <ul className="grid content-center gap-2.5 max-lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:pt-7">
        {stage.keys.map((key, i) => (
          <li
            key={key}
            data-tone={PRO_FEATURES[key].tone}
            data-lit={lit[i] || undefined}
            className="pro-item relative flex items-center gap-2.5 rounded-2xl py-2.5 pl-2.5 pr-3.5 text-[13.5px] font-medium md:text-base"
          >
            <span className="pro-tile">
              <Glyph name={FEATURE_GLYPH[key]} className="size-3.5" />
            </span>
            {PRO_FEATURES[key].title}
            <Glyph name="star" className="pro-star ml-auto size-[13px] shrink-0 fill-current" />
          </li>
        ))}
      </ul>
    </div>
  );
}
