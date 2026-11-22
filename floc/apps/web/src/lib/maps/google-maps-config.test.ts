import { describe, expect, it } from "vitest";

import { googleMapsConfig } from "./google-maps-config";

describe("googleMapsConfig (rule 11)", () => {
  it("is off when no browser key is set, so the paper map stays", () => {
    expect(googleMapsConfig({})).toBeNull();
    expect(googleMapsConfig({ GOOGLE_MAPS_BROWSER_KEY: "  " })).toBeNull();
  });

  it("reads the browser key and the map's style", () => {
    expect(googleMapsConfig({ GOOGLE_MAPS_BROWSER_KEY: " browser-key ", GOOGLE_MAPS_MAP_ID: "floc-style" })).toEqual({
      key: "browser-key",
      mapId: "floc-style",
    });
  });

  it("uses Google's demo style when none is set", () => {
    expect(googleMapsConfig({ GOOGLE_MAPS_BROWSER_KEY: "browser-key" })?.mapId).toBe("DEMO_MAP_ID");
  });
});
