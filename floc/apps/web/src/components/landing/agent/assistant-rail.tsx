"use client";

import { useEffect, useRef } from "react";

import { ASSISTANTS, askHref } from "@/lib/landing/agent/assistant-brief";

import { AssistantMark } from "./assistant-mark";

// Why: the track holds the row four times and slides one half, so its end looks the same as its start and it can rest there.
const COPIES = [0, 1, 2, 3];

/** The assistants as links, sliding right to left once when first seen (visual language: a carousel stops after one full turn). */
export function AssistantRail({ brief }: { brief: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    const seen = new IntersectionObserver(([entry]) => rail.classList.toggle("is-running", entry!.isIntersecting), {
      threshold: 0.5,
    });
    seen.observe(rail);
    return () => seen.disconnect();
  }, []);

  const copy = () => navigator.clipboard?.writeText(brief).catch(() => {});

  return (
    <div ref={ref} className="agent-rail mt-3.5" aria-label="Open your brief in">
      <ul className="agent-rail-track">
        {COPIES.map((n) =>
          ASSISTANTS.map((a) => (
            <li key={`${n}-${a.key}`} aria-hidden={n > 0 || undefined} className={n > 0 ? "agent-rail-copy" : undefined}>
              <a
                href={askHref(a, brief)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={n > 0 ? -1 : undefined}
                onClick={copy}
                aria-label={`Open ${a.name} with your brief`}
                className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-rule bg-sheet py-2 pl-2.5 pr-4 text-[13px] font-semibold text-ink no-underline transition-colors hover:border-pen hover:bg-pen-soft focus-visible:border-pen focus-visible:bg-pen-soft"
              >
                <AssistantMark which={a.key} className="size-[18px] shrink-0" />
                {a.name}
              </a>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
