"use client";

import { useEffect, useRef } from "react";

import { HEADLINE_WORDS, START_DELAY_MS, frameAt, stillScript, typingScript } from "@/lib/landing/hero/typed-headline";
import { TICKET_SORTED_MS } from "@/lib/landing/hero/ticket-beats";

import { SCENE_END_MS } from "./beats";
import "./hero-ticket.css";

const LAST_WORD = HEADLINE_WORDS[HEADLINE_WORDS.length - 1];
const typed = typingScript(HEADLINE_WORDS, START_DELAY_MS, SCENE_END_MS);
const still = stillScript(LAST_WORD, TICKET_SORTED_MS);

export function TypedWord() {
  const text = useRef<HTMLElement>(null);
  const caret = useRef<HTMLElement>(null);
  const mark = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const script = matchMedia("(max-width: 900px)").matches ? still : typed;
    const paint = (time: number) => {
      const frame = frameAt(script, time);
      text.current!.textContent = frame.text || "​";
      caret.current!.style.visibility = frame.caret ? "visible" : "hidden";
      const edge = -4 + frame.sweep * 108;
      mark.current!.style.visibility = frame.sweep > 0 ? "visible" : "hidden";
      mark.current!.style.clipPath = `polygon(0 0, ${edge}% 0, ${edge - 4}% 100%, 0 100%)`;
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(script.doneAt);
      return;
    }
    const start = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const time = Math.min(script.doneAt, now - start);
      paint(time);
      if (time < script.doneAt) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <span aria-hidden="true" className="block h-[1em]">
      <span className="relative isolate whitespace-nowrap">
        <b ref={text} className="typed-desk font-semibold">
          {HEADLINE_WORDS[0]}
        </b>
        <b className="typed-phone font-semibold">{LAST_WORD}</b>
        <i ref={caret} className="typed-desk absolute left-full top-[0.2em] ml-[0.05em] h-[0.84em] w-[0.05em] rounded-[0.02em] bg-pen" />
        <svg
          ref={mark}
          viewBox="0 0 200 40"
          preserveAspectRatio="none"
          className="invisible absolute -left-[0.1em] -right-[0.07em] top-[0.3em] -z-10 h-[0.64em] -rotate-[1.2deg] overflow-visible fill-pastel-green-edge"
        >
          <path d="M9 6 C70 3 140 5 199 2 L193 31 C130 34 60 36 2 38 Z" />
        </svg>
      </span>
    </span>
  );
}
