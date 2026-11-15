import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DATA_SOURCES } from "./data-sources";
import { DATA_RECEIVERS } from "./privacy-facts";

const server = (path: string) => readFileSync(join(process.cwd(), "src/server", path), "utf8").toLowerCase();

// Each file that sends data out, the word that proves it still does, and the name the privacy policy must use.
const CALLED = [
  { file: "itinerary/places.ts", needle: "nominatim", who: "Nominatim" },
  { file: "itinerary/weather.ts", needle: "open-meteo", who: "Open-Meteo" },
  { file: "money/fx.ts", needle: "frankfurter", who: "Frankfurter" },
  { file: "notifications/expo-push.ts", needle: "expo", who: "Expo" },
  { file: "auth/email.ts", needle: "resend", who: "Resend" },
  { file: "billing/billing.ts", needle: "stripe", who: "Stripe" },
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
