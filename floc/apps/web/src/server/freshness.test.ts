/**
 * The fact → pages table (ticket 241). Two properties matter and neither is
 * visible at a call site: every fact names at least one page, and every page it
 * names is a route that exists — a renamed tab otherwise leaves a write
 * refreshing a URL nobody serves, and nothing anywhere fails.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NOTE_SCOPES } from "@/db/schema";
import { pagesFor, type Fact, type FactKind } from "@/server/freshness";

const TRIP = 7;

/** One of each fact, so the table can be walked exhaustively. */
const EVERY_FACT: { [K in FactKind]: Extract<Fact, { kind: K }> } = {
  itinerary: { kind: "itinerary", tripId: TRIP },
  tripWindow: { kind: "tripWindow", tripId: TRIP },
  tripDates: { kind: "tripDates", tripId: TRIP },
  tripHeader: { kind: "tripHeader", tripId: TRIP },
  tripOverview: { kind: "tripOverview", tripId: TRIP },
  money: { kind: "money", tripId: TRIP },
  ideas: { kind: "ideas", tripId: TRIP },
  packing: { kind: "packing", tripId: TRIP },
  documents: { kind: "documents", tripId: TRIP },
  tripLinks: { kind: "tripLinks", tripId: TRIP },
  thread: { kind: "thread", tripId: TRIP, scope: "idea" },
  tripList: { kind: "tripList" },
  invites: { kind: "invites" },
  profile: { kind: "profile" },
  accountSettings: { kind: "accountSettings" },
  profileTrips: { kind: "profileTrips" },
  packingKits: { kind: "packingKits" },
  friendship: { kind: "friendship", otherId: "u1" },
};

const facts = Object.values(EVERY_FACT) as Fact[];

/** `/trip/7/days` → `src/app/trip/[id]/days` — the id segment is dynamic. */
function routeExists(path: string): boolean {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((s) => (/^\d+$/.test(s) || s === "u1" ? "[dynamic]" : s));
  const dir = join(process.cwd(), "src/app");
  const walk = (at: string, rest: string[]): boolean => {
    if (rest.length === 0) return existsSync(join(at, "page.tsx"));
    const [head, ...tail] = rest;
    if (head !== "[dynamic]") return existsSync(join(at, head)) && walk(join(at, head), tail);
    return ["[id]", "[userId]", "[token]"].some(
      (d) => existsSync(join(at, d)) && walk(join(at, d), tail),
    );
  };
  return walk(dir, segments);
}

describe("the fact table", () => {
  it("gives every fact somewhere to refresh", () => {
    for (const fact of facts) {
      expect(pagesFor([fact]), fact.kind).not.toHaveLength(0);
    }
  });

  it("only names routes that exist", () => {
    for (const fact of facts) {
      for (const target of pagesFor([fact])) {
        expect(routeExists(target.path), `${fact.kind} → ${target.path}`).toBe(true);
      }
    }
  });

  it("covers every note scope, since a thread hangs off four surfaces", () => {
    for (const scope of NOTE_SCOPES) {
      const pages = pagesFor([{ kind: "thread", tripId: TRIP, scope }]);
      expect(pages, scope).toHaveLength(1);
      expect(routeExists(pages[0].path), scope).toBe(true);
    }
  });
});

describe("composition", () => {
  it("drags the days and the header along when the window moves", () => {
    expect(pagesFor([{ kind: "tripWindow", tripId: TRIP }])).toEqual(
      expect.arrayContaining([
        { path: `/trip/${TRIP}/days` },
        { path: `/trip/${TRIP}/overview` },
        { path: `/trip/${TRIP}/dates` },
        { path: `/trip/${TRIP}`, type: "layout" },
      ]),
    );
  });

  it("refreshes a shared page once when two facts both name it", () => {
    const pages = pagesFor([
      { kind: "itinerary", tripId: TRIP },
      { kind: "tripOverview", tripId: TRIP },
    ]);
    expect(pages.filter((p) => p.path === `/trip/${TRIP}/overview`)).toHaveLength(1);
  });

  it("keeps a page and its layout apart — they are different refreshes", () => {
    const pages = pagesFor([
      { kind: "tripHeader", tripId: TRIP },
      { kind: "tripOverview", tripId: TRIP },
    ]);
    expect(pages).toContainEqual({ path: `/trip/${TRIP}`, type: "layout" });
    expect(pages).toContainEqual({ path: `/trip/${TRIP}/overview` });
  });
});
