import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { bookingsInboxAddress, isBookingsAddress } from "./inbound-address";

const saved = { ...process.env };

beforeEach(() => {
  process.env.FLOC_INBOUND_DOMAIN = "In.Floc.Test";
  process.env.RESEND_WEBHOOK_SECRET = "whsec_x";
  process.env.FLOC_FILES_DIR = "/tmp/floc-files";
});
afterEach(() => {
  process.env = { ...saved };
});

describe("the shared bookings address (#559)", () => {
  it("is one address for everyone, on the inbound domain", () => {
    expect(bookingsInboxAddress()).toBe("bookings@in.floc.test");
  });

  it("is hidden when mail cannot come in or files cannot land (rule 11)", () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    expect(bookingsInboxAddress()).toBeNull();
    process.env.RESEND_WEBHOOK_SECRET = "whsec_x";
    delete process.env.FLOC_FILES_DIR;
    expect(bookingsInboxAddress()).toBeNull();
    process.env.FLOC_FILES_DIR = "/tmp/floc-files";
    delete process.env.FLOC_INBOUND_DOMAIN;
    expect(bookingsInboxAddress()).toBeNull();
  });

  it("knows its own address, bare or with a name, whatever the case", () => {
    expect(isBookingsAddress("bookings@in.floc.test")).toBe(true);
    expect(isBookingsAddress("Floc <Bookings@IN.FLOC.TEST>")).toBe(true);
  });

  it("refuses an old per-trip address, another mailbox and another domain", () => {
    expect(isBookingsAddress("trip-1-aaaaaaaaaaaa@in.floc.test")).toBe(false);
    expect(isBookingsAddress("hello@in.floc.test")).toBe(false);
    expect(isBookingsAddress("bookings@evil.test")).toBe(false);
    delete process.env.FLOC_INBOUND_DOMAIN;
    expect(isBookingsAddress("bookings@in.floc.test")).toBe(false);
  });
});
