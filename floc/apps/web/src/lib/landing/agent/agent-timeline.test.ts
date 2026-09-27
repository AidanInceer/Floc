import { describe, expect, it } from "vitest";

import { LANES } from "./agent-lanes";
import { agentTimeline } from "./agent-timeline";

const tl = agentTimeline();

describe("agentTimeline", () => {
  it("sends only once the prompt is typed", () => {
    expect(tl.sentAt).toBeGreaterThan(tl.prompt.endMs);
    expect(tl.pressedUntil).toBeGreaterThan(tl.sentAt);
  });

  describe("on a wide screen", () => {
    it("lights the six asks in order, after sending", () => {
      expect(tl.marks.map((m) => m.mark)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(tl.marks[0]!.litAt).toBeGreaterThan(tl.sentAt);
      tl.marks.slice(1).forEach((m, i) => expect(m.litAt).toBeGreaterThan(tl.marks[i]!.litAt));
    });

    it("lands each card as its line arrives, then fills it", () => {
      for (const m of tl.marks) {
        expect(m.lineAt).toBeGreaterThan(m.litAt);
        expect(m.inAt).toBe(m.lineAt + m.lineMs);
        expect(m.runAt).toBeGreaterThan(m.inAt);
      }
    });

    it("puts every other card in the far column, and gives those the longer line", () => {
      expect(tl.marks.filter((m) => m.far).map((m) => m.mark)).toEqual([2, 4, 6]);
      const near = tl.marks.find((m) => !m.far)!;
      const far = tl.marks.find((m) => m.far)!;
      expect(far.lineMs).toBeGreaterThan(near.lineMs);
    });

    it("is planned only after the last card fills", () => {
      expect(tl.wideDoneAt).toBeGreaterThan(Math.max(...tl.marks.map((m) => m.runAt)));
    });
  });

  describe("on a narrow screen", () => {
    it("starts one lane per job, each a beat after the one before", () => {
      expect(tl.lanes).toHaveLength(LANES.length);
      expect(tl.lanes[0]!.runAt).toBeGreaterThan(tl.sentAt);
      tl.lanes.slice(1).forEach((l, i) => expect(l.runAt).toBeGreaterThan(tl.lanes[i]!.runAt));
    });

    it("finishes each lane after its own run time", () => {
      tl.lanes.forEach((l, i) => expect(l.doneAt - l.runAt).toBe(LANES[i]!.ms));
    });

    it("fills a ticket row when the first lane feeding it finishes", () => {
      const booked = tl.lanes.filter((_, i) => LANES[i]!.row === "booked").map((l) => l.doneAt);
      expect(tl.rows.booked).toBe(Math.min(...booked));
    });

    it("lights each ask as the lane working on it starts", () => {
      for (const mark of [1, 2, 3, 4, 5, 6] as const) {
        const i = LANES.findIndex((l) => l.mark === mark);
        expect(tl.narrowLitAt[mark]).toBe(tl.lanes[i]!.runAt);
      }
    });

    it("stamps the ticket after every lane, then is planned", () => {
      expect(tl.stampAt).toBeGreaterThan(Math.max(...tl.lanes.map((l) => l.doneAt)));
      expect(tl.narrowDoneAt).toBeGreaterThan(tl.stampAt);
    });
  });

  it("lists every beat once, in order", () => {
    expect(tl.beats).toEqual([...new Set(tl.beats)].sort((a, b) => a - b));
    for (const at of [tl.sentAt, tl.pressedUntil, tl.wideDoneAt, tl.narrowDoneAt, tl.stampAt, tl.prompt.endMs]) {
      expect(tl.beats).toContain(at);
    }
  });
});
