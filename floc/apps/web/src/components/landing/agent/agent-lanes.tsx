import type { CSSProperties } from "react";

import { cx } from "@/components/system/ui";
import { LANES, type LaneTone } from "@/lib/landing/agent/agent-lanes";
import type { LaneBeat } from "@/lib/landing/agent/agent-timeline";

import { Glyph } from "../landing-glyph";

const SKIN: Record<LaneTone, string> = {
  blue: "agent-lane-blue",
  route: "agent-lane-route",
  ticket: "agent-lane-ticket",
  yours: "agent-lane-yours",
  yellow: "agent-lane-yellow",
  red: "agent-lane-red",
  green: "agent-lane-green",
};

/** One lane per job, all running at once, each ending in what it found. */
export function AgentLanes({ lanes, t }: { lanes: LaneBeat[]; t: number }) {
  return (
    <ol className="grid">
      {LANES.map((lane, i) => {
        const beat = lanes[i]!;
        return (
          <li
            key={lane.name}
            style={{ "--ms": `${lane.ms}ms` } as CSSProperties}
            className={cx(
              "agent-lane grid grid-cols-[1fr_auto] items-center gap-x-2 border-b border-dashed border-rule py-1.5 text-[13px]",
              SKIN[lane.tone],
              t >= beat.runAt && "is-run",
              t >= beat.doneAt && "is-done",
            )}
          >
            <span className="agent-lane-name inline-flex items-center gap-2 whitespace-nowrap">
              <Glyph name={lane.glyph} />
              {lane.name}
            </span>
            <span className="agent-lane-out inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px]">
              {lane.tone !== "yours" && (
                <i className="agent-tick grid size-3.5 shrink-0 place-items-center rounded-full border-[1.2px] border-current">
                  <Glyph name="check" className="size-2.5" />
                </i>
              )}
              {lane.out}
            </span>
            <span className="relative col-span-2 h-[26px]">
              <em className="agent-lane-via absolute left-0 top-0 font-mono text-[10px] not-italic text-ink-faint">{lane.via}</em>
              <i className="agent-lane-line absolute inset-x-0 top-[19px] border-t-[1.5px] border-dashed border-rule-strong" />
              <i className="agent-lane-dot absolute inset-0" />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
