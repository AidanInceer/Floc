import { REGIONS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { skinFor } from "@/components/explore/listing";
import { regionTone } from "@/components/explore/trip/region-tone";

describe("regionTone", () => {
  // The page for a listing must wear the colour its tag wears on /explore.
  it.each(REGIONS)("%s fills its marks with the same pastel as its Explore tag", (region) => {
    const [fill, ink] = skinFor({ region } as Parameters<typeof skinFor>[0]).split(" ");
    const mark = regionTone(region).mark.split(" ");
    expect(mark).toContain(fill);
    expect(mark).toContain(ink);
  });
});
