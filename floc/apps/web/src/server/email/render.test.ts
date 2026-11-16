/**
 * #653: one email model, drawn as an HTML card or letter and as plain text, every colour from the tokens.
 */
import { describe, expect, it } from "vitest";

import { resolveTokens } from "@floc/core/design/tokens";

import type { OutboundEmail } from "./model";
import { renderEmail } from "./render";

const NOW = new Date("2026-11-15T14:20:00Z");

const card: OutboundEmail = {
  to: "ada@floc.test",
  subject: "Reset your Floc password",
  heading: "Choose a new password",
  lines: ["Someone asked to reset the password on this address."],
  cta: { label: "Choose a new password", url: "https://floc.test/reset?token=t" },
  note: "The link works once and expires within the hour.",
  why: "You got this because a password reset was asked for on this address.",
};

const letter: OutboundEmail = {
  to: "ada@floc.test",
  subject: "You still owe £42.50 for Lisbon",
  layout: "letter",
  lines: ["You still owe £42.50 for Lisbon"],
  trip: { name: "Lisbon", dates: "Fri 12 Mar – Mon 15 Mar 2027", colour: "mint" },
  cta: { label: "Open in Floc", url: "https://floc.test/trip/1/money" },
  why: "Floc emails you only when push can't reach you.",
  settingsUrl: "https://floc.test/profile?section=notifications#settings-notifications",
};

const html = (e: OutboundEmail) => renderEmail(e, { now: NOW }).html;
/** The same HTML with tied words untied, for tests about the words rather than the wrapping. */
const words = (e: OutboundEmail) => html(e).replace(/\u00a0/g, " ");
const text = (e: OutboundEmail) => renderEmail(e, { now: NOW }).text;
const hexes = (s: string) => new Set((s.match(/#[0-9a-f]{6}\b/gi) ?? []).map((h) => h.toLowerCase()));
const tokenHexes = (theme: "light" | "dark") =>
  new Set(Object.values(resolveTokens(theme)).filter((v) => /^#[0-9a-f]{6}$/i.test(v)).map((v) => v.toLowerCase()));

describe("the card", () => {
  it("heads with the wordmark as text and the date in the mono face", () => {
    const out = html(card);
    expect(out).toMatch(/floc<span[^>]*>\.<\/span>/);
    expect(out).toContain("Sun 15 Nov 2026");
    expect(out).toContain("Choose a new password</h1>");
  });

  it("draws no picture: no SVG, no image, so it shows with images off", () => {
    expect(html(card)).not.toMatch(/<svg|<img/i);
    expect(html(letter)).not.toMatch(/<svg|<img/i);
  });

  it("draws the button as a rounded square, not a pill", () => {
    const out = html(card);
    expect(out).toContain("border-radius:8px");
    expect(out).not.toContain("999px");
  });

  it("ends with why it came and Floc's address, and no way to turn it off", () => {
    const out = words(card);
    expect(out).toContain("You got this because a password reset was asked for on this address.");
    expect(out).toContain("Floc · floc.live");
    expect(out).not.toMatch(/turn (these|off)/i);
  });
});

describe("the letter", () => {
  it("shows the trip as a tile in its own colour, with its dates in mono", () => {
    const out = html(letter);
    const mint = resolveTokens("light")["pastel-green"];
    expect(out).toContain("Lisbon</");
    expect(out).toContain("Fri 12 Mar – Mon 15 Mar 2027");
    expect(out).toContain(`background-color:${mint}`);
    expect(out).toContain("— Floc");
  });

  it("puts money in the mono face, even inside a sentence", () => {
    expect(html(letter)).toMatch(/<span class="[^"]*\bmono\b[^"]*"[^>]*>£42\.50<\/span>/);
  });

  it("links a notice to the setting that stops it", () => {
    expect(html(letter)).toContain('href="https://floc.test/profile?section=notifications#settings-notifications"');
  });
});

describe("colour and type", () => {
  it("takes every colour from the light and dark tokens", () => {
    const allowed = new Set([...tokenHexes("light"), ...tokenHexes("dark")]);
    for (const hex of [...hexes(html(card)), ...hexes(html(letter))]) expect(allowed).toContain(hex);
  });

  it("repaints from the dark tokens when the reader's mail is dark", () => {
    const out = html(card);
    expect(out).toContain('<meta name="color-scheme" content="light dark">');
    const dark = out.slice(out.indexOf("@media (prefers-color-scheme: dark)"));
    expect(dark).toContain(resolveTokens("dark").sheet);
  });

  it("can be forced dark for the preview page", () => {
    const out = renderEmail(card, { now: NOW, theme: "dark" }).html;
    expect(out).toContain(`background-color:${resolveTokens("dark").paper}`);
  });

  it("loads the three faces from Floc's own files", () => {
    const out = html(card);
    for (const face of ["display", "text", "mono"]) expect(out).toMatch(new RegExp(`url\\(http[^)]+/fonts/red-hat-${face}-latin\\.woff2\\)`));
    expect(out).not.toContain("googleapis");
  });
});

describe("safety", () => {
  it("escapes what it is given", () => {
    const out = words({ ...card, heading: "<script>x</script>", lines: ['"quoted" & <b>'] });
    expect(out).not.toContain("<script>x");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("&quot;quoted&quot; &amp; &lt;b&gt;");
  });

  it("never links to a script URL", () => {
    const out = html({ ...card, cta: { label: "Go", url: "javascript:alert(1)" } });
    expect(out).not.toContain("javascript:");
  });
});

describe("the plain-text part", () => {
  it("says the same thing as the HTML, with the link written out", () => {
    const out = text(card);
    expect(out).toContain("Choose a new password");
    expect(out).toContain("Someone asked to reset the password on this address.");
    expect(out).toContain("Choose a new password: https://floc.test/reset?token=t");
    expect(out).toContain("You got this because a password reset was asked for on this address.");
    expect(out).not.toMatch(/<[a-z]/i);
  });

  it("names the trip and the setting link on a notice", () => {
    const out = text(letter);
    expect(out).toContain("Lisbon · Fri 12 Mar – Mon 15 Mar 2027");
    expect(out).toContain("Turn off email in Settings: https://floc.test/profile?section=notifications#settings-notifications");
  });
});

describe("hairlines", () => {
  it("keep the rule colour after a border shorthand", () => {
    const out = html({ ...card, facts: [["Sent to", "a"]], box: { title: "x", status: "Not saved" } });
    const rule2 = resolveTokens("light")["rule-2"];
    expect(out).toContain(`border:1px solid;border-radius:8px;margin:0 0 20px;border-color:${rule2}`);
  });
});

describe("the preview", () => {
  it("pins a light mail to light, whatever the reader's own scheme", () => {
    const out = renderEmail(card, { now: NOW, theme: "light" }).html;
    expect(out).not.toContain("prefers-color-scheme");
    expect(out).toContain('<meta name="color-scheme" content="light">');
  });
});

describe("figures", () => {
  it("keeps a full stop that ends the sentence outside the mono figure", () => {
    const out = html({ ...card, lines: ["You owe £42.50."] });
    expect(out).toMatch(/>£42\.50<\/span>\./);
  });
});

describe("on a phone", () => {
  it("runs the card edge to edge and ties a heading's last two words", () => {
    const out = html({ ...card, heading: "We couldn't confirm that email came from you" });
    expect(out).toContain("@media (max-width:480px)");
    expect(out).toContain("from you</h1>");
  });
});

describe("the head date", () => {
  it("is the UK day, so it agrees with a received time just after midnight in summer", () => {
    const out = renderEmail(card, { now: new Date("2026-06-14T23:30:00Z") }).html;
    expect(out).toContain("Mon 15 Jun 2026");
  });
});
