import { describe, expect, it } from "vitest";

import { SITE_DESCRIPTION } from "./site-description";

describe("SITE_DESCRIPTION", () => {
  it("fits a search result without being cut off", () => {
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(155);
  });
});
