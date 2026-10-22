import type { PageBlock, TableCell, Tone } from "../../../notes/pages/page-blocks";
import type { IdeaCost, IdeaPace, PresetIdeas } from "../detail/preset-detail-types";

export const IDEAS_PAGE_TITLE = "Ideas";

// Why: a tint helps the eye run down a column; the word in the cell still says it.
const PACE_TONE: Record<IdeaPace, Tone> = { Relaxed: "mint", Steady: "butter", Active: "blush" };
const COST_TONE: Record<IdeaCost, Tone> = { Free: "mint", Low: "peri", Mid: "butter", High: "blush" };

const cell = (text: string, tone: Tone | null = null): TableCell => ({ tone, content: [{ type: "text", text }] });
const heading = (id: string, level: 2 | 3, text: string): PageBlock => ({ type: "heading", id, level, indent: 0, content: [{ type: "text", text }] });
const table = (head: string[], rows: TableCell[][]): PageBlock => ({ type: "table", header: true, rows: [head.map((h) => cell(h)), ...rows] });

/** The Ideas page a copy adds (ADR-025): other things to do at each stop, then other stops to swap in. */
export function ideasPage(ideas: PresetIdeas): PageBlock[] {
  return [
    heading("at-your-stops", 2, "At your stops"),
    ...ideas.atStops.flatMap((stop, i) => [
      heading(`stop-${i + 1}`, 3, stop.place),
      table(
        ["Idea", "Pace", "Cost"],
        stop.ideas.map((idea) => [cell(idea.text), cell(idea.pace, PACE_TONE[idea.pace]), cell(idea.cost, COST_TONE[idea.cost])]),
      ),
    ]),
    heading("other-stops", 2, "Other stops"),
    table(
      ["Place", "Nights", "Instead of", "What to do there"],
      ideas.otherStops.map((s) => [cell(s.place), cell(String(s.nights)), cell(s.instead), cell(s.what)]),
    ),
  ];
}
