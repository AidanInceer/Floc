import type { Theme } from "@floc/core/design/tokens";

import { appUrl } from "@/lib/env";

import * as b from "./blocks";
import type { OutboundEmail } from "./model";
import { fontFaces, painter } from "./palette";
import { renderText } from "./text";

type Options = { now: Date; theme?: Theme; base?: string };

const SENT_ON = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

const PHONE =
  "@media (max-width:480px){.m-ground{padding:12px 0 20px !important}.m-card{border-radius:0 !important;border-left-width:0 !important;border-right-width:0 !important}.m-pad{padding:24px 20px !important}.m-foot{padding:16px 20px 0 !important}.m-letter{padding:0 20px !important}}";

const OUTLOOK_OPEN = '<!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->';
const OUTLOOK_CLOSE = "<!--[if mso]></td></tr></table><![endif]-->";

function card(paint: b.Paint, e: OutboundEmail, now: Date): string {
  const facts = e.facts ?? [];
  const head = b.tbl(
    ` width="100%" style="margin:0 0 24px"`,
    `<tr><td>${b.wordmark(paint)}</td><td align="right"${paint("fg-ink-2", `${b.STYLE.mono};font-size:11px;text-transform:uppercase;letter-spacing:0.06em`)}>${b.esc(SENT_ON.format(now).replace(",", ""))}</td></tr>`,
  );
  const body = [
    head,
    b.heading(paint, e.heading ?? e.subject),
    e.box ? b.box(paint, e.box, facts) : "",
    b.paragraphs(paint, e.lines),
    e.box ? "" : b.stub(paint, facts),
    b.quote(paint, e.quote),
    b.rows(paint, e.rows),
    b.steps(paint, e.steps),
    b.button(paint, e.cta),
    b.note(paint, e.note),
  ].join("");
  const sheet = b.tbl(` width="100%"${paint("bg-sheet bd-rule", "border:1px solid;border-radius:12px", "m-card")}`, `<tr><td class="m-pad" style="padding:32px 28px">${body}</td></tr>`);
  const foot = `<div class="m-foot" style="padding:16px 28px 0">${b.foot(paint, e)}</div>`;
  return `<div style="max-width:560px;margin:0 auto">${sheet}${foot}</div>`;
}

function letter(paint: b.Paint, e: OutboundEmail): string {
  const [lede, ...rest] = e.lines.length ? e.lines : [e.heading ?? e.subject];
  const body = [
    `<div style="margin:0 0 28px">${b.wordmark(paint)}</div>`,
    b.lede(paint, lede),
    b.paragraphs(paint, rest),
    b.tripTile(paint, e.trip),
    b.rows(paint, e.rows),
    b.button(paint, e.cta),
    b.note(paint, e.note),
    `<p${paint("fg-ink-2", `${b.STYLE.sans};font-size:15px;margin:24px 0 0`)}>— Floc</p>`,
    `<div${paint("bd-rule", "border-top:1px solid;margin-top:32px;padding-top:16px")}>${b.foot(paint, e)}</div>`,
  ].join("");
  return `<div class="m-letter" style="max-width:520px;margin:0 auto">${body}</div>`;
}

export function renderEmail(e: OutboundEmail, { now, theme, base = appUrl() }: Options): { html: string; text: string } {
  const { paint, darkCss } = painter(theme ?? "light");
  const isLetter = e.layout === "letter";
  const inner = isLetter ? letter(paint, e) : card(paint, e, now);
  const ground = paint(isLetter ? "bg-sheet" : "bg-paper", "margin:0;padding:24px 16px 32px", "m-ground");
  const style = `${fontFaces(base)}.mono{font-family:${b.STYLE.mono.slice("font-family:".length)}}${PHONE}${theme ? "" : `@media (prefers-color-scheme: dark){${darkCss()}}`}`;
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="${theme ?? "light dark"}"><meta name="supported-color-schemes" content="${theme ?? "light dark"}"><title>${b.esc(e.subject)}</title><style>${style}</style></head><body${ground}>${OUTLOOK_OPEN}${inner}${OUTLOOK_CLOSE}</body></html>`;
  return { html, text: renderText(e) };
}
