import { describe, expect, it } from "vitest";

import { pageDocumentName, pagesDocumentName, readDocumentName } from "./live-names";

describe("live document names", () => {
  it("reads back a page's and a trip's page list", () => {
    expect(readDocumentName(pageDocumentName(7, 12))).toEqual({ kind: "page", tripId: 7, pageId: 12 });
    expect(readDocumentName(pagesDocumentName(7))).toEqual({ kind: "pages", tripId: 7 });
  });

  it("refuses anything else", () => {
    for (const name of ["", "trip-notes:7", "trip-page:7", "trip-page:7:0", "trip-page:x:1", "trip-pages:7:1", "trip-page:7:1:2", "trip-page:1e3:1", "trip-pages:-1"]) {
      expect(readDocumentName(name)).toBeNull();
    }
  });
});
