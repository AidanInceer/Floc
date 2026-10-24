import { describe, expect, it } from "vitest";

import { goingNames, goingNotes } from "./going";

describe("goingNames", () => {
  it("names one person alone", () => {
    expect(goingNames(["Dev"])).toBe("Dev");
  });

  it("joins the last two with and", () => {
    expect(goingNames(["Dev", "Priya", "Sofia", "Tom"])).toBe("Dev, Priya, Sofia and Tom");
  });

  it("names three and counts the rest once past four", () => {
    expect(goingNames(["Dev", "Priya", "Sofia", "Tom", "Sam", "Jo", "Alex", "Kit"])).toBe("Dev, Priya, Sofia and 5 more");
  });

  it("is empty for nobody", () => {
    expect(goingNames([])).toBe("");
  });
});

describe("goingNotes", () => {
  it("says who still has dates to add and who is invited", () => {
    expect(goingNotes({ toAddDates: 2, invited: 1 })).toEqual(["2 to add dates", "1 invited"]);
  });

  it("leaves out a count of zero", () => {
    expect(goingNotes({ toAddDates: 0, invited: 3 })).toEqual(["3 invited"]);
    expect(goingNotes({ toAddDates: 0, invited: 0 })).toEqual([]);
  });
});
