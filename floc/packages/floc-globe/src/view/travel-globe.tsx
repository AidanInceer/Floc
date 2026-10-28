"use client";

/**
 * The travel globe on a profile (#468): the top of the paper globe, larger than its panel, with the countries
 * someone has been to and wants to go to filled in. The web app renders it; the phone runs it in an Expo DOM component.
 */
import { countryName } from "@floc/core/people/countries";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { travelGlobe, type TravelGlobeEngine } from "../canvas/engine";
import type { MapState } from "../canvas/paint";
import type { Countries } from "../countries";
import { openingPlace } from "../opening";
import { keepIn } from "../screen";

export type { MapState };
export type TravelGlobeHandle = { show: (code: string) => void };

const WORD: Record<MapState, string> = { green: "Been there", yellow: "Want to go" };
const stateWord = (state: MapState | undefined) => (state ? WORD[state] : "Not marked");

type Props = {
  /** Null until the outline arrives; the sea draws alone until then (rule 11). */
  land: Countries | null;
  states: Record<string, MapState>;
  /** A tap on a country. Left out, a tap only names it. */
  onPick?: (code: string) => void;
  /** Drawn in the clear corner of the dome. */
  title?: string;
  ref?: Ref<TravelGlobeHandle>;
};

const Plus = () => (
  <svg viewBox="0 0 14 14" aria-hidden className="travel-globe-icon">
    <path d="M7 3v8M3 7h8" />
  </svg>
);
const Minus = () => (
  <svg viewBox="0 0 14 14" aria-hidden className="travel-globe-icon">
    <path d="M3 7h8" />
  </svg>
);

export function TravelGlobe({ land, states, onPick, title, ref }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const engine = useRef<TravelGlobeEngine | null>(null);
  const live = useRef({ states, onPick, picked: null as string | null });
  const [picked, setPicked] = useState<string | null>(null);
  const [zoom, setZoom] = useState({ atMin: false, atMax: false });
  live.current = { states, onPick, picked };

  // The name follows its country as the globe turns, and hides while the country is round the back.
  function place() {
    const el = bubble.current;
    const code = live.current.picked;
    const at = code ? engine.current?.pin(code) : null;
    if (!el || !frame.current) return;
    el.dataset.shown = String(Boolean(at));
    if (!at) return;
    const spot = keepIn(at, { w: frame.current.clientWidth, h: frame.current.clientHeight }, { w: el.offsetWidth, h: el.offsetHeight });
    el.style.left = `${spot.x}px`;
    el.style.top = `${spot.y}px`;
  }

  function pick(code: string | null) {
    setPicked(code);
    live.current.picked = code;
    engine.current?.select(code);
    if (code) live.current.onPick?.(code);
  }

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const g = travelGlobe(node, {
      states: () => live.current.states,
      onTap: pick,
      onDraw: place,
      onZoom: setZoom,
    });
    if (!g) return;
    engine.current = g;
    const resized = new ResizeObserver(g.redraw);
    resized.observe(node);
    const themed = new MutationObserver(g.redraw);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      resized.disconnect();
      themed.disconnect();
      g.stop();
      engine.current = null;
    };
    // Why once: `pick` and `place` read the live props through `live`.
  }, []);

  // Why only on the outline's arrival: the globe opens on where you have been, and must not turn under you as you mark.
  useEffect(() => {
    if (!land) return;
    const been = Object.keys(live.current.states).filter((code) => live.current.states[code] === "green");
    engine.current?.setLand(land, openingPlace(land, been));
  }, [land]);

  useEffect(() => {
    engine.current?.redraw();
  }, [states, picked]);

  // A tap anywhere off the globe, or Escape, puts the name away.
  useEffect(() => {
    if (!picked) return;
    const away = (e: PointerEvent) => {
      if (!frame.current?.contains(e.target as Node)) pick(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && pick(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [picked]);

  useImperativeHandle(ref, () => ({
    show(code) {
      engine.current?.bring(code);
      setPicked(code);
      live.current.picked = code;
      engine.current?.select(code);
    },
  }));

  const said = picked ? `${countryName(picked)} · ${stateWord(states[picked])}` : "";

  return (
    <div ref={frame} className="travel-globe">
      <canvas
        ref={canvas}
        className="travel-globe-canvas"
        role="img"
        aria-label="A globe with the countries marked. Drag to turn it; pinch or use the buttons to zoom."
      />
      {title ? <h2 className="travel-globe-title">{title}</h2> : null}
      <div ref={bubble} className="travel-globe-bubble" aria-hidden>
        {picked ? (
          <>
            <span className={`travel-key${states[picked] ? ` travel-key-${states[picked]}` : ""}`} />
            {countryName(picked)}
            <span className="travel-globe-state">{stateWord(states[picked])}</span>
          </>
        ) : null}
      </div>
      <p className="travel-globe-said" aria-live="polite">
        {said}
      </p>
      <div className="travel-globe-zoom" role="group" aria-label="Zoom">
        <button type="button" aria-label="Zoom in" disabled={zoom.atMax} onClick={() => engine.current?.zoomBy(1.6)}>
          <Plus />
        </button>
        <button type="button" aria-label="Zoom out" disabled={zoom.atMin} onClick={() => engine.current?.zoomBy(1 / 1.6)}>
          <Minus />
        </button>
      </div>
    </div>
  );
}
