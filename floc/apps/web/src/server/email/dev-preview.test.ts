import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutboundEmail } from "./model";
import { emailPreviewOpen, sendSampleTo } from "./dev-preview";

afterEach(() => vi.unstubAllEnvs());

describe("the email preview", () => {
  it("is closed in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(emailPreviewOpen()).toBe(false);
  });

  it("is open in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(emailPreviewOpen()).toBe(true);
  });

  it("sends a sample to the signed-in address, even one written to Floc's own mailbox", async () => {
    const sent: OutboundEmail[] = [];
    const ok = await sendSampleTo("feedback", "ada@floc.test", async (batch) => {
      sent.push(...batch);
      return batch.map(() => true);
    });
    expect(ok).toBe(true);
    expect(sent.map((m) => m.to)).toEqual(["ada@floc.test"]);
    expect(sent[0].replyTo).toBeUndefined();
  });

  it("sends nothing for a sample it does not know", async () => {
    const send = vi.fn();
    expect(await sendSampleTo("nope", "ada@floc.test", send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
