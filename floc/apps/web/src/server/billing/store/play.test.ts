import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isPubSubPush, readPlaySubscription } from "@/server/billing/store/play";

const google = vi.hoisted(() => ({
  request: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    getClient = async () => ({ request: google.request });
  },
  OAuth2Client: class {
    verifyIdToken = google.verifyIdToken;
  },
}));

const SUB = {
  subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
  lineItems: [{ productId: "floc_pro_monthly", expiryTime: "2026-10-01T00:00:00Z" }],
};

beforeEach(() => {
  process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.floc.app";
  process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = JSON.stringify({ client_email: "floc@example.test" });
  process.env.GOOGLE_PLAY_RTDN_AUDIENCE = "https://floc.example/api/billing/play";
  process.env.GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT = "pubsub@example.test";
  google.request.mockReset();
  google.verifyIdToken.mockReset();
});
afterEach(() => {
  delete process.env.GOOGLE_PLAY_PACKAGE_NAME;
  delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  delete process.env.GOOGLE_PLAY_RTDN_AUDIENCE;
  delete process.env.GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT;
});

describe("reading a Play subscription", () => {
  it("is unavailable when the service account is not set", async () => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
    expect(await readPlaySubscription("token")).toBe("unavailable");
  });

  it("asks Google about this package and this token", async () => {
    google.request.mockResolvedValue({ data: SUB });

    expect(await readPlaySubscription("tok/en")).toMatchObject({
      facts: { storeTransactionId: "tok/en", productId: "floc_pro_monthly" },
      replaces: null,
    });
    expect(google.request.mock.calls[0][0].url).toBe(
      "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.floc.app/purchases/subscriptionsv2/tokens/tok%2Fen",
    );
  });

  it("names the purchase an upgrade replaced", async () => {
    google.request.mockResolvedValue({ data: { ...SUB, linkedPurchaseToken: "old" } });
    expect(await readPlaySubscription("new")).toMatchObject({ replaces: "old" });
  });

  it("refuses a token Google does not know", async () => {
    google.request.mockRejectedValue({ response: { status: 410 } });
    expect(await readPlaySubscription("token")).toBe("refused");
  });

  it("refuses a subscription with no product on it", async () => {
    google.request.mockResolvedValue({ data: { ...SUB, lineItems: [] } });
    expect(await readPlaySubscription("token")).toBe("refused");
  });

  it("is unavailable when Google is down", async () => {
    google.request.mockRejectedValue({ response: { status: 503 } });
    expect(await readPlaySubscription("token")).toBe("unavailable");
  });
});

describe("trusting a Pub/Sub push", () => {
  const ticket = (payload: Record<string, unknown>) => ({ getPayload: () => payload });

  it("trusts a token signed for our audience by our push account", async () => {
    google.verifyIdToken.mockResolvedValue(
      ticket({ email: "pubsub@example.test", email_verified: true }),
    );

    expect(await isPubSubPush("Bearer id-token")).toBe(true);
    expect(google.verifyIdToken).toHaveBeenCalledWith({
      idToken: "id-token",
      audience: "https://floc.example/api/billing/play",
    });
  });

  it("refuses a token from any other account", async () => {
    google.verifyIdToken.mockResolvedValue(ticket({ email: "someone@example.test", email_verified: true }));
    expect(await isPubSubPush("Bearer id-token")).toBe(false);
  });

  it("refuses a token that does not verify", async () => {
    google.verifyIdToken.mockRejectedValue(new Error("expired"));
    expect(await isPubSubPush("Bearer id-token")).toBe(false);
  });

  it("refuses a missing header, and everything while unconfigured", async () => {
    expect(await isPubSubPush(null)).toBe(false);
    delete process.env.GOOGLE_PLAY_RTDN_AUDIENCE;
    expect(await isPubSubPush("Bearer id-token")).toBe(false);
  });
});
