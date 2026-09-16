/**
 * BlockNote blocks, read without BlockNote (#301): what the phone draws, and
 * the text of a block. Edits go through `live/live-blocks` (#394).
 */

/** BlockNote's inline run. `styles` is open — we read the four we draw and pass the rest along. */
export type InlineRun = {
  type?: string;
  text?: string;
  href?: string;
  content?: InlineRun[] | string;
  styles?: Record<string, unknown>;
};

/** One block. Deliberately loose: an unknown `type` is still a block we must keep. */
export type NoteBlock = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: InlineRun[] | string;
  children?: NoteBlock[];
};

/** The block types the phone can draw and edit. Anything else renders as its text and is never rewritten. */
export const DRAWN_BLOCKS = [
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
] as const;

export type DrawnBlock = (typeof DRAWN_BLOCKS)[number];

export function isDrawn(block: NoteBlock): boolean {
  return (DRAWN_BLOCKS as readonly string[]).includes(block.type ?? "");
}

/** A link run carries no href when the editor left it empty, so `href` is optional and may be undefined. */
export type FlatRun = { text: string; styles: Record<string, unknown>; href?: string | undefined };

/** The runs to draw, flattened one level so a link's own text comes through with its href. */
export function inlineRuns(block: NoteBlock): FlatRun[] {
  const content = block.content;
  if (typeof content === "string") return [{ text: content, styles: {} }];
  if (!Array.isArray(content)) return [];

  const runs: FlatRun[] = [];
  for (const run of content) {
    if (run.type === "link") {
      const inner = Array.isArray(run.content) ? run.content : [];
      for (const part of inner) {
        runs.push({ text: part.text ?? "", styles: part.styles ?? {}, href: run.href });
      }
      continue;
    }
    if (typeof run.text === "string") runs.push({ text: run.text, styles: run.styles ?? {} });
  }
  return runs;
}

/** A block as plain text — what an editor field starts as, and what a one-line summary shows. */
export function blockText(block: NoteBlock): string {
  return inlineRuns(block)
    .map((run) => run.text)
    .join("");
}

export function isChecked(block: NoteBlock): boolean {
  return block.props?.checked === true;
}

/** A heading's level, clamped to what the app draws. Anything odd reads as the smallest. */
export function headingLevel(block: NoteBlock): 1 | 2 | 3 {
  const level = block.props?.level;
  return level === 1 || level === 2 || level === 3 ? level : 3;
}
