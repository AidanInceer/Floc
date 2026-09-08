import { describe, expect, it } from "vitest";

import { diffParity, paritySummary, type ParityManifest } from "./parity";

const manifest = (procedures: ParityManifest["procedures"]): ParityManifest => ({
  procedures,
  webOnly: [],
});

describe("diffParity", () => {
  it("passes when the manifest matches both sides", () => {
    const result = diffParity(
      ["trips.list", "trips.setArchived"],
      ["trips.list"],
      manifest({
        "trips.list": { mobile: "yes" },
        "trips.setArchived": { mobile: "planned", why: "#301" },
      }),
    );
    expect(result).toEqual([]);
  });

  it("catches a procedure nobody has ruled on", () => {
    const result = diffParity(["trips.list"], [], manifest({}));
    expect(result).toEqual([expect.stringContaining("not in parity.json")]);
  });

  it("catches a claim the phone does not back up", () => {
    const result = diffParity(["trips.list"], [], manifest({ "trips.list": { mobile: "yes" } }));
    expect(result).toEqual([expect.stringContaining("no mobile file calls it")]);
  });

  it("catches a gap the phone has already closed", () => {
    const result = diffParity(
      ["trips.list"],
      ["trips.list"],
      manifest({ "trips.list": { mobile: "planned", why: "#301" } }),
    );
    expect(result).toEqual([expect.stringContaining('change parity.json to "yes"')]);
  });

  it("catches an entry for a procedure that has been deleted", () => {
    const result = diffParity([], [], manifest({ "trips.gone": { mobile: "yes" } }));
    expect(result).toEqual([expect.stringContaining("no longer declares it")]);
  });

  it("demands a reason for every deliberate gap", () => {
    const result = diffParity(["trips.list"], [], manifest({ "trips.list": { mobile: "planned" } }));
    expect(result).toEqual([expect.stringContaining('needs a "why"')]);
  });
});

describe("paritySummary", () => {
  it("counts each state", () => {
    const summary = paritySummary({
      procedures: {
        a: { mobile: "yes" },
        b: { mobile: "planned", why: "#1" },
        c: { mobile: "wontfix", why: "browser only" },
      },
      webOnly: [{ id: "ideas", path: "x", status: "planned", why: "#2" }],
    });
    expect(summary).toBe("1/3 procedures on the app (1 planned, 1 wontfix) · 1 web-only feature(s)");
  });
});
