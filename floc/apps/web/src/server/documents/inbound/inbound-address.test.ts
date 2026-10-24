import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { inboundAddress, tripForInboundAddress, tripInboxAddress } from "./inbound-address";

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

const previous = process.env.FLOC_INBOUND_DOMAIN;
beforeEach(() => {
  process.env.FLOC_INBOUND_DOMAIN = "in.floc.test";
});
afterEach(() => restore("FLOC_INBOUND_DOMAIN", previous));

describe("a trip's forwarding address (#328)", () => {
  it("reads back to the trip it was made for", () => {
    const address = inboundAddress(42)!;
    expect(address).toMatch(/^trip-42-[a-z0-9]+@in\.floc\.test$/);
    expect(tripForInboundAddress(address)).toBe(42);
  });

  it("is the same address every time", () => {
    expect(inboundAddress(42)).toBe(inboundAddress(42));
  });

  it("refuses an address with another trip's number on it", () => {
    const signature = inboundAddress(42)!.split("@")[0].split("-")[2];
    expect(tripForInboundAddress(`trip-43-${signature}@in.floc.test`)).toBeNull();
  });

  it("refuses a made-up address", () => {
    expect(tripForInboundAddress("trip-42-aaaaaaaaaaaa@in.floc.test")).toBeNull();
    expect(tripForInboundAddress("hello@in.floc.test")).toBeNull();
    expect(tripForInboundAddress("not an address")).toBeNull();
  });

  it("refuses the right local part at another domain", () => {
    const local = inboundAddress(42)!.split("@")[0];
    expect(tripForInboundAddress(`${local}@elsewhere.test`)).toBeNull();
  });

  it("reads an address a mail client wrote in capitals or with a display name", () => {
    const address = inboundAddress(42)!;
    expect(tripForInboundAddress(address.toUpperCase())).toBe(42);
    expect(tripForInboundAddress(`Sicily trip <${address}>`)).toBe(42);
  });

  it("is shown only when mail can come in and files can land (rule 11)", () => {
    const saved = { secret: process.env.RESEND_WEBHOOK_SECRET, files: process.env.FLOC_FILES_DIR };
    process.env.RESEND_WEBHOOK_SECRET = "whsec_x";
    process.env.FLOC_FILES_DIR = "/tmp/floc-files";
    expect(tripInboxAddress(42)).toBe(inboundAddress(42));

    delete process.env.FLOC_FILES_DIR;
    expect(tripInboxAddress(42)).toBeNull();

    process.env.FLOC_FILES_DIR = "/tmp/floc-files";
    delete process.env.RESEND_WEBHOOK_SECRET;
    expect(tripInboxAddress(42)).toBeNull();

    restore("RESEND_WEBHOOK_SECRET", saved.secret);
    restore("FLOC_FILES_DIR", saved.files);
  });

  it("has no address when inbound mail is not set up (rule 11)", () => {
    delete process.env.FLOC_INBOUND_DOMAIN;
    expect(inboundAddress(42)).toBeNull();
    expect(tripForInboundAddress("trip-42-aaaaaaaaaaaa@in.floc.test")).toBeNull();
  });
});
