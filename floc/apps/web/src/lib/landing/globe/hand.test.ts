import { describe, expect, it } from "vitest";

import { arrange, around, shuffled, spinPick, stopTimes } from "./hand";

const first = () => 0;
const TOKYO = { lat: 35.676, lng: 139.65 };
const HANOI = { lat: 21.028, lng: 105.804 };
const SEVILLE = { lat: 37.389, lng: -5.984 };
const NADI = { lat: -17.776, lng: 177.435 };
const APIA = { lat: -13.83, lng: -171.77 };

describe("around", () => {
  it("lists the nearest places first", () => {
    expect(around(TOKYO, [SEVILLE, HANOI, TOKYO], 2)).toEqual([2, 1]);
  });

  it("counts a place across the date line as near", () => {
    expect(around(NADI, [SEVILLE, APIA, TOKYO], 1)).toEqual([1]);
  });

  it("gives every place when there are fewer than asked for", () => {
    expect(around(TOKYO, [SEVILLE, TOKYO])).toEqual([1, 0]);
  });
});

describe("shuffled", () => {
  it("keeps every item and leaves the list it was given alone", () => {
    const list = [1, 2, 3, 4];
    expect([...shuffled(list, first)].sort()).toEqual([1, 2, 3, 4]);
    expect(list).toEqual([1, 2, 3, 4]);
  });

  it("orders by the picks it is given", () => {
    expect(shuffled([1, 2, 3], first)).toEqual([2, 3, 1]);
  });
});

describe("arrange", () => {
  it("leaves a trip that stays on its tile", () => {
    expect(arrange([10, 11, 12], [12, 10, 20], first)).toEqual([10, 20, 12]);
  });

  it("puts the new trips on the free tiles in a shuffled order", () => {
    expect(arrange([1, 2, 3], [7, 8, 9], first)).toEqual([8, 9, 7]);
  });
});

describe("spinPick", () => {
  it("never picks a trip that is on show", () => {
    expect(spinPick(5, [0, 1, 2], 0, first)).toBe(3);
  });

  it("moves to another tile when every trip is on show", () => {
    expect(spinPick(3, [0, 1, 2], 1, first)).toBe(0);
  });

  it("stays put when there is only one trip", () => {
    expect(spinPick(1, [0], 0, first)).toBe(0);
  });
});

describe("stopTimes", () => {
  it("stops the tiles one by one, the pick last", () => {
    const times = stopTimes([1, 2, 3], [7, 8, 9], 8, first);
    expect([...times].sort()).toEqual([1000, 1340, 1680]);
    expect(times[1]).toBe(1680);
  });

  it("never rolls a tile that keeps its trip", () => {
    expect(stopTimes([1, 2, 3], [1, 8, 3], 8, first)).toEqual([null, 1000, null]);
  });
});
