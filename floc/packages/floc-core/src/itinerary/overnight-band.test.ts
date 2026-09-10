import { describe, expect, it } from "vitest";

import { bandRuns, runBoundsAt, uncoveredBy, type BandDay } from "./overnight-band";

/**
 * `GIR 5 6 . 8` reads as: five days from the 5th of August, the first two in
 * Girona, the third undecided, the fourth in Girona again — a compact way to
 * write the only thing the band is about, which days agree with which.
 */
const PLACES: Record<string, number> = { GIR: 1, MIL: 2, BCN: 3 };

function daysOf(spec: string): BandDay[] {
  let place: string | null = null;
  return spec.split(/\s+/).map((token) => {
    if (token === ".") {
      place = null;
      return null;
    }
    if (token in PLACES) {
      place = token;
      return null;
    }
    // A leading `~` marks a frame-filling day outside the trip.
    const outside = token.startsWith("~");
    const of = Number(outside ? token.slice(1) : token);
    const decided = !outside && place !== null;
    return {
      date: `2026-08-${String(of).padStart(2, "0")}`,
      outside,
      overnightPlaceId: decided ? PLACES[place as string] : null,
      overnightPlaceName: decided ? (place) : null,
    };
  }).filter((d): d is BandDay => d !== null);
}

/** What each run covers, as `place:firstDay-lastDay`. */
const shapeOf = (runs: ReturnType<typeof bandRuns<BandDay>>) =>
  runs.map(
    (r) =>
      `${r.placeName ?? "."}:${r.days[0].date.slice(8)}-${r.days[r.days.length - 1].date.slice(8)}` +
      (r.preview ? " preview" : "") +
      (r.openStart ? " open<" : "") +
      (r.openEnd ? " >open" : ""),
  );

describe("the overnight band's runs", () => {
  it("draws days that agree as one bar, so a stay is written once", () => {
    const days = daysOf("GIR 5 6 7");
    expect(shapeOf(bandRuns(days, days, null, false))).toEqual(["GIR:05-07"]);
  });

  it("gives every undecided day a cell of its own, so each is its own target", () => {
    const days = daysOf(". 5 6 7");
    expect(shapeOf(bandRuns(days, days, null, false))).toEqual([
      ".:05-05",
      ".:06-06",
      ".:07-07",
    ]);
  });

  it("splits a run where the place changes", () => {
    const days = daysOf("GIR 5 6 MIL 7 GIR 8");
    expect(shapeOf(bandRuns(days, days, null, false))).toEqual([
      "GIR:05-06",
      "MIL:07-07",
      "GIR:08-08",
    ]);
  });

  it("never joins two days across an undecided one", () => {
    const days = [...daysOf("GIR 5"), ...daysOf(". 6"), ...daysOf("GIR 7")];
    expect(shapeOf(bandRuns(days, days, null, false))).toEqual([
      "GIR:05-05",
      ".:06-06",
      "GIR:07-07",
    ]);
  });

  it("squares off a run that carries on past the page being shown", () => {
    const days = daysOf("GIR 4 5 6 7");
    const page = days.slice(1, 3); // the 5th and the 6th
    expect(shapeOf(bandRuns(page, days, null, false))).toEqual(["GIR:05-06 open< >open"]);
  });

  it("keeps a frame-filling day outside the trip out of every run", () => {
    const days = [...daysOf("~3 ~4"), ...daysOf("GIR 5 6")];
    expect(shapeOf(bandRuns(days, days, null, false))).toEqual([
      ".:03-03",
      ".:04-04",
      "GIR:05-06",
    ]);
  });

  /**
   * The band is laid out as one CSS grid row of `span N` items, so the runs
   * have to account for every shown day exactly once. One day too many wraps
   * the row; one too few leaves a hole at the end of the week.
   */
  it("partitions the shown days exactly, in order, whatever the overlay says", () => {
    const days = daysOf("GIR 3 4 5 MIL 6 7 . 8 9");
    const overlays = [
      null,
      { start: "2026-08-04", end: "2026-08-08", placeId: 3, placeName: "BCN" },
      {
        start: "2026-08-03",
        end: "2026-08-03",
        placeId: 1,
        placeName: "GIR",
        uncovered: [["2026-08-04", "2026-08-05"]] as [string, string][],
      },
    ];
    for (const overlay of overlays) {
      for (const dragging of [false, true]) {
        const covered = bandRuns(days, days, overlay, dragging).flatMap((r) => r.days);
        expect(covered).toEqual(days);
      }
    }
  });

  describe("mid-drag", () => {
    it("draws what letting go would write, marked as a proposal", () => {
      const days = daysOf(". 5 6 7");
      const runs = bandRuns(
        days,
        days,
        { start: "2026-08-05", end: "2026-08-06", placeId: 1, placeName: "GIR" },
        true,
      );
      expect(shapeOf(runs)).toEqual(["GIR:05-06 preview", ".:07-07"]);
    });

    it("empties the days a shrink uncovers rather than leaving them drawn", () => {
      // Girona ran 5–7; the left handle has been dragged in to the 7th.
      const days = daysOf("GIR 5 6 7");
      const span = { start: "2026-08-07", end: "2026-08-07", placeId: 1, placeName: "GIR" };
      const runs = bandRuns(
        days,
        days,
        { ...span, uncovered: uncoveredBy({ runStart: "2026-08-05", runEnd: "2026-08-07" }, span) },
        true,
      );
      // The 5th and 6th read as undecided from the first pixel — leaving them
      // as Girona would read as a split into two stays.
      expect(shapeOf(runs)).toEqual([".:05-05", ".:06-06", "GIR:07-07 preview"]);
    });

    // The preview never claims an open edge, so it grows no handle to fight
    // the drag in progress; the settled runs either side still say they carry
    // on, because the days under the preview have not changed yet.
    it("gives a preview no open edge of its own", () => {
      const days = daysOf("GIR 4 5 6 7");
      const runs = bandRuns(
        days,
        days,
        { start: "2026-08-05", end: "2026-08-06", placeId: 1, placeName: "GIR" },
        true,
      );
      expect(shapeOf(runs)).toEqual([
        "GIR:04-04 >open",
        "GIR:05-06 preview",
        "GIR:07-07 open<",
      ]);
    });
  });
});

describe("uncoveredBy", () => {
  it("finds nothing when the drag only grows the run", () => {
    expect(
      uncoveredBy(
        { runStart: "2026-08-05", runEnd: "2026-08-07" },
        { start: "2026-08-03", end: "2026-08-09" },
      ),
    ).toEqual([]);
  });

  it("takes the days off the end the handle came in from", () => {
    expect(
      uncoveredBy(
        { runStart: "2026-08-05", runEnd: "2026-08-09" },
        { start: "2026-08-07", end: "2026-08-09" },
      ),
    ).toEqual([["2026-08-05", "2026-08-06"]]);
  });

  it("takes both ends when a drag shrinks the run to its middle", () => {
    expect(
      uncoveredBy(
        { runStart: "2026-08-05", runEnd: "2026-08-09" },
        { start: "2026-08-07", end: "2026-08-07" },
      ),
    ).toEqual([
      ["2026-08-05", "2026-08-06"],
      ["2026-08-08", "2026-08-09"],
    ]);
  });

  it("crosses a month end, because a stay does", () => {
    expect(
      uncoveredBy(
        { runStart: "2026-07-30", runEnd: "2026-08-02" },
        { start: "2026-08-01", end: "2026-08-02" },
      ),
    ).toEqual([["2026-07-30", "2026-07-31"]]);
  });
});

describe("runBoundsAt", () => {
  it("reaches both ends of the stay, not just the day pressed", () => {
    const days = daysOf("GIR 3 4 5 MIL 6");
    expect(runBoundsAt(days, "2026-08-04", 1)).toEqual({
      start: "2026-08-03",
      end: "2026-08-05",
    });
  });

  it("keeps an undecided day to itself", () => {
    const days = daysOf(". 3 4");
    expect(runBoundsAt(days, "2026-08-04", null)).toEqual({
      start: "2026-08-04",
      end: "2026-08-04",
    });
  });

  it("answers for a date the calendar does not hold", () => {
    expect(runBoundsAt(daysOf("GIR 3"), "2026-09-01", 1)).toEqual({
      start: "2026-09-01",
      end: "2026-09-01",
    });
  });
});
