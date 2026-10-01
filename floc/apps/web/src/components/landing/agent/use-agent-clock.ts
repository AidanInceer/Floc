"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { watchFirstView } from "@/lib/landing/scene/scene-start";
import { agentPlaybackAt } from "@/lib/landing/agent/agent-playback";
import type { AgentTimeline } from "@/lib/landing/agent/agent-timeline";

export function useAgentClock<T extends Element>(timeline: AgentTimeline) {
  const ref = useRef<T>(null);
  const runAt = useRef<number | null>(null);
  const resume = useRef<(() => void) | null>(null);
  const [playback, setPlayback] = useState(() => agentPlaybackAt(timeline, -1, null));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    let introAt = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      setPlayback(agentPlaybackAt(timeline, Infinity, Infinity));
    };
    const tick = (now: number) => {
      const next = agentPlaybackAt(timeline, now - introAt, runAt.current === null ? null : now - runAt.current);
      setPlayback((previous) => previous.t === next.t && previous.phase === next.phase ? previous : next);
      if (next.phase !== "ready" && next.phase !== "done") frame = requestAnimationFrame(tick);
    };
    resume.current = () => { frame = requestAnimationFrame(tick); };
    const stop = watchFirstView(node, {
      onStill: finish,
      onStart: ({ still }) => {
        if (still) finish();
        else {
          introAt = performance.now() - (matchMedia("(max-width: 759px)").matches ? timeline.prompt.endMs : 0);
          frame = requestAnimationFrame(tick);
        }
      },
    });
    return () => {
      stop();
      cancelAnimationFrame(frame);
      resume.current = null;
    };
  }, [timeline]);

  const run = useCallback(() => {
    if (playback.phase !== "ready" || runAt.current !== null) return;
    runAt.current = performance.now();
    resume.current?.();
  }, [playback.phase]);

  return { ref, ...playback, run };
}
