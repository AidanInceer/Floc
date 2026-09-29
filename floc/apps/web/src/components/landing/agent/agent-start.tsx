import { useId } from "react";

import { Button } from "@/components/system/ui";
import type { AgentPhase } from "@/lib/landing/agent/agent-playback";

import { Glyph } from "../landing-glyph";

export function AgentStart({ phase, run }: { phase: AgentPhase; run: () => void }) {
  const hint = useId();

  return (
    <span className="relative block size-[34px]">
      <Button type="button" variant="primary" className="agent-run absolute -left-[21px] -top-[5px] z-[2] size-11 border-0 p-0 font-sans normal-case tracking-normal !opacity-100 !shadow-none" disabled={phase !== "ready"} onClick={run} aria-label="Run the sample trip" aria-describedby={hint}>
        <span className="agent-run-ripples" aria-hidden="true"><i /><i /><i /></span>
        <Glyph name="send" className="relative z-[3] size-[18px]" />
        <span id={hint} className="agent-start-cue">
          <span className="block font-display text-[24px] font-semibold leading-[1.1] tracking-[-0.035em]">Click me</span>
          <span className="mt-[5px] block text-[11px] leading-[1.35]">Watch it happen</span>
        </span>
      </Button>
    </span>
  );
}
