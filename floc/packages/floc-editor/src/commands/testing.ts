/** Test-only helpers: build a page state and run a command on it, no browser needed. */
import { EditorState, TextSelection, type Command } from "@tiptap/pm/state";
import type { Node } from "@tiptap/pm/model";

import { pageSchema } from "../schema/page-schema";

export const schema = pageSchema();

type Attrs = Record<string, unknown>;
export const line = (type: string, text = "", attrs: Attrs = {}) => schema.node(type, attrs, text ? [schema.text(text)] : []);
export const page = (...blocks: Node[]) => schema.node("doc", null, blocks);
export const cell = (text = "", tone: string | null = null) => schema.node("tableCell", { tone }, text ? [schema.text(text)] : []);
export const table = (rows: string[][], header = false) =>
  schema.node("table", { header }, rows.map((row) => schema.node("tableRow", null, row.map((text) => cell(text)))));

/** A state with the caret at `offset` inside block `index` (a top-level block). */
export function caretIn(doc: Node, index: number, offset = 0): EditorState {
  let pos = 0;
  for (let i = 0; i < index; i += 1) pos += doc.child(i).nodeSize;
  return EditorState.create({ doc, selection: TextSelection.create(doc, pos + 1 + offset) });
}

export function run(command: Command, state: EditorState): { ok: boolean; state: EditorState } {
  let next = state;
  const ok = command(state, (tr) => {
    next = state.apply(tr);
  });
  return { ok, state: next };
}

/** Each top-level block as `type:indent:text`, the shape most assertions want. */
export const lines = (state: EditorState) => {
  const out: string[] = [];
  state.doc.forEach((node) => out.push(`${node.type.name}:${(node.attrs.indent as number | undefined) ?? "-"}:${node.textContent}`));
  return out;
};

/** The top-level block the caret is in. */
export const caretBlock = (state: EditorState) => state.selection.$from.index(0);
