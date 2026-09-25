import { describe, expect, it } from "vitest";

import { cursorTone, liveUser, peopleByPage, presentPeople } from "./live-presence";

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
    const states = new Map<number, unknown>([[1, { user: ada }], [2, { user: mo }], [3, { user: ada }]]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Ada Lovelace", "Mo Farah"]);
  });

  it("skips a client that has not said who it is", () => {
    const states = new Map<number, unknown>([[1, {}], [2, { user: { id: "u-x", name: 42 } }], [3, { user: mo }], [4, null]]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Mo Farah"]);
  });
});

describe("peopleByPage", () => {
  it("groups people by the page they have open, once each", () => {
    const states = new Map<number, unknown>([
      [1, { user: ada, page: 4 }],
      [2, { user: ada, page: 4 }],
      [3, { user: mo, page: 4 }],
      [4, { user: mo, page: 9 }],
      [5, { user: ada }],
      [6, { page: 9 }],
    ]);
    const byPage = peopleByPage(states);
    expect(byPage.get(4)?.map((p) => p.id)).toEqual(["u-ada", "u-mo"]);
    expect(byPage.get(9)?.map((p) => p.id)).toEqual(["u-mo"]);
    expect([...byPage.keys()]).toEqual([4, 9]);
  });
});
