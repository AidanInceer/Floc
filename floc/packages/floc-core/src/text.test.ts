/** The text caps (ticket 113). */
import { describe, expect, it } from "vitest";

import { capRequiredText, capText, TEXT_CAPS } from "./text";

describe("capText", () => {
  it("trims, and treats an empty result as not-set", () => {
    expect(capText("  Lisbon  ", "placeName")).toBe("Lisbon");
    expect(capText("   ", "placeName")).toBeNull();
    expect(capText(null, "placeName")).toBeNull();
    expect(capText(undefined, "placeName")).toBeNull();
  });

  it("truncates rather than rejecting", () => {
    const long = "x".repeat(TEXT_CAPS.eventNote + 1000);
    expect(capText(long, "eventNote")).toHaveLength(TEXT_CAPS.eventNote);
  });

  it("leaves anything under the cap alone", () => {
    expect(capText("Ferry tickets", "expenseDescription")).toBe("Ferry tickets");
  });

  it("coerces a non-string rather than throwing — FormData yields File too", () => {
    expect(capText(42, "displayName")).toBe("42");
  });
});

describe("capRequiredText", () => {
  it("keeps an empty string empty, so the caller can reject it itself", () => {
    expect(capRequiredText("   ", "eventNote")).toBe("");
    expect(capRequiredText(null, "eventNote")).toBe("");
  });

  it("truncates to the same cap", () => {
    expect(capRequiredText("y".repeat(500), "eventTitle")).toHaveLength(
      TEXT_CAPS.eventTitle,
    );
  });
});

describe("the caps themselves", () => {
  it("are all positive, so nothing is capped to nothing by a typo", () => {
    for (const [name, value] of Object.entries(TEXT_CAPS)) {
      expect(value, name).toBeGreaterThan(0);
    }
  });
});
