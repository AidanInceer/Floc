import { expect, it } from "vitest";

import { agentPlaybackAt } from "./agent-playback";
import { agentTimeline } from "./agent-timeline";

const timeline = agentTimeline();

it("waits for Run without sending or revealing results, however long the visitor waits", () => {
  expect(agentPlaybackAt(timeline, 60_000, null)).toEqual({ phase: "ready", t: timeline.prompt.endMs });
});

it("finishes the one-off invitation before enabling Run", () => {
  expect(agentPlaybackAt(timeline, timeline.prompt.endMs + 1499, null).phase).toBe("inviting");
});

it("holds the original scene until the brief has finished docking", () => {
  expect(agentPlaybackAt(timeline, 60_000, 879)).toEqual({ phase: "moving", t: timeline.prompt.endMs });
});

it("resumes at the original send beat after docking, independent of time spent waiting", () => {
  expect(agentPlaybackAt(timeline, 60_000, 880)).toEqual({ phase: "running", t: timeline.sentAt });
});

it("rests on the original final state, including when motion is reduced", () => {
  expect(agentPlaybackAt(timeline, Infinity, Infinity)).toEqual({ phase: "done", t: timeline.beats.at(-1) });
});

it("starts with an empty brief before the first typed key", () => {
  expect(agentPlaybackAt(timeline, 299, null)).toEqual({ phase: "typing", t: -1 });
});

it("types the first key on the existing prompt schedule", () => {
  expect(agentPlaybackAt(timeline, 300, null)).toEqual({ phase: "typing", t: 300 });
});

it("enables Run once the invitation has settled", () => {
  expect(agentPlaybackAt(timeline, timeline.prompt.endMs + 1500, null).phase).toBe("ready");
});

it.each([1, 3, 6])("keeps the original card %i beat after Run", (mark) => {
  const beat = timeline.marks.find((m) => m.mark === mark)!;
  expect(agentPlaybackAt(timeline, 60_000, 880 + beat.runAt - timeline.sentAt).t).toBe(beat.runAt);
});
