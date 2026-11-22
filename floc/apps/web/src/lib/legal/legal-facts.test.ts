import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DATA_SOURCES } from "./data-sources";
import { DATA_LOCATION, PLACE_OF_BUSINESS } from "./facts";
import { DATA_RECEIVERS } from "./privacy-facts";

const server = (path: string) => readFileSync(join(process.cwd(), "src/server", path), "utf8").toLowerCase();

const CALLED = [
  { file: "itinerary/places.ts", needle: "nominatim", who: "Nominatim" },
  { file: "itinerary/weather.ts", needle: "api.met.no", who: "MET Norway" },
  { file: "money/fx.ts", needle: "frankfurter", who: "Frankfurter" },
  { file: "notifications/expo-push.ts", needle: "expo", who: "Expo" },
  { file: "auth/email.ts", needle: "resend", who: "Resend" },
  { file: "billing/billing.ts", needle: "stripe", who: "Stripe" },
  { file: "maps/leg-routes.ts", needle: "routes.googleapis.com", who: "Google Maps" },
];

describe("what the legal pages say about outside services", () => {
  it("names every outside service the server sends data to", () => {
    const named = DATA_RECEIVERS.map((row) => row.who).join(" ");
    for (const { file, needle, who } of CALLED) {
      expect(server(file), `${file} no longer calls ${who}: change the privacy policy`).toContain(needle);
      expect(named).toContain(who);
    }
  });

  it("credits the source of each kind of outside data", () => {
    expect(DATA_SOURCES.map((s) => s.what)).toEqual(expect.arrayContaining(["Place search", "Weather forecast", "Exchange rates"]));
  });

  it("has a written fix beside every source a paid product may not use freely", () => {
    for (const source of DATA_SOURCES.filter((s) => s.paidUse !== "yes")) expect(source.note, source.what).toBeTruthy();
  });
});

describe("the facts the legal pages state about Floc itself", () => {
  it("states the place of business as a city and country only, never a street address", () => {
    expect(PLACE_OF_BUSINESS).toBe("London, United Kingdom");
  });

  it("names the countries where the website and the database run", () => {
    expect(DATA_LOCATION).toContain("Netherlands");
    expect(DATA_LOCATION).toContain("Ireland");
  });
});
