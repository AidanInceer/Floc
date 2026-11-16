import { initials } from "@floc/core/people/initials";
import { whoTone } from "@floc/core/people/who";
import { pastelOf } from "@floc/core/design/pastels";

import type { MailRow, OutboundEmail } from "./model";
import { FACE } from "./palette";

export type Paint = (roles: string, style?: string, extraClass?: string) => string;

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function safeUrl(url: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
  }
  return "/";
}

const SANS = `font-family:${FACE.sans}`;
const MONO = `font-family:${FACE.mono}`;
const DISPLAY = `font-family:${FACE.display};font-weight:800`;
export const STYLE = { sans: SANS, mono: MONO, display: DISPLAY };

function prose(text: string): string {
  return esc(text).replace(/[£€$]\d[\d,.]*/g, (m) => {
    const figure = m.replace(/[.,]$/, "");
    return `<span class="mono" style="${MONO};font-weight:500">${figure}</span>${m.slice(figure.length)}`;
  });
}

const table = (attrs: string, body: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${attrs}>${body}</table>`;
export const tbl = table;

export function wordmark(paint: Paint, size = 18): string {
  return `<span${paint("fg-ink", `${DISPLAY};font-size:${size}px;line-height:1;letter-spacing:-0.02em`)}>floc<span${paint("fg-pen")}>.</span></span>`;
}

function tied(text: string): string {
  return text.replace(/ (\S+)$/, "\u00a0$1");
}

export function heading(paint: Paint, text: string): string {
  return `<h1${paint("fg-ink", `${DISPLAY};font-size:25px;line-height:1.2;margin:0 0 16px`)}>${prose(tied(text))}</h1>`;
}

export function lede(paint: Paint, text: string): string {
  return `<p${paint("fg-ink", `${SANS};font-size:17px;line-height:1.5;margin:0 0 12px`)}>${prose(tied(text))}</p>`;
}

export function paragraphs(paint: Paint, lines: string[], size = 15): string {
  return lines.map((l) => `<p${paint("fg-ink", `${SANS};font-size:${size}px;line-height:1.55;margin:0 0 12px`)}>${prose(tied(l))}</p>`).join("");
}

export function button(paint: Paint, cta: OutboundEmail["cta"]): string {
  if (!cta) return "";
  const cell = `<td${paint("bg-pen", "border-radius:8px;padding:0 18px")}><a href="${esc(safeUrl(cta.url))}"${paint("fg-sheet", `${SANS};font-size:15px;font-weight:600;line-height:40px;display:inline-block;text-decoration:none;border-radius:8px`)}>${esc(cta.label)}</a></td>`;
  return table(` style="margin:20px 0 8px"`, `<tr>${cell}</tr>`);
}

export function note(paint: Paint, text: string | undefined): string {
  return text ? `<p${paint("fg-ink-2", `${SANS};font-size:13px;line-height:1.5;margin:0 0 4px`)}>${prose(tied(text))}</p>` : "";
}

const LABEL = `${MONO};font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em`;

function factRows(paint: Paint, facts: [string, string][], inset: string): string {
  return facts
    .map(([label, value], i) => {
      const rule = i < facts.length - 1 ? "border-bottom:1px solid" : "";
      const cell = (body: string, style: string) => `<td${paint(rule ? "bd-rule" : "", `${rule};padding:10px ${inset};vertical-align:top;${style}`)}>${body}</td>`;
      return `<tr>${cell(`<span${paint("fg-ink-2", LABEL)}>${esc(label)}</span>`, "width:1%;white-space:nowrap;padding-right:16px")}${cell(`<span${paint("fg-ink", `${MONO};font-size:14px;font-weight:500;overflow-wrap:break-word`)}>${esc(value)}</span>`, `padding-left:0`)}</tr>`;
    })
    .join("");
}

export function stub(paint: Paint, facts: [string, string][] | undefined): string {
  if (!facts?.length) return "";
  return table(` width="100%"${paint("bg-sheet-2", "border-radius:8px;margin:0 0 20px")}`, factRows(paint, facts, "16px"));
}

export function box(paint: Paint, head: NonNullable<OutboundEmail["box"]>, facts: [string, string][]): string {
  const top = `<tr><td colspan="2"${paint("bd-rule", "border-bottom:1px solid;padding:10px 16px")}>${table(` width="100%"`, `<tr><td${paint("fg-ink", `${MONO};font-size:14px;font-weight:500`)}>${esc(head.title)}</td><td align="right"${paint("fg-pastel-red-ink", `${LABEL};white-space:nowrap;padding-left:8px`)}>${esc(head.status)}</td></tr>`)}</td></tr>`;
  return table(` width="100%"${paint("bd-rule-2", "border:1px solid;border-radius:8px;margin:0 0 20px")}`, top + factRows(paint, facts, "16px"));
}

export function steps(paint: Paint, list: string[] | undefined): string {
  if (!list?.length) return "";
  const rows = list
    .map((s, i) => `<tr><td style="padding:6px 10px 6px 0;vertical-align:top;width:24px"><span${paint("fg-ink-2 bd-rule-2", `border:1px solid;border-radius:8px;display:inline-block;width:22px;line-height:22px;text-align:center;${MONO};font-size:11px`)}>${i + 1}</span></td><td${paint("fg-ink", `${SANS};font-size:15px;line-height:1.5;padding:6px 0`)}>${prose(tied(s))}</td></tr>`)
    .join("");
  return `<h2${paint("fg-ink", `${DISPLAY};font-size:17px;line-height:1.3;margin:20px 0 8px`)}>What to do</h2>${table("", rows)}`;
}

export function quote(paint: Paint, lines: string[] | undefined): string {
  if (!lines?.length) return "";
  return table(` width="100%"${paint("bg-sheet-2", "border-radius:8px;margin:0 0 16px")}`, `<tr><td style="padding:12px 14px 2px">${paragraphs(paint, lines)}</td></tr>`);
}

function face(paint: Paint, name: string): string {
  const tone = whoTone(name);
  return `<span${paint(`bg-${tone} fg-${tone}-ink`, `display:inline-block;width:24px;line-height:24px;border-radius:8px;text-align:center;${MONO};font-size:10px;font-weight:600`)}>${esc(initials(name))}</span>`;
}

function tag(paint: Paint, t: NonNullable<MailRow["tag"]>): string {
  return `<span${paint(`bg-pastel-${t.tone} fg-pastel-${t.tone}-ink`, `display:inline-block;padding:3px 7px;border-radius:999px;${MONO};font-size:11px;font-weight:500;white-space:nowrap`)}>${esc(t.word)}</span>`;
}

export function rows(paint: Paint, list: MailRow[] | undefined): string {
  if (!list?.length) return "";
  const body = list
    .map((r) => {
      const who = r.person ? `<td style="width:34px;padding:10px 0;vertical-align:middle">${face(paint, r.person)}</td>` : "";
      const words = `<span${paint("fg-ink", `${SANS};font-size:14px;line-height:1.45;overflow-wrap:break-word`)}>${prose(r.text)}</span>${r.note ? `<br><span${paint("fg-ink-2", `${MONO};font-size:11px`)}>${esc(r.note)}</span>` : ""}`;
      const end = r.tag ? `<td align="right" style="padding:10px 0 10px 8px;vertical-align:middle;width:1%">${tag(paint, r.tag)}</td>` : "";
      return `<tr${paint("bd-rule", "border-bottom:1px solid")}>${who}<td style="padding:10px 0;vertical-align:middle">${words}</td>${end}</tr>`;
    })
    .join("");
  return table(` width="100%"${paint("bd-rule", "border-top:1px solid;margin:4px 0 16px;border-collapse:collapse")}`, body);
}

export function tripTile(paint: Paint, trip: OutboundEmail["trip"]): string {
  if (!trip) return "";
  const pastel = pastelOf(trip.colour);
  const mark = `<td style="width:48px;vertical-align:middle"><span${paint(`bg-${pastel} fg-${pastel}-ink`, `display:inline-block;width:36px;line-height:36px;border-radius:8px;text-align:center;${DISPLAY};font-size:17px`)}>${esc(trip.name.slice(0, 1).toUpperCase())}</span></td>`;
  const words = `<td style="vertical-align:middle"><span${paint("fg-ink", `${DISPLAY};font-size:17px;line-height:1.2`)}>${esc(trip.name)}</span><br><span${paint("fg-ink-2", `${LABEL};line-height:2`)}>${esc(trip.dates)}</span></td>`;
  return table(` width="100%"${paint("bd-rule", "border:1px solid;border-radius:12px;margin:4px 0 20px")}`, `<tr><td style="padding:12px">${table(` width="100%"`, `<tr>${mark}${words}</tr>`)}</td></tr>`);
}

export function foot(paint: Paint, e: OutboundEmail): string {
  const settings = e.settingsUrl ? ` <a href="${esc(safeUrl(e.settingsUrl))}"${paint("fg-ink-2", "text-decoration:underline")}>Turn off email in Settings</a>.` : "";
  const why = e.why ? `<p${paint("fg-ink-2", `${SANS};font-size:13px;line-height:1.5;margin:0 0 8px`)}>${esc(e.settingsUrl ? e.why : tied(e.why))}${settings}</p>` : "";
  return `${why}<p${paint("fg-ink-2", `${LABEL};margin:0`)}>Floc · floc.live</p>`;
}
