import { describe, expect, it } from "vitest";

import { pageCss } from "./page-css";

describe("pageCss", () => {
  it("declares every token for the theme, resolved, with the phone's own font stacks", () => {
    const light = pageCss("light");
    expect(light).toContain("--sheet: #ffffff;");
    expect(light).toContain("--tone-butter: #fbeac8;");
    expect(light).toContain('--sans: "Instrument Sans", system-ui;');
    expect(light).toContain("--text-base: 15px;");
    expect(light).not.toContain("--font-body-face");
    expect(pageCss("dark")).toContain("--tone-butter: #4a4230;");
  });

  it("names the font files it is given, and none it is not", () => {
    expect(pageCss("light", { sans: "file:///s.ttf" })).toContain('@font-face { font-family: "Instrument Sans"; font-weight: 400; src: url("file:///s.ttf"); }');
    expect(pageCss("light")).not.toContain("@font-face");
  });
});
