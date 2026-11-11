import { describe, expect, it, vi } from "vitest";

import { clearNotesCopies } from "./notes-copies";

describe("clearNotesCopies", () => {
  it("deletes each offline notes page and leaves other stores alone", async () => {
    const deleteDatabase = vi.fn();
    await clearNotesCopies({
      databases: async () => [{ name: "floc-notes:trip-1-page-2:abc" }, { name: "something-else" }, {}],
      deleteDatabase,
    });
    expect(deleteDatabase.mock.calls).toEqual([["floc-notes:trip-1-page-2:abc"]]);
  });

  it("does nothing, and does not throw, in a browser with no storage or no list of stores", async () => {
    await expect(clearNotesCopies(undefined)).resolves.toBeUndefined();
    await expect(
      clearNotesCopies({
        databases: async () => {
          throw new DOMException("denied", "SecurityError");
        },
        deleteDatabase: vi.fn(),
      }),
    ).resolves.toBeUndefined();
  });
});
