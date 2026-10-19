import { describe, expect, it } from "vitest";

import { day } from "./day";

describe("day", () => {
  it("reads each line as a time and what happens then", () => {
    expect(day("Into the hills", ["09:40 Romancecar from Shinjuku", "13:00 Open-air museum"])).toEqual({
      title: "Into the hills",
      items: [
        { time: "09:40", text: "Romancecar from Shinjuku" },
        { time: "13:00", text: "Open-air museum" },
      ],
    });
  });

  it("marks a line that starts with a tilde as time left empty on purpose", () => {
    expect(day("Nothing", ["14:00 ~ Empty on purpose."]).items).toEqual([{ time: "14:00", text: "Empty on purpose.", free: true }]);
  });

  it("names the day's one highlight when it has one", () => {
    expect(day("Dawn", ["06:00 The gates"], "Fushimi Inari at dawn").highlight).toBe("Fushimi Inari at dawn");
  });

  it("keeps a malformed time as written, so the listing check can name it", () => {
    expect(day("Late", ["9:00 Breakfast"]).items[0].time).toBe("9:00");
  });
});
