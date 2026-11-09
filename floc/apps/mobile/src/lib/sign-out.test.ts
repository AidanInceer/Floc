import { describe, expect, it, vi } from "vitest";

const order: string[] = [];
vi.mock("./api", () => ({ queryClient: { clear: () => order.push("cache") } }));
vi.mock("./auth", () => ({ signOut: async () => order.push("session") }));
vi.mock("./notes/live-cache", () => ({ forgetCachedNotes: () => order.push("notes") }));

const { signOutHere } = await import("./sign-out");

describe("signing out on this phone", () => {
  it("forgets the notes and the cached trips before the session", async () => {
    await signOutHere();
    expect(order).toEqual(["notes", "cache", "session"]);
  });
});
