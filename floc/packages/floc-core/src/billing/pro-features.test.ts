import { describe, expect, it } from "vitest";

import { FEATURE_PLAN } from "./plans";
import { PRO_FEATURES, proFeatureSentence, proFeatureSummary } from "./pro-features";

const gatedPro = Object.entries(FEATURE_PLAN)
  .filter(([, rule]) => rule.plan === "pro")
  .map(([key]) => key)
  .sort();

describe("PRO_FEATURES", () => {
  it("names every feature the server keeps Pro, and nothing it does not gate (#717)", () => {
    expect(PRO_FEATURES.map((f) => f.key).sort()).toEqual(gatedPro);
  });

  it("tells people Floc reading a forwarded booking is Pro (#717, ADR-050)", () => {
    expect(PRO_FEATURES.map((f) => f.key)).toContain("bookings.autoFile");
  });

  it("no longer sells filled-in booking searches as Pro (#716)", () => {
    expect(JSON.stringify(PRO_FEATURES)).not.toMatch(/search/i);
  });
});

describe("PRO_FEATURES names", () => {
  it("say what Pro adds over Free, never a thing Free can also do (#717)", () => {
    const names = PRO_FEATURES.map((f) => f.name);
    expect(names).not.toContain("Forward your bookings");
    expect(names).not.toContain("Store your own files");
  });
});

describe("proFeatureSentence", () => {
  it("lists each Pro feature once, the last after an and", () => {
    const sentence = proFeatureSentence();
    for (const f of PRO_FEATURES) expect(sentence).toContain(f.phrase);
    expect(sentence).toMatch(new RegExp(`, and ${PRO_FEATURES.at(-1)!.phrase}$`));
  });
});

describe("proFeatureSummary", () => {
  it("names the first three and says there is more, with the same comma before and as the sentence", () => {
    const [a, b, c] = PRO_FEATURES.map((f) => f.tag);
    expect(proFeatureSummary()).toBe(`${a[0].toUpperCase()}${a.slice(1)}, ${b}, ${c}, and more`);
  });
});
