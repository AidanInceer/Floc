import { describe, expect, it } from "vitest";

import { appleAssociation, assetLinks } from "./app-links";

describe("Android asset links", () => {
  it("is nothing until the signing fingerprints are set", () => {
    expect(assetLinks(undefined)).toBeNull();
    expect(assetLinks(" ")).toBeNull();
  });

  it("vouches for the app with every fingerprint given", () => {
    expect(assetLinks("AA:BB, CC:DD")).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.floc.app",
          sha256_cert_fingerprints: ["AA:BB", "CC:DD"],
        },
      },
    ]);
  });
});

describe("Apple app site association", () => {
  it("is nothing until the team id is set", () => {
    expect(appleAssociation(undefined)).toBeNull();
  });

  it("hands the app only the paths it can open", () => {
    expect(appleAssociation("TEAM123")).toEqual({
      applinks: {
        details: [
          {
            appIDs: ["TEAM123.com.floc.app"],
            components: [{ "/": "/trip/*" }, { "/": "/friends" }, { "/": "/inbox" }],
          },
        ],
      },
    });
  });
});
