/**
 * Making blocks (#408): the typed shortcuts (`# `, `- `, `1. `, `[] `, `> `,
 * `---`), the `/` block menu and the `:` emoji menu. The menus read the
 * trigger from the text before the caret, so there is no menu state to lose.
 */
import type { Node, NodeType } from "@tiptap/pm/model";
import { TextSelection, type Command, type EditorState, type Transaction } from "@tiptap/pm/state";

export type Trigger = { kind: "blocks" | "emoji"; from: number; to: number; query: string };

type Made = { type: string; attrs: Record<string, unknown> } | "divider";

const MARKERS: [RegExp, Made][] = [
  [/^# $/, { type: "heading", attrs: { level: 1 } }],
  [/^## $/, { type: "heading", attrs: { level: 2 } }],
  [/^### $/, { type: "heading", attrs: { level: 3 } }],
  [/^[-*] $/, { type: "bullet", attrs: {} }],
  [/^\d+[.)] $/, { type: "numbered", attrs: {} }],
  [/^\[ ?\] $/, { type: "check", attrs: {} }],
  [/^> $/, { type: "quote", attrs: {} }],
  [/^---$/, "divider"],
];

/** What a line's first characters turn it into, if anything. */
export function shortcutFor(text: string): Made | null {
  return MARKERS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

/** Turns the paragraph at `pos` into `made`, dropping its first `length` characters. */
export function convertLine(tr: Transaction, pos: number, length: number, made: Made): Transaction {
  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;
  const schema = tr.doc.type.schema;
  tr.delete(pos + 1, pos + 1 + length);
  if (made === "divider") {
    tr.insert(pos, schema.nodes.divider.create());
    return tr.setSelection(TextSelection.create(tr.doc, pos + 2));
  }
  return tr.setNodeMarkup(pos, schema.nodes[made.type], { ...made.attrs, indent: node.attrs.indent as number });
}

export const applyShortcut: Command = (state, dispatch) => {
  const { $from } = state.selection;
  if ($from.depth !== 1 || $from.parent.type.name !== "paragraph") return false;
  const made = shortcutFor($from.parent.textBetween(0, $from.parentOffset));
  if (!made) return false;
  dispatch?.(convertLine(state.tr, $from.before(1), $from.parentOffset, made));
  return true;
};

const TRIGGER = /(?:^|\s)([/:])([^\s/:]{0,30}|[^/:]{0,30}?)$/;

export function findTrigger(state: EditorState): Trigger | null {
  const { $from, empty } = state.selection;
  if (!empty || $from.depth !== 1 || !$from.parent.isTextblock) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const match = TRIGGER.exec(before);
  if (!match || / {2}/.test(match[2])) return null;
  const kind = match[1] === "/" ? "blocks" : "emoji";
  if (kind === "emoji" && !/^[a-z0-9_+-]+$/i.test(match[2])) return null;
  const from = $from.pos - match[2].length - 1;
  return { kind, from, to: $from.pos, query: match[2] };
}

function tableNode(type: NodeType): Node {
  const { tableRow, tableCell } = type.schema.nodes;
  return type.create({ header: false }, [0, 1, 2].map(() => tableRow.create(null, [0, 1, 2].map(() => tableCell.create()))));
}

/** The `/` menu's pick: an empty line becomes the block; a line with words gets it next. */
export function turnInto(type: string, attrs: Record<string, unknown>, trigger: Trigger): Command {
  return (state, dispatch) => {
    const tr = state.tr.delete(trigger.from, trigger.to);
    const $at = tr.doc.resolve(trigger.from);
    const pos = $at.before(1);
    const line = $at.parent;
    const indent = (line.attrs.indent as number | undefined) ?? 0;
    const empty = line.content.size === 0;
    const schema = state.schema;
    if (type === "divider" || type === "table") {
      const made = type === "table" ? tableNode(schema.nodes.table) : schema.nodes.divider.create();
      const after = schema.nodes.paragraph.create({ indent });
      const at = empty ? pos : pos + line.nodeSize;
      tr.replaceWith(at, empty ? pos + line.nodeSize : at, [made, after]);
      tr.setSelection(TextSelection.create(tr.doc, type === "table" ? at + 3 : at + made.nodeSize + 1));
    } else if (empty) {
      tr.setNodeMarkup(pos, schema.nodes[type], { ...attrs, indent });
    } else {
      const at = pos + line.nodeSize;
      tr.insert(at, schema.nodes[type].create({ ...attrs, indent }));
      tr.setSelection(TextSelection.create(tr.doc, at + 1));
    }
    dispatch?.(tr.scrollIntoView());
    return true;
  };
}

/** An emoji or a trip link where the menu was opened. A link gets a space after, so typing carries on. */
export function insertAtTrigger(node: Node, trigger: Trigger, spaceAfter = false): Command {
  return (state, dispatch) => {
    const content = spaceAfter ? [node, state.schema.text(" ")] : [node];
    dispatch?.(state.tr.replaceWith(trigger.from, trigger.to, content).scrollIntoView());
    return true;
  };
}
