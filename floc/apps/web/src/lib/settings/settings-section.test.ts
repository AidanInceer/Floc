import { describe, expect, it } from "vitest";

import { settingsHref, settingsSectionFor } from "./settings-section";

describe("settingsSectionFor", () => {
  it("opens the section a link asks for", () => {
    expect(settingsSectionFor({ section: "notifications" }, false)).toBe("notifications");
  });

  it("opens nothing when no section is asked for", () => {
    expect(settingsSectionFor({}, false)).toBeNull();
  });

  it("opens nothing for a section that does not exist", () => {
    expect(settingsSectionFor({ section: "nope" }, false)).toBeNull();
  });

  it("opens Pro when a checkout returns", () => {
    expect(settingsSectionFor({ billing: "done" }, false)).toBe("billing");
  });

  it("opens Privacy for an old Pro link while Pro is switched off", () => {
    expect(settingsSectionFor({ section: "billing" }, true)).toBe("privacy");
  });
});

describe("settingsHref", () => {
  it("lands an old settings link on the same section of Profile", () => {
    expect(settingsHref({ section: "billing" })).toBe("/profile?section=billing#settings-billing");
  });

  it("carries a checkout return to Profile", () => {
    expect(settingsHref({ billing: "cancelled" })).toBe("/profile?billing=cancelled#settings-billing");
  });

  it("lands a bare settings link on Profile", () => {
    expect(settingsHref({})).toBe("/profile");
  });
});
