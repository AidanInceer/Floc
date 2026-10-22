import { describe, expect, it } from "vitest";

import { readCopyForm } from "./copy-choice";

const form = (fields: Record<string, string>) => ({ get: (name: string) => fields[name] ?? null });

describe("readCopyForm", () => {
  it("reads a month and both switches", () => {
    expect(readCopyForm(form({ presetId: "japan-golden-route", month: "4", ideas: "on", events: "on" }))).toEqual({
      presetId: "japan-golden-route",
      month: 4,
      ideas: true,
      events: true,
    });
  });

  it("reads Decide later, and a switch left off", () => {
    expect(readCopyForm(form({ presetId: "x", month: "later", ideas: "on" }))).toEqual({ presetId: "x", month: null, ideas: true, events: false });
  });

  it("reads a form that only names the listing as an undated copy", () => {
    expect(readCopyForm(form({ presetId: "x" })).month).toBeNull();
  });

  it.each(["0", "13", "4.5", ""])("reads %j as no month", (month) => {
    expect(readCopyForm(form({ presetId: "x", month })).month).toBeNull();
  });
});
