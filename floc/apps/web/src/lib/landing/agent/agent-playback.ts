import type { AgentTimeline } from "./agent-timeline";

export type AgentPhase = "typing" | "inviting" | "ready" | "moving" | "running" | "done";
export type AgentPlayback = { phase: AgentPhase; t: number };
const INVITE_MS = 1500;
export const AGENT_DOCK_MS = 880;

function beatAt(beats: number[], time: number) {
  const next = beats.findIndex((beat) => beat > time);
  return beats[next === -1 ? beats.length - 1 : next - 1] ?? -1;
}

export function agentPlaybackAt(timeline: AgentTimeline, introElapsed: number, runElapsed: number | null): AgentPlayback {
  if (runElapsed !== null && runElapsed < AGENT_DOCK_MS) return { phase: "moving", t: timeline.prompt.endMs };
  if (runElapsed !== null) {
    const time = timeline.sentAt + runElapsed - AGENT_DOCK_MS;
    return { phase: time >= timeline.beats.at(-1)! ? "done" : "running", t: beatAt(timeline.beats, time) };
  }
  const time = Math.min(introElapsed, timeline.prompt.endMs);
  const phase = introElapsed < timeline.prompt.endMs ? "typing" : introElapsed < timeline.prompt.endMs + INVITE_MS ? "inviting" : "ready";
  return { phase, t: beatAt(timeline.beats, time) };
}
