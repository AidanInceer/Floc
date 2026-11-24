import { mcp } from "@better-auth/mcp";
import { jwt } from "better-auth/plugins";
import { getTableColumns, type Table } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import * as schema from "./schema";

const pluginTables = {
  ...mcp({
    loginPage: "/login",
    consentPage: "/connect",
    resource: "http://localhost:3000/api/mcp",
  }).schema,
  ...jwt().schema,
};

const tableNamed = (name: string) => (schema as unknown as Record<string, Table | undefined>)[name];

describe("agent sign-in tables (#354)", () => {
  it("cover all eight tables Better Auth needs", () => {
    expect(Object.keys(pluginTables).sort()).toEqual([
      "jwks",
      "oauthAccessToken",
      "oauthClient",
      "oauthClientAssertion",
      "oauthClientResource",
      "oauthConsent",
      "oauthRefreshToken",
      "oauthResource",
    ]);
  });

  it.each(Object.entries(pluginTables))("%s has a column for every field Better Auth writes", (name, table) => {
    const drizzleTable = tableNamed(name);
    expect(drizzleTable, `${name} is missing from schema.ts`).toBeDefined();
    const columns = Object.keys(getTableColumns(drizzleTable!));
    expect(columns).toEqual(expect.arrayContaining(["id", ...Object.keys(table.fields)]));
  });
});
