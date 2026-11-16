import { beforeAll, describe, expect, it, vi } from "vitest";

import { renderEmail } from "./render";
import { EMAIL_SAMPLES } from "./samples";

const NOW = new Date("2026-11-15T14:20:00Z");

beforeAll(() => vi.stubEnv("BETTER_AUTH_URL", "https://floc.live"));

describe.each(EMAIL_SAMPLES)("the $name email", ({ build }) => {
  const mail = () => build("priya@example.com");

  it("draws the same HTML as before", () => {
    expect(renderEmail(mail(), { now: NOW, base: "https://floc.live" }).html).toMatchSnapshot();
  });

  it("writes the same text as before", () => {
    expect(renderEmail(mail(), { now: NOW, base: "https://floc.live" }).text).toMatchSnapshot();
  });
});

it("covers every email the catalogue and the notice builder send", () => {
  expect(EMAIL_SAMPLES.map((s) => s.key)).toEqual(["verify", "reset", "unproven", "nothing", "partly", "invited", "notice", "digest", "feedback"]);
});
