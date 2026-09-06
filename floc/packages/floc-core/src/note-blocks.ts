/**
 * BlockNote's document, read without BlockNote (ticket 301).
 *
 * The web app's Notes editor stores its document as BlockNote's own `Block[]`,
 * JSON-encoded. BlockNote does not run on a phone, but the document is only
 * JSON — nothing about reading it needs a browser. So this parses it, flattens
 * a block to text for display, and puts text back, and both clients agree
 * about what a document says because they call the same functions.
 *
 * THE ONE RULE THAT MAKES THIS SAFE: a block is never rebuilt. `setBlockText`
 * returns the same object with its `content` replaced and everything else —
 * `id`, `type`, `props`, `children` — carried through untouched. A table, an
 * image, or a nested list written on the web therefore survives a phone edit,
 * because the phone never had to understand it. Decision: `301-notes-on-a-phone`.
 *
 * TOLERANT ON THE WAY IN. A malformed or empty document reads as no blocks
 * rather than throwing. A note nobody has written in yet is the ordinary case,
 * not an error, and a corrupt one should lose a screen, not the app (rule 11).
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

/** The saved document, or no blocks. Never throws — see the file comment. */
export function parseNoteDoc(json: string | null | undefined): NoteBlock[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as NoteBlock[]) : [];
  } catch {
    return [];
  }
}

export function serialiseNoteDoc(blocks: NoteBlock[]): string {
  return JSON.stringify(blocks);
}

/** The runs to draw, flattened one level so a link's own text comes through with its href. */
export function inlineRuns(block: NoteBlock): { text: string; styles: Record<string, unknown>; href?: string }[] {
  const content = block.content;
  if (typeof content === "string") return [{ text: content, styles: {} }];
  if (!Array.isArray(content)) return [];

  const runs: { text: string; styles: Record<string, unknown>; href?: string }[] = [];
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

/**
 * The same block with new text.
 *
 * Everything but `content` is carried through, so a block type the phone does
 * not draw keeps its shape. Styling inside the block is lost, and that is the
 * honest trade: a phone editing a sentence cannot know which half was bold.
 */
export function setBlockText(block: NoteBlock, text: string): NoteBlock {
  return { ...block, content: [{ type: "text", text, styles: {} }] };
}

/** A new block of one of the types the phone draws. No id — BlockNote assigns one when it next loads. */
export function newBlock(type: DrawnBlock, text: string): NoteBlock {
  return {
    type,
    props: type === "checkListItem" ? { checked: false } : {},
    content: [{ type: "text", text, styles: {} }],
    children: [],
  };
}

export function isChecked(block: NoteBlock): boolean {
  return block.props?.checked === true;
}

/** Ticking a box changes one prop and nothing else — not the text, not the block's identity. */
export function setChecked(block: NoteBlock, checked: boolean): NoteBlock {
  return { ...block, props: { ...(block.props ?? {}), checked } };
}

/** A heading's level, clamped to what the app draws. Anything odd reads as the smallest. */
export function headingLevel(block: NoteBlock): 1 | 2 | 3 {
  const level = block.props?.level;
  return level === 1 || level === 2 || level === 3 ? level : 3;
}
