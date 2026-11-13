import { describe, expect, it } from "vitest";

import {
  BOOKING_INBOX_BYTES, bookingInboxCutoff, bookingInboxDaysLeft, bookingInboxDeleteCutoff,
  bookingInboxLeftWords, bookingInboxNote, bookingsAddress,
} from "./booking-inbox";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2027, 0, 10, 12));
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

describe("a file's time in Bookings", () => {
  it("counts whole days left on the list, so the last day reads 1", () => {
    expect(bookingInboxDaysLeft(NOW, NOW)).toBe(7);
    expect(bookingInboxDaysLeft(ago(6.5), NOW)).toBe(1);
    expect(bookingInboxDaysLeft(ago(9), NOW)).toBe(0);
    expect(bookingInboxLeftWords(1)).toBe("1 day left");
    expect(bookingInboxLeftWords(5)).toBe("5 days left");
  });

  it("leaves the list after a week and is deleted after a month", () => {
    expect(bookingInboxCutoff(NOW)).toEqual(ago(7));
    expect(bookingInboxDeleteCutoff(NOW)).toEqual(ago(30));
    expect(bookingInboxNote).toBe("A file leaves this list after 7 days and is deleted after 30");
  });

  it("holds as much as a free trip", () => {
    expect(BOOKING_INBOX_BYTES).toBe(200 * 1024 ** 2);
  });
});

describe("the shared address", () => {
  it("is bookings@ on the inbound domain, whatever its case", () => {
    expect(bookingsAddress(" In.Floc.Live ")).toBe("bookings@in.floc.live");
  });

  it("is nothing without a domain", () => {
    expect(bookingsAddress(null)).toBeNull();
    expect(bookingsAddress("  ")).toBeNull();
    expect(bookingsAddress(undefined)).toBeNull();
  });
});
