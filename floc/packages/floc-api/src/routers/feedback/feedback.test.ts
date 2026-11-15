import { describe, expect, it, vi } from "vitest";

import type { Context, FlocPort } from "../../port";
import { appRouter } from "../../router";

const viewer = { id: "u1", name: "Ana", email: "ana@example.com", image: null };
const words = { message: "The map is slow.", page: "/settings", surface: "android" as const, appVersion: "0.1.0" };

function caller(signedIn: boolean) {
  const sendFeedback = vi.fn().mockResolvedValue("sent");
  const ctx: Context = { viewer: signedIn ? viewer : null, port: { sendFeedback } as unknown as FlocPort };
  return { api: appRouter.createCaller(ctx), sendFeedback };
}

describe("feedback.send", () => {
  it("hands the message and the signed-in person to the host", async () => {
    const { api, sendFeedback } = caller(true);
    expect(await api.feedback.send(words)).toBe("sent");
    expect(sendFeedback).toHaveBeenCalledWith(viewer, words);
  });

  it("refuses a caller who is not signed in", async () => {
    const { api, sendFeedback } = caller(false);
    await expect(api.feedback.send(words)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(sendFeedback).not.toHaveBeenCalled();
  });

  it("refuses a message past the cap", async () => {
    const { api } = caller(true);
    await expect(api.feedback.send({ ...words, message: "x".repeat(2001) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
