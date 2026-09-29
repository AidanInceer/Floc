"use client";

import { memo, type CSSProperties } from "react";

import { AGENT_DOCK_MS } from "@/lib/landing/agent/agent-playback";
import { agentTimeline } from "@/lib/landing/agent/agent-timeline";

import { AgentCards } from "./agent-cards";
import { AgentLanes } from "./agent-lanes";
import { AgentTicket } from "./agent-ticket";
import { AgentStart } from "./agent-start";
import { AskCard } from "./ask-card";
import { RouteLine } from "./route-line";
import { useAgentClock } from "./use-agent-clock";
import { useMarkLines } from "./use-mark-lines";
import { useWide } from "./use-wide";
import { useBriefPosition } from "./use-brief-position";

const TIMELINE = agentTimeline();
const LINE_TONE = ["agent-line-blue", "agent-line-route", "", "agent-line-red", "agent-line-yellow", "agent-line-green"];

// Why: the prompt types a key a frame; the boards wait on a still clock until it is sent, so they skip those renders.
const Cards = memo(AgentCards);
const Lanes = memo(AgentLanes);
const Ticket = memo(AgentTicket);

/**
 * One brief, typed, then played out: on a wide screen each ask lights and a
 * route line carries it to what Floc made of it; on a narrow one every job
 * runs as a lane at once and feeds one ticket.
 */
export function AgentScene() {
  const { ref, t, phase, run } = useAgentClock<HTMLDivElement>(TIMELINE);
  const brief = useBriefPosition(ref);
  const wide = useWide();
  const playing = phase === "running" || phase === "done";
  const { width, height, lines } = useMarkLines(ref, wide && playing);
  const { prompt, sentAt, pressedUntil, marks, lanes, rows, stampAt } = TIMELINE;
  const boardT = t < sentAt ? -1 : t;

  return (
    <div
      ref={ref}
      role="group"
      data-phase={phase}
      style={{ "--agent-dock-ms": `${AGENT_DOCK_MS}ms` } as CSSProperties}
      aria-label="A sample: Priya asks Floc to plan Sicily for six, 12 to 19 September. Floc sorts the dates, the route, the stays, the packing, where to eat and the money."
      className="agent-scene relative grid gap-6 text-left md:max-[1199px]:grid-cols-2 md:max-[1199px]:gap-x-12 md:max-[1199px]:gap-y-8 min-[1200px]:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] min-[1200px]:items-center min-[1200px]:gap-0"
    >
      <div ref={brief} className="agent-brief relative z-[1] md:max-[1199px]:col-span-2 md:max-[1199px]:mx-auto md:max-[1199px]:w-full md:max-[1199px]:max-w-[560px]">
        <AskCard
          t={t}
          prompt={prompt}
          timing={{ sentAt, pressedUntil, doneAt: wide ? TIMELINE.wideDoneAt : TIMELINE.narrowDoneAt }}
          lit={(m) => t >= (wide ? marks[m - 1]!.litAt : TIMELINE.narrowLitAt[m])}
        >
          {playing ? undefined : <AgentStart phase={phase} run={run} />}
        </AskCard>
      </div>
      {wide && (
        <svg aria-hidden viewBox={`0 0 ${width || 1} ${height || 1}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {marks.map((m) =>
            lines[m.mark] ? <RouteLine key={m.mark} d={lines[m.mark]!} go={t >= m.lineAt} ms={m.lineMs} className={LINE_TONE[m.mark - 1]} /> : null,
          )}
        </svg>
      )}
      <div inert={!playing} className="agent-results relative z-[1] hidden min-[1200px]:block">
        <Cards marks={marks} t={boardT} />
      </div>
      <div inert={!playing} className="agent-results min-[1200px]:hidden">
        <Lanes lanes={lanes} t={boardT} />
      </div>
      <div inert={!playing} className="agent-results self-center min-[1200px]:hidden">
        <Ticket rows={rows} stampAt={stampAt} t={boardT} />
      </div>
    </div>
  );
}
