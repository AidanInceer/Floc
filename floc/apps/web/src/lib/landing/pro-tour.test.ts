import { describe, expect, it } from "vitest";

import { PRO_FEATURES, PRO_STAGES, nextStage, stageNotes, type ProStage } from "./pro-tour";

const stage = (over: Partial<ProStage>): ProStage => ({
  name: "Away",
  what: "On the trip",
  tab: "The plan",
  page: "Sicily · Cefalù",
  over: "Day 3",
  title: "Cefalù",
  rows: [],
  ...over,
});

describe("stageNotes", () => {
  it("numbers what Pro does today first, then what is coming", () => {
    const notes = stageNotes(
      stage({
        rows: [
          { key: "offline", title: "No signal", detail: "Everything saved" },
          { key: "packing", title: "Packing", detail: "Light jumper" },
        ],
      }),
    );
    expect(notes).toEqual([
      { key: "packing", n: 1, inPro: true },
      { key: "offline", n: 2, inPro: false },
    ]);
  });

  it("counts the banner as a row", () => {
    const notes = stageNotes(stage({ banner: { key: "live", text: "Next: train" }, rows: [] }));
    expect(notes).toEqual([{ key: "live", n: 1, inPro: false }]);
  });

  it("lists a feature once when two rows show it", () => {
    const notes = stageNotes(
      stage({
        rows: [
          { key: "agent", title: "Ask Floc", detail: "a" },
          { key: "agent", title: "Ask Floc", detail: "b" },
        ],
      }),
    );
    expect(notes.map((n) => n.key)).toEqual(["agent"]);
  });
});

describe("nextStage", () => {
  it("moves on one stage at a time", () => {
    expect(nextStage(0, 4)).toBe(1);
  });

  it("rests on the last stage rather than looping", () => {
    expect(nextStage(3, 4)).toBeNull();
  });
});

describe("the Pro tour", () => {
  it("sells as Pro today only what the FAQ says Pro adds", () => {
    const today = Object.values(PRO_FEATURES).filter((f) => f.inPro).map((f) => f.key);
    expect(today.sort()).toEqual(["files", "packing", "search", "weather"]);
  });

  it("walks the trip from deciding to home again", () => {
    expect(PRO_STAGES.map((s) => s.name)).toEqual(["Deciding", "Booking", "Away", "Home again"]);
  });

  it("shows every feature somewhere on the trip", () => {
    const shown = new Set(PRO_STAGES.flatMap((s) => stageNotes(s).map((n) => n.key)));
    expect([...shown].sort()).toEqual(Object.keys(PRO_FEATURES).sort());
  });
});
