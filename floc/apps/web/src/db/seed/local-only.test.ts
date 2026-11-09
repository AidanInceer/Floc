import { describe, expect, it } from "vitest";

import { resolve } from "node:path";

import { assertClearableFilesDir, assertLocalDatabase } from "./local-only.ts";

describe("assertLocalDatabase", () => {
  it("allows a local file database outside production", () => {
    expect(() =>
      assertLocalDatabase({ NODE_ENV: "development", TURSO_DATABASE_URL: "file:./local.db" }),
    ).not.toThrow();
  });

  it("allows the default database when no url is set", () => {
    expect(() => assertLocalDatabase({ NODE_ENV: "development" })).not.toThrow();
  });

  it("refuses production", () => {
    expect(() =>
      assertLocalDatabase({ NODE_ENV: "production", TURSO_DATABASE_URL: "file:./local.db" }),
    ).toThrow(/Refusing/);
  });

  it("refuses a hosted database", () => {
    expect(() =>
      assertLocalDatabase({ NODE_ENV: "development", TURSO_DATABASE_URL: "libsql://floc.turso.io" }),
    ).toThrow(/Refusing/);
  });
});

describe("assertClearableFilesDir", () => {
  const web = resolve("/repo/floc/apps/web");

  it("allows the uploads folder under the web app", () => {
    expect(() => assertClearableFilesDir(resolve(web, ".floc/uploads"), web)).not.toThrow();
  });

  it("allows a task worktree's own files folder", () => {
    expect(() => assertClearableFilesDir(resolve("/repo/.floc/files"), web)).not.toThrow();
  });

  it("refuses anything else, and the roots themselves", () => {
    for (const target of ["/repo", "/repo/.floc", "/repo/floc", web, "/elsewhere/files"]) {
      expect(() => assertClearableFilesDir(resolve(target), web)).toThrow(/Refusing/);
    }
  });
});
