import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutboundEmail } from "@/server/auth/email";
import { writeLimiter } from "@/server/http/write-limiter";

import { feedbackOpen, sendFeedback } from "./feedback";

const priya = { id: "u_priya", name: "Priya Shah", email: "priya@a.seed.floc.test" };
const words = { message: "The Money tab total looks wrong.", page: "/trip/12/money", surface: "web" as const, appVersion: "0.233.1" };

const accepts = (ok: boolean) => vi.fn(async (batch: OutboundEmail[]) => batch.map(() => ok));

const deps = (send = accepts(true)) => ({ send, limiter: writeLimiter({ capacity: 2, perSecond: 0.0001 }), open: () => true });

afterEach(() => vi.unstubAllEnvs());

describe("feedback", () => {
  it("reaches the contact mailbox with the page, the person and the app version", async () => {
    const d = deps();
    expect(await sendFeedback(priya, words, d)).toBe("sent");
    const [mail] = d.send.mock.calls[0][0];
    expect(mail.to).toBe("hello@floc.live");
    expect(mail.replyTo).toBe("priya@a.seed.floc.test");
    expect(mail.subject).toBe("Feedback from Priya Shah");
    expect(mail.quote).toEqual(["The Money tab total looks wrong."]);
    expect(mail.facts).toEqual([
      ["From", "Priya Shah, priya@a.seed.floc.test"],
      ["User", "u_priya"],
      ["Page", "/trip/12/money"],
      ["Surface", "web 0.233.1"],
    ]);
  });

  it("goes to FEEDBACK_TO when that is set", async () => {
    vi.stubEnv("FEEDBACK_TO", "inbox@floc.test");
    const d = deps();
    await sendFeedback(priya, words, d);
    expect(d.send.mock.calls[0][0][0].to).toBe("inbox@floc.test");
  });

  it("keeps each line of a longer message, and cuts it at the cap", async () => {
    const d = deps();
    await sendFeedback(priya, { ...words, message: `One.\n\nTwo.\n${"x".repeat(3000)}` }, d);
    const quote = d.send.mock.calls[0][0][0].quote ?? [];
    expect(quote.slice(0, 2)).toEqual(["One.", "Two."]);
    expect(quote.join("\n").length).toBeLessThanOrEqual(2000);
  });

  it("sends nothing for an empty message", async () => {
    const d = deps();
    expect(await sendFeedback(priya, { ...words, message: "   " }, d)).toBe("empty");
    expect(d.send).not.toHaveBeenCalled();
  });

  it("says failed when the mail provider refuses or throws, so the form can keep the words", async () => {
    expect(await sendFeedback(priya, words, deps(accepts(false)))).toBe("failed");
    expect(await sendFeedback(priya, words, deps(vi.fn<(batch: OutboundEmail[]) => Promise<boolean[]>>().mockRejectedValue(new Error("down"))))).toBe("failed");
  });

  it("stops one person sending again and again", async () => {
    const d = deps();
    await sendFeedback(priya, words, d);
    await sendFeedback(priya, words, d);
    expect(await sendFeedback(priya, words, d)).toBe("limited");
    expect(d.send).toHaveBeenCalledTimes(2);
  });

  it("is closed in production with no mail provider, where a send would only reach the log", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(feedbackOpen()).toBe(false);
    const d = { ...deps(), open: feedbackOpen };
    expect(await sendFeedback(priya, words, d)).toBe("closed");
    expect(d.send).not.toHaveBeenCalled();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    expect(feedbackOpen()).toBe(true);
  });
});
