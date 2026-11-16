import type { OutboundEmail } from "./model";

const NL = "\n";

function details(e: OutboundEmail): (string | null)[] {
  return [
    e.trip ? `${e.trip.name} · ${e.trip.dates}` : null,
    e.box ? `${e.box.title} · ${e.box.status}` : null,
    e.facts?.length ? e.facts.map(([k, v]) => `${k}: ${v}`).join(NL) : null,
    e.quote?.length ? e.quote.map((l) => `> ${l}`).join(NL) : null,
    e.rows?.length ? e.rows.map((r) => `- ${r.text}${r.tag ? ` (${r.tag.word})` : ""}${r.note ? `: ${r.note}` : ""}`).join(NL) : null,
    e.steps?.length ? ["What to do", ...e.steps.map((s, i) => `${i + 1}. ${s}`)].join(NL) : null,
  ];
}

export function renderText(e: OutboundEmail): string {
  const letter = e.layout === "letter";
  const foot = [e.why, e.settingsUrl ? `Turn off email in Settings: ${e.settingsUrl}` : null, "Floc · floc.live"].filter(Boolean);
  const blocks = [
    letter ? null : (e.heading ?? e.subject),
    e.lines.length ? e.lines.join(NL + NL) : null,
    ...details(e),
    e.cta ? `${e.cta.label}: ${e.cta.url}` : null,
    e.note ?? null,
    letter ? "— Floc" : null,
    `--${NL}${foot.join(NL)}`,
  ];
  return `${blocks.filter(Boolean).join(NL + NL)}${NL}`;
}
