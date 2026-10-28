import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { mimeOf, studioFile, tokensCss } from "./serve.ts";

let repo: string;
let studio: string;
const put = (file: string) => {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, "x");
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "floc-serve-"));
  studio = join(repo, "studio");
  put(join(repo, "floc", "font.woff2"));
  put(join(studio, "shared", "engine.js"));
  put(join(studio, "_studio", "studio.js"));
  put(join(studio, "scenes", "a", "index.html"));
});

describe("studioFile", () => {
  it.each([
    ["/floc/font.woff2", ["floc", "font.woff2"]],
    ["/shared/engine.js", ["studio", "shared", "engine.js"]],
    ["/_studio/studio.js", ["studio", "_studio", "studio.js"]],
    ["/a/index.html", ["studio", "scenes", "a", "index.html"]],
  ])("maps %s", (url, parts) => {
    expect(studioFile({ repo, studio }, url)).toBe(join(repo, ...parts));
  });

  it.each(["/a", "/missing.html", "/../shared/engine.js", "/shared/../../floc/font.woff2"])("refuses %s", (url) => {
    expect(studioFile({ repo, studio }, url)).toBeUndefined();
  });
});

describe("tokens", () => {
  it("declares light and dark tokens and the three faces", () => {
    expect(tokensCss).toMatch(/:root \{\n {2}--font-display-face/);
    expect(tokensCss).toContain(':root[data-theme="dark"]');
  });

  it("names a type by extension", () => {
    expect(mimeOf("a.woff2")).toBe("font/woff2");
    expect(mimeOf("a.bin")).toBe("application/octet-stream");
  });
});
