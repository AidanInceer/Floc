import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const receiveBookingMail = vi.fn();
vi.mock("@/server/documents/inbound/booking-mail", () => ({ receiveBookingMail }));

const { POST } = await import("./route");

const key = Buffer.from("route-test-key");
const saved = { ...process.env };

beforeEach(() => {
  process.env.RESEND_WEBHOOK_SECRET = `whsec_${key.toString("base64")}`;
  process.env.RESEND_API_KEY = "re_test";
  process.env.FLOC_INBOUND_DOMAIN = "in.floc.test";
  process.env.FLOC_FILES_DIR = "/tmp/floc-files";
  receiveBookingMail.mockReset();
});
afterEach(() => {
  process.env = { ...saved };
});

function signed(event: unknown) {
  const body = JSON.stringify(event);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", key).update(`m1.${timestamp}.${body}`).digest("base64");
  return new Request("http://localhost/api/inbound", {
    method: "POST",
    body,
    headers: { "svix-id": "m1", "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` },
  });
}

const received = {
  type: "email.received",
  data: { email_id: "e1", from: "ada@example.test", to: ["bookings@in.floc.test"], received_for: ["x@in.floc.test"], subject: "Hotel" },
};

describe("the inbound mail webhook (#328)", () => {
  it("hands a signed received email on, with every address it was sent to", async () => {
    const response = await POST(signed(received));
    expect(response.status).toBe(200);
    expect(receiveBookingMail).toHaveBeenCalledWith(
      { emailId: "e1", from: "ada@example.test", to: ["bookings@in.floc.test", "x@in.floc.test"] },
      expect.anything(),
    );
  });

  it("drops a received event that names no email", async () => {
    const response = await POST(signed({ type: "email.received", data: { from: "ada@example.test" } }));
    expect(response.status).toBe(200);
    expect(receiveBookingMail).not.toHaveBeenCalled();
  });

  it("asks Resend whether the From was proven, for this email", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ authentication: { dkim: "pass" } })));
    vi.stubGlobal("fetch", fetchMock);
    await POST(signed(received));
    const [, deps] = receiveBookingMail.mock.calls[0] as [unknown, { received: () => Promise<{ proven: boolean }> }];

    expect((await deps.received()).proven).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails/receiving/e1", expect.anything());
    vi.unstubAllGlobals();
  });

  it("refuses an unsigned body without reading it", async () => {
    const response = await POST(new Request("http://localhost/api/inbound", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
    expect(receiveBookingMail).not.toHaveBeenCalled();
  });

  it("ignores other event types", async () => {
    const response = await POST(signed({ type: "email.sent", data: {} }));
    expect(response.status).toBe(200);
    expect(receiveBookingMail).not.toHaveBeenCalled();
  });

  it("answers not configured when inbound mail is not set up (rule 11)", async () => {
    delete process.env.FLOC_INBOUND_DOMAIN;
    const response = await POST(signed(received));
    expect(response.status).toBe(503);
  });
});
