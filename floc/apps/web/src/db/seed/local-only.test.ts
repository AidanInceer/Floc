import { describe, expect, it } from "vitest";

import { assertLocalDatabase } from "./local-only.ts";

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
