import { describe, expect, it } from "vitest";

import { activityKind } from "./activity-kind";

describe("activityKind", () => {
  it.each([
    ["Airport to the riad", "flight"],
    ["Flight home", "flight"],
    ["Drive to Imlil by Asni, about 2 hours", "drive"],
    ["The Tizi n'Tichka road", "drive"],
    ["Romancecar from Shinjuku", "train"],
    ["Shinkansen to Kyoto", "train"],
    ["Ferry to Hvar", "ferry"],
    ["Lunch in the medina", "food"],
    ["Back in Imlil for mint tea", "food"],
    ["Dinner and drums at the camp", "food"],
    ["Easy walk to Aroumd and back", "walk"],
    ["Todra gorge on foot", "walk"],
    ["Set off with the local guide", "walk"],
    ["Hammam", "rest"],
    ["Arrive in Fes", "stay"],
    ["Check in at the ryokan", "stay"],
    ["Frecciarossa, about 2h 15", "train"],
    ["Kayak into a lagoon", "ferry"],
    ["Helicopter over the falls, if you like", "flight"],
    ["Connect home", "flight"],
    ["Gorilla tracking with the rangers", "walk"],
    ["Hot springs at night", "rest"],
    ["Back at camp", "stay"],
    ["Cicchetti in Cannaregio", "food"],
    ["Golden Gai, six seats to a bar", "food"],
    ["Drive to Cancún airport, about 4h", "drive"],
    ["Diamond beach", "sight"],
    ["Jardin Majorelle", "sight"],
  ])("reads %s as %s", (text, kind) => {
    expect(activityKind({ time: "09:00", text })).toBe(kind);
  });

  it("reads time left empty on purpose as free, whatever it says", () => {
    expect(activityKind({ time: "19:00", text: "Free evening by the harbour.", free: true })).toBe("free");
  });

  it("reads a food line that also names a walk as food", () => {
    expect(activityKind({ time: "12:30", text: "Picnic lunch above the river" })).toBe("food");
  });
});
