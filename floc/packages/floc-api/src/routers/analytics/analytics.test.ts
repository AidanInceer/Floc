import { describe, expect, it, vi } from "vitest";

import type { Context, FlocPort } from "../../port";
import { appRouter } from "../../router";

const viewer = { id: "u1", name: "Ana", email: "ana@example.com", image: null };
const view = { name: "page.view" as const, path: "/trip/12/money", surface: "ios" as const };

function caller(signedIn: boolean) {
  const recordAnalytics = vi.fn().mockResolvedValue(undefined);
  const ctx: Context = { viewer: signedIn ? viewer : null, port: { recordAnalytics } as unknown as FlocPort };
  return { api: appRouter.createCaller(ctx), recordAnalytics };
}

describe("analytics.track", () => {
  it("passes on the event and never who sent it", async () => {
    const { api, recordAnalytics } = caller(true);
    await api.analytics.track(view);
    expect(recordAnalytics).toHaveBeenCalledWith(view);
  });

  it("refuses an event name that is not on the list", async () => {
    const { api } = caller(true);
    await expect(api.analytics.track({ ...view, name: "made.up" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a caller who is not signed in", async () => {
    const { api, recordAnalytics } = caller(false);
    await expect(api.analytics.track(view)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(recordAnalytics).not.toHaveBeenCalled();
  });
});
