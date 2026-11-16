import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

// The shared setup stubs `sendEmails`; this suite needs the real one.
const realEmail = await vi.importActual<typeof import("../email")>("../email");

const mail = { to: "hello@floc.live", subject: "Feedback from Priya", lines: ["The map is slow."], replyTo: "priya@a.seed.floc.test" };

beforeEach(() => {
  send.mockReset();
  vi.stubEnv("RESEND_API_KEY", "re_test");
});
afterEach(() => vi.unstubAllEnvs());

describe("sending through the mail provider", () => {
  it("says the mail was accepted, and passes on where an answer goes (#271)", async () => {
    send.mockResolvedValue({ data: { id: "1" }, error: null });
    expect(await realEmail.sendEmails([mail])).toEqual([true]);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "hello@floc.live", replyTo: "priya@a.seed.floc.test" }));
  });

  it("sends an HTML part and a plain-text part of the same mail (#653)", async () => {
    send.mockResolvedValue({ data: { id: "3" }, error: null });
    await realEmail.sendEmails([mail]);
    const sent = send.mock.calls[0][0];
    expect(sent.html.replace(/\u00a0/g, " ")).toContain("The map is slow.");
    expect(sent.text).toContain("The map is slow.");
    expect(sent.text).not.toMatch(/<[a-z]/i);
  });

  it("says so when the provider refuses the mail", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    expect(await realEmail.sendEmails([mail])).toEqual([false]);
  });

  it("sends no reply address when the mail has none", async () => {
    send.mockResolvedValue({ data: { id: "2" }, error: null });
    await realEmail.sendEmails([{ to: "ada@floc.test", subject: "Hello", lines: ["Hi"] }]);
    expect(send.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });
});
