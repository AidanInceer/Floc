import { describe, expect, it } from "vitest";

import { lastPage, notePage } from "./page-trail";

describe("the page a person was on before a legal page", () => {
  it("is the fallback until a page is seen", () => {
    expect(lastPage("/contact")).toBe("/contact");
  });

  it("is the last page that is not a legal page", () => {
    notePage("/trip/12/money");
    notePage("/contact");
    notePage("/privacy");
    expect(lastPage("/contact")).toBe("/trip/12/money");
  });
});
