import { stopsOf } from "../listing-stops";
import type { PresetTrip } from "../preset-trip-types";
import { KNOW_STAGES, type KnowTip, type TripKnow } from "./know-types";
import { shortFormProblems } from "./short-forms";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z]+(-[a-z]+)*$/;

function marksProblems(name: string, field: string): string[] {
  const problems: string[] = [];
  if ((field.match(/\*\*/g)?.length ?? 0) % 2 === 1) problems.push(`${name} has an unbalanced ** mark`);
  for (const m of field.matchAll(/\*\*(.+?)\*\*/g)) {
    if (!/\d/.test(m[1])) problems.push(`${name} marks "${m[1]}" with ** but it holds no figure`);
  }
  return problems;
}

function linkProblems(name: string, link: KnowTip["link"]): string[] {
  if (!link) return [];
  if (!link.href.startsWith("https://")) return [`${name} links to "${link.href}", wants https://`];
  if (link.href.includes("/blog")) return [`${name} links to a blog, "${link.href}"`];
  return [];
}

function tipProblems(where: string, tip: Pick<KnowTip, "title" | "text" | "link" | "temporary">): string[] {
  const problems: string[] = [];
  if (!tip.title.trim()) problems.push(`${where} has no title`);
  if (!tip.text.trim()) problems.push(`${where} has no text`);
  const name = `${where} "${tip.title}"`;
  problems.push(...marksProblems(name, tip.title), ...marksProblems(name, tip.text), ...linkProblems(name, tip.link));
  if (tip.temporary !== undefined && !tip.temporary.trim()) problems.push(`${name} has an empty temporary reason`);
  else if (tip.temporary !== undefined && !tip.temporary.startsWith("Until ")) problems.push(`${name} temporary "${tip.temporary}" must start with "Until "`);
  const all = [tip.title, tip.text, tip.temporary ?? "", tip.link?.label ?? ""].join(" ");
  problems.push(...shortFormProblems(all).map((p) => `${name} ${p}`));
  return problems;
}

function duplicateTitles(where: string, tips: { title: string }[]): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const { title } of tips) {
    const key = title.trim().toLowerCase();
    if (seen.has(key)) problems.push(`${where} "${title}" is written twice`);
    seen.add(key);
  }
  return problems;
}

function isRealDay(day: string): boolean {
  if (!ISO_DAY.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function stageOrderProblems(know: TripKnow): string[] {
  const problems: string[] = [];
  let last = -1;
  const seen = new Set<string>();
  for (const { stage } of know.stages) {
    if (seen.has(stage)) problems.push(`stage "${stage}" is written twice`);
    seen.add(stage);
    const at = KNOW_STAGES.indexOf(stage);
    if (at < last) problems.push(`stage "${stage}" is out of order`);
    last = Math.max(last, at);
  }
  return problems;
}

function stopsProblems(trip: PresetTrip, stops: { place: string; tips: unknown[] }[]): string[] {
  const problems: string[] = [];
  const bases = stopsOf(trip).map((s) => s.place);
  let last = -1;
  for (const stop of stops) {
    const at = bases.indexOf(stop.place, Math.max(last, 0));
    if (at >= 0) last = at;
    else if (bases.includes(stop.place)) problems.push(`At the stops: "${stop.place}" is out of route order`);
    else problems.push(`At the stops: "${stop.place}" is not a stop of the listing`);
    if (stop.tips.length === 0) problems.push(`At the stops: ${stop.place} has no tips`);
  }
  return problems;
}

/** What is wrong with a hand-written Good to know, in words its author can act on. Empty when it fits the listing. */
export function checkTripKnow(trip: PresetTrip, know: TripKnow): string[] {
  const problems = stageOrderProblems(know);
  if (!ISO_DAY.test(know.checked)) problems.push(`checked "${know.checked}" is not YYYY-MM-DD`);
  else if (!isRealDay(know.checked)) problems.push(`checked "${know.checked}" is not a real day`);
  for (const a of know.advice) if (!SLUG.test(a.slug)) problems.push(`advice slug "${a.slug}" is not lowercase-hyphen`);
  for (const s of know.stages) {
    if (s.stage === "At the stops") {
      if (s.stops.length === 0) problems.push("At the stops has no stops");
      problems.push(...stopsProblems(trip, s.stops));
      for (const stop of s.stops) {
        problems.push(...duplicateTitles(`At the stops, ${stop.place}:`, stop.tips));
        for (const tip of stop.tips) problems.push(...tipProblems(`At the stops, ${stop.place}:`, tip));
      }
    } else {
      if (s.tips.length === 0) problems.push(`${s.stage} has no tips`);
      problems.push(...duplicateTitles(`${s.stage}:`, s.tips));
      for (const tip of s.tips) problems.push(...tipProblems(`${s.stage}:`, tip));
    }
  }
  return problems;
}
