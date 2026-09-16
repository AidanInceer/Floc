import { describe, expect, it } from "vitest";

import { cursorTone, liveUser, presentPeople } from "./live-presence";

const ada = liveUser({ id: "u-ada", name: "Ada Lovelace" });
const mo = liveUser({ id: "u-mo", name: "Mo Farah" });

describe("liveUser", () => {
  it("carries the person's trip-wide tone", () => {
    expect(ada.tone).toMatch(/^who-[1-8]$/);
    expect(liveUser({ id: "x", name: "Ada Lovelace" }).tone).toBe(ada.tone);
  });
});

describe("cursorTone", () => {
  it("uses a known tone", () => {
    expect(cursorTone(ada)).toBe(ada.tone);
  });

  it("refuses a class name another client made up", () => {
    expect(cursorTone({ ...ada, tone: "who-1 evil" })).toBe("who-8");
    expect(cursorTone({})).toBe("who-8");
  });
});

describe("presentPeople", () => {
  it("lists each connected person once, even with two tabs open", () => {
    const states = new Map<number, unknown>([
      [1, { user: ada }],
      [2, { user: mo }],
      [3, { user: ada }],
    ]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Ada Lovelace", "Mo Farah"]);
  });

  it("skips a client that has not said who it is", () => {
    const states = new Map<number, unknown>([
      [1, {}],
      [2, { user: { id: "u-x", name: 42 } }],
      [3, { user: mo }],
    ]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Mo Farah"]);
  });

  it("drops a person when their state goes", () => {
    const states = new Map<number, unknown>([[1, { user: ada }]]);
    states.delete(1);
    expect(presentPeople(states)).toEqual([]);
  });
});
