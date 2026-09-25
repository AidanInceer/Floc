/**
 * The editor, assembled (#408): the page schema, live editing through Yjs with
 * named cursors and per-person undo, the keys the prototype settled, typed
 * shortcuts, and the outline, table and size plugins.
 */
import { Extension, InputRule, type AnyExtension, type Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import type { Command } from "@tiptap/pm/state";
import { CellSelection, deleteCellSelection, goToNextCell, tableEditing } from "@tiptap/pm/tables";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { PAGE_FRAGMENT } from "@floc/core/notes/pages/page-yjs";
import { cursorTone } from "@floc/core/notes/live/live-presence";
import type { LinkKind } from "@floc/core/notes/pages/trip-links";

import { convertLine, shortcutFor } from "../commands/blocks";
import { backspaceAtStart, indentLines, splitLine } from "../commands/lines";
import { cellEnter, deleteLines, insertLine, selectionInfo } from "../commands/tables";
import { cellEdges, headingIds, sizeGuard } from "../plugins/guards";
import { outlineKey, outlinePlugin } from "../plugins/outline";
import { placeholders } from "../plugins/placeholder";
import { PAGE_MARKS, PAGE_NODES } from "../schema/page-schema";
import { TripLink } from "../schema/inline";
import { tripLinkView, type LinkNames } from "./trip-link-view";

export type KitOptions = {
  doc: Y.Doc;
  awareness: Awareness | null;
  user: { id: string; name: string; tone: string; color: string };
  names: LinkNames;
  folded: ReadonlySet<string>;
  onFold: (folded: ReadonlySet<string>) => void;
  onFull: () => void;
  onOpenLink: (kind: LinkKind, id: number) => void;
};

const run = (editor: Editor, command: Command) => command(editor.state, editor.view.dispatch, editor.view);

/** Tab at the last cell adds a row, as a sheet does. */
function tabCell(editor: Editor, dir: 1 | -1): boolean {
  if (run(editor, goToNextCell(dir))) return true;
  if (dir === -1) return false;
  const { $from } = editor.state.selection;
  if ($from.parent.type.name !== "tableCell") return false;
  const tablePos = $from.before($from.depth - 2);
  const rows = editor.state.doc.nodeAt(tablePos)?.childCount ?? 0;
  return run(editor, insertLine(tablePos, "row", rows)) && run(editor, goToNextCell(1));
}

function deleteCells(editor: Editor): boolean {
  if (!(editor.state.selection instanceof CellSelection)) return false;
  const info = selectionInfo(editor.state);
  if (info?.whole) {
    const [from, to] = info.whole === "row" ? [info.rect.top, info.rect.bottom - 1] : [info.rect.left, info.rect.right - 1];
    if (run(editor, deleteLines(info.tablePos, info.whole, from, to))) return true;
  }
  return run(editor, deleteCellSelection);
}

const shortcut = (find: RegExp) =>
  new InputRule({
    find,
    handler: ({ state, range, match }) => {
      const $from = state.doc.resolve(range.from);
      const made = shortcutFor(match[0].replace(/\s$/, " "));
      if ($from.depth !== 1 || $from.parent.type.name !== "paragraph" || !made) return null;
      convertLine(state.tr, $from.before(1), range.to - range.from, made);
    },
  });

function behaviour(options: KitOptions) {
  return Extension.create({
    name: "pageBehaviour",
    addKeyboardShortcuts() {
      const editor = this.editor;
      const folded = () => outlineKey.getState(editor.state) ?? new Set<string>();
      return {
        Tab: () => run(editor, indentLines(1)) || tabCell(editor, 1),
        "Shift-Tab": () => run(editor, indentLines(-1)) || tabCell(editor, -1),
        Enter: () => run(editor, cellEnter) || run(editor, splitLine(folded())),
        "Shift-Enter": () => editor.commands.insertContent({ type: "hardBreak" }),
        Backspace: () => deleteCells(editor) || run(editor, backspaceAtStart),
        Delete: () => deleteCells(editor),
      };
    },
    addInputRules() {
      return [shortcut(/^(#{1,3}|[-*]|\d+[.)]|\[ ?\]|>)\s$/), shortcut(/^---$/)];
    },
    addProseMirrorPlugins() {
      return [
        outlinePlugin({ folded: options.folded, onFold: options.onFold }),
        headingIds(),
        tableEditing({ allowTableNodeSelection: false }),
        cellEdges(),
        sizeGuard(options.onFull),
        placeholders(() => this.editor.isFocused),
      ];
    },
  });
}

function caret(user: { name: string; tone?: string }): HTMLElement {
  const tone = cursorTone(user);
  const base = document.createElement("span");
  base.className = `remote-caret ${tone}`;
  const label = document.createElement("span");
  label.className = "remote-caret-name";
  label.textContent = user.name.split(" ")[0];
  base.append(label);
  return base;
}

export function pageKit(options: KitOptions): AnyExtension[] {
  const nodes = PAGE_NODES.map((node) =>
    node === TripLink ? TripLink.extend({ addNodeView: () => ({ node }) => tripLinkView(node, options.names, options.onOpenLink) }) : node,
  );
  return [
    ...nodes,
    ...PAGE_MARKS,
    behaviour(options),
    Collaboration.configure({ document: options.doc, field: PAGE_FRAGMENT }),
    ...(options.awareness
      ? [CollaborationCaret.configure({
          provider: { awareness: options.awareness },
          user: options.user,
          render: caret,
          selectionRender: (user: { tone?: string }) => ({ class: `remote-selection ${cursorTone(user)}` }),
        })]
      : []),
  ];
}
