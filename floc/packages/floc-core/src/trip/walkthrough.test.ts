import { describe, expect, it } from "vitest";

import { SORTED_CHIPS, chipsFor, shouldStartWalkthrough, sortedAtStart, thenLine, walkthroughSteps, welcomeLine } from "./walkthrough";

const NOTHING = { where: false, who: false, when: false };

describe("shouldStartWalkthrough", () => {
  it("opens on a person's first trip", () => {
    expect(shouldStartWalkthrough({ seen: false, tripCount: 1 })).toBe(true);
  });

  it("never opens for someone already on another trip", () => {
    expect(shouldStartWalkthrough({ seen: false, tripCount: 2 })).toBe(false);
  });

  it("never opens twice", () => {
    expect(shouldStartWalkthrough({ seen: true, tripCount: 1 })).toBe(false);
  });
});

describe("walkthroughSteps", () => {
  it("starts a blank trip on Ideas, then the invite, dates, days and booking", () => {
    expect(walkthroughSteps(NOTHING, false).map((s) => s.key)).toEqual(["ideas", "invite", "dates", "days", "book"]);
  });

  it("skips Ideas when where is sorted", () => {
    expect(walkthroughSteps({ ...NOTHING, where: true }, false)[0]?.key).toBe("invite");
  });

  it("skips the invite for someone going on their own", () => {
    expect(walkthroughSteps({ ...NOTHING, where: true, who: true }, false)[0]?.key).toBe("dates");
  });

  it("skips the invite for someone who joined from one", () => {
    expect(walkthroughSteps(NOTHING, true).map((s) => s.key)).not.toContain("invite");
  });

  it("asks the group for free days when the dates are open", () => {
    const dates = walkthroughSteps({ ...NOTHING, where: true, who: true }, false)[0];
    expect(dates?.title).toBe("Find a week that works");
  });

  it("asks for the dates themselves once they are set", () => {
    const dates = walkthroughSteps({ where: true, who: true, when: true }, false)[0];
    expect(dates?.title).toBe("Check your dates");
    expect(dates?.place).toBe("Dates");
  });

  it("always ends on days and booking", () => {
    const keys = walkthroughSteps({ where: true, who: true, when: true }, false).map((s) => s.key);
    expect(keys.slice(-2)).toEqual(["days", "book"]);
  });
});

describe("thenLine", () => {
  it("lists what follows the first step, in order", () => {
    expect(thenLine(walkthroughSteps({ where: true, who: true, when: false }, false))).toBe(
      "Then fill in the days, book it, file it.",
    );
  });

  it("says nothing when one step is left", () => {
    expect(thenLine(walkthroughSteps(NOTHING, false).slice(0, 1))).toBe("");
  });
});

describe("welcomeLine", () => {
  it("greets the person who made the trip", () => {
    expect(welcomeLine("Lisbon long weekend", false)).toBe("Let's get Lisbon long weekend off the ground. What's sorted already?");
  });

  it("greets someone who joined", () => {
    expect(welcomeLine("Lisbon long weekend", true)).toBe("You're in on Lisbon long weekend. What's sorted already?");
  });

  it("never doubles a trip name's own full stop", () => {
    expect(welcomeLine("Portugal, Late Summer.", true)).toBe("You're in on Portugal, Late Summer. What's sorted already?");
  });
});

describe("sortedAtStart", () => {
  it("starts a blank trip with nothing sorted", () => {
    expect(sortedAtStart({ datesSet: false, placesSet: false, joined: false })).toEqual(NOTHING);
  });

  it("never asks what the trip already answers", () => {
    expect(sortedAtStart({ datesSet: true, placesSet: true, joined: false })).toEqual({ where: true, who: false, when: true });
  });

  it("counts who as sorted for someone who joined", () => {
    expect(sortedAtStart({ datesSet: false, placesSet: false, joined: true }).who).toBe(true);
  });
});

describe("chipsFor", () => {
  it("drops the who chip for someone who joined, who was invited already", () => {
    expect(chipsFor(true).map((c) => c.key)).toEqual(["where", "when"]);
  });

  it("keeps all three for the person who made the trip", () => {
    expect(chipsFor(false)).toEqual(SORTED_CHIPS);
  });
});

describe("SORTED_CHIPS", () => {
  it("offers one chip for each of where, who and when", () => {
    expect(SORTED_CHIPS.map((c) => c.key)).toEqual(["where", "who", "when"]);
  });
});
