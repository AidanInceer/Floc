import { describe, expect, it } from "vitest";

import { LINK_KINDS } from "./trip-links";
import { PAGE_ICONS, PAGE_ICON_ART, PAGE_ICON_LABELS, readPageIcon } from "./page-icons";

describe("page icons", () => {
  it("offers eighteen, three rows of six, each named", () => {
    expect(PAGE_ICONS).toHaveLength(18);
    expect(PAGE_ICONS.every((icon) => PAGE_ICON_LABELS[icon].length > 0)).toBe(true);
  });

  it("draws every trip-link kind, so a chip and a page share one hand", () => {
    expect(LINK_KINDS.every((kind) => kind in PAGE_ICON_ART)).toBe(true);
  });

  it("reads an unknown icon as none", () => {
    expect(readPageIcon("food")).toBe("food");
    expect(readPageIcon("🍕")).toBeNull();
    expect(readPageIcon(null)).toBeNull();
  });
});
