import { describe, expect, it } from "vitest";

import { safeHref } from "./safe-href";

describe("a link a page may carry", () => {
  it("keeps web, mail and phone links", () => {
    expect(safeHref("https://www.cp.pt")).toBe("https://www.cp.pt");
    expect(safeHref("mailto:ada@example.test")).toBe("mailto:ada@example.test");
    expect(safeHref("tel:+441234")).toBe("tel:+441234");
  });

  it("refuses a script, whatever its case or padding", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("  JavaScript:alert(1)")).toBeNull();
    expect(safeHref("java\tscript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,<script>")).toBeNull();
  });

  it("refuses a path or anything without a scheme", () => {
    expect(safeHref("/trip/1")).toBeNull();
    expect(safeHref("www.cp.pt")).toBeNull();
    expect(safeHref("")).toBeNull();
  });
});
