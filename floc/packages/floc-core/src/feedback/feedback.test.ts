import { describe, expect, it } from "vitest";

import { FEEDBACK_PROBLEMS, feedbackPage } from "./feedback";

describe("the page a piece of feedback came from", () => {
  it("keeps a path", () => {
    expect(feedbackPage("/trip/12/money")).toBe("/trip/12/money");
  });

  it("drops a query and a fragment, which can hold a link token", () => {
    expect(feedbackPage("/invite/abc?token=secret#x")).toBe("/invite/abc");
  });

  it("is unknown for anything that is not a path", () => {
    expect(feedbackPage("https://elsewhere.example/a")).toBe("unknown");
    expect(feedbackPage(undefined)).toBe("unknown");
    expect(feedbackPage("/a b<script>")).toBe("unknown");
  });

  it("has words for every way a send can fail", () => {
    expect(Object.keys(FEEDBACK_PROBLEMS).sort()).toEqual(["closed", "empty", "failed", "limited"]);
  });
});
