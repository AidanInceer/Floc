import { describe, expect, it } from "vitest";

import { emails } from "./catalogue";

const BOOKINGS = "bookings@floc.test";
const RECEIVED = new Date("2026-11-15T14:20:00Z");

describe("account mail", () => {
  it("asks to confirm an address on a card, with a credential link kept out of logs", () => {
    const mail = emails.verifyEmail({ to: "ada@floc.test", url: "https://floc.test/verify?t=1" });
    expect(mail).toMatchObject({ layout: "card", heading: "Confirm your email", sensitive: true, cta: { label: "Confirm email" } });
    expect(mail.why).toMatch(/used to sign up to Floc/);
    expect(mail.settingsUrl).toBeUndefined();
  });

  it("resets a password on a card, and never offers to turn it off", () => {
    const mail = emails.resetPassword({ to: "ada@floc.test", url: "https://floc.test/reset?t=1" });
    expect(mail).toMatchObject({ layout: "card", heading: "Choose a new password", sensitive: true });
    expect(mail.why).toMatch(/password reset was asked for/);
    expect(mail.settingsUrl).toBeUndefined();
  });
});

describe("replies to a forwarded booking", () => {
  it("says an unproven mail saved nothing, and what to do instead", () => {
    const mail = emails.inboundUnproven({ to: "ada@floc.test", bookings: BOOKINGS, received: RECEIVED });
    expect(mail.subject).toBe("We couldn't confirm that email came from you");
    expect(mail.box).toEqual({ title: "Sun 15 Nov, 14:20", status: "Not saved" });
    expect(mail.lines[0]).not.toMatch(/^Nothing was saved/);
    expect(mail.why).toBe(`You got this because an email from this address reached ${BOOKINGS}.`);
    expect(mail.facts).toEqual([["Sent to", BOOKINGS], ["Saved", "Nothing"]]);
    expect(mail.steps).toEqual(["Open Bookings on Floc.", "Upload the files there."]);
    expect(mail.cta?.url).toMatch(/\/bookings$/);
  });

  it("says a mail with nothing attached saved nothing", () => {
    const mail = emails.inboundNothingAttached({ to: "ada@floc.test", bookings: BOOKINGS, received: RECEIVED });
    expect(mail.subject).toBe("Nothing was saved from your email");
    expect(mail.box).toEqual({ title: "Sun 15 Nov, 14:20", status: "Nothing saved" });
    expect(mail.why).toBe(`You got this because you forwarded an email to ${BOOKINGS}.`);
    expect(mail.facts).toEqual([["Sent to", BOOKINGS], ["Attached", "No files"]]);
    expect(mail.lines).toEqual(["That email had no PDF or image attached. Floc keeps the attached files, not the email itself."]);
    expect(mail.steps).toHaveLength(2);
  });

  it("lists what was saved and what was left out, each with its word and the reason", () => {
    const mail = emails.inboundPartlySaved({
      to: "ada@floc.test",
      bookings: BOOKINGS,
      saved: ["ticket.pdf"],
      refused: [{ name: "scan.pdf", reason: "Files are capped at 8 MB" }],
    });
    expect(mail.subject).toBe("Some files weren't saved from your email");
    expect(mail.lines).toEqual(["Saved 1 file to Floc. 1 was left out."]);
    expect(mail.rows).toEqual([
      { text: "ticket.pdf", tag: { word: "Saved", tone: "green" } },
      { text: "scan.pdf", note: "Files are capped at 8 MB", tag: { word: "Left out", tone: "red" } },
    ]);
    expect(mail.cta?.label).toBe("Open Bookings");
    expect(mail.why).toBe(`You got this because you forwarded an email to ${BOOKINGS}.`);
  });

  it("says nothing was saved when every file was left out", () => {
    const mail = emails.inboundPartlySaved({ to: "ada@floc.test", bookings: BOOKINGS, saved: [], refused: [{ name: "a.docx", reason: "Only PDFs and images can go here" }] });
    expect(mail.subject).toBe("Nothing was saved from your email");
    expect(mail.lines).toEqual(["No file could be saved."]);
  });
});

describe("feedback to Floc's mailbox", () => {
  it("quotes the message and lists who sent it from where, with no button", () => {
    const mail = emails.feedback({
      to: "hello@floc.test",
      from: { id: "u1", name: "Priya Shah", email: "priya@floc.test" },
      message: "The map is slow.\nOn my phone.",
      page: "/trip/…/money",
      surface: "Web 0.237.0",
    });
    expect(mail).toMatchObject({ layout: "card", subject: "Feedback from Priya Shah", replyTo: "priya@floc.test", lines: [] });
    expect(mail.quote).toEqual(["The map is slow.", "On my phone."]);
    expect(mail.facts).toEqual([["From", "Priya Shah, priya@floc.test"], ["User", "u1"], ["Page", "/trip/…/money"], ["Surface", "Web 0.237.0"]]);
    expect(mail.cta).toBeUndefined();
  });
});
