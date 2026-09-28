"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/system/ui";
import { BRIEF_MAX, BRIEF_SAMPLE, briefFor } from "@/lib/landing/agent/assistant-brief";

import { Glyph } from "../landing-glyph";
import { AssistantRail } from "./assistant-rail";

const COPIED_MS = 2000;

/** Until the agent ships: the group writes a brief here and takes it to an assistant they already use. */
export function WhileYouWait({ origin }: { origin: string }) {
  const [guidance, setGuidance] = useState(BRIEF_SAMPLE);
  const [copied, setCopied] = useState(false);
  const brief = briefFor(origin, guidance);

  useEffect(() => {
    if (!copied) return;
    const done = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(done);
  }, [copied]);

  const copy = () => navigator.clipboard?.writeText(brief).then(() => setCopied(true), () => {});

  return (
    <div className="mx-auto mt-16 max-w-[50rem] text-left">
      <div className="text-center">
        <span className="typed text-pen">While you wait</span>
        <h3 className="mt-1.5 text-balance font-display text-lg font-semibold tracking-[-0.02em] text-ink">
          Plan it now with the assistant you already use.
        </h3>
      </div>
      <div className="mt-4 rounded-2xl border border-rule bg-sheet px-4 pb-3 pt-3.5 transition-colors focus-within:border-pen">
        <label htmlFor="agent-brief" className="block font-mono text-[11.5px] tracking-[0.02em] text-ink-faint">
          Plan a trip with Floc <span className="text-pen">({new URL(origin).host})</span> based on the following guidance:
        </label>
        <textarea
          id="agent-brief"
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder={BRIEF_SAMPLE}
          maxLength={BRIEF_MAX}
          rows={3}
          className="mb-2.5 mt-1.5 block min-h-[4.8em] w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-[1.6] text-ink [field-sizing:content] placeholder:text-ink-faint focus:outline-none"
        />
        <div className="flex flex-col gap-2.5 border-t border-dashed border-rule-strong pt-2.5 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex-1 text-xs text-ink-faint">
            Lay it out day by day, with where we sleep each night, so we can add it to our Floc trip.
          </span>
          <Button type="button" onClick={copy} className="shrink-0">
            <Glyph name={copied ? "check" : "copy"} className={copied ? "size-3 text-green" : "size-3"} />
            {copied ? "Copied" : "Copy brief"}
          </Button>
        </div>
      </div>
      <AssistantRail brief={brief} />
      <p className="mt-2.5 text-center text-xs text-ink-faint">
        Each opens with your brief already in. Floc isn’t linked to these companies. Names and logos belong to their
        owners.
      </p>
    </div>
  );
}
