import { describe, expect, it } from "vitest";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { checkoutTerms } from "./checkout-terms";

describe("what the checkout says before payment", () => {
  it("links the terms and says Pro starts now with 14 days to cancel for a full refund", () => {
    const { submitMessage } = checkoutTerms("https://floc.live");
    expect(submitMessage).toContain("[Terms of use](https://floc.live/terms)");
    expect(submitMessage).toContain("Pro starts now");
    expect(submitMessage).toContain("14 days");
    expect(submitMessage).toContain("full refund");
  });

  it("records on the subscription which terms the buyer saw", () => {
    expect(checkoutTerms("https://floc.live").metadata).toEqual({ termsVersion: TERMS_VERSION });
  });
});
