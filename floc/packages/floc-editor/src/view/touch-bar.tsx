/**
 * The phone's formatting bar (#408), above the keyboard while a page is being
 * typed in: the block menu, the common line kinds, indent, and bold and italic.
 */
"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";

import { indentLines } from "../commands/lines";
import { Icon } from "./icons";

function Key({ label, pressed, onPress, children }: { label: string; pressed?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button type="button" className="fe-key" aria-label={label} title={label} aria-pressed={pressed} onMouseDown={(event) => event.preventDefault()} onClick={onPress}>
      {children}
    </button>
  );
}

export function TouchBar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { $from } = e.state.selection;
      const before = $from.parent.textBetween(Math.max(0, $from.parentOffset - 1), $from.parentOffset);
      return { focused: e.isFocused, fresh: before === "" || before === " ", line: $from.parent.type.name, bold: e.isActive("bold"), italic: e.isActive("italic") };
    },
  });
  if (!state.focused) return null;
  const setLine = (type: string, attrs: Record<string, unknown> = {}) =>
    editor.chain().focus().setNode(state.line === type ? "paragraph" : type, attrs).run();
  return (
    <div className="fe-touchbar" role="toolbar" aria-label="Formatting">
      <Key label="Blocks" onPress={() => editor.chain().focus().insertContent(state.fresh ? "/" : " /").run()}>/</Key>
      <Key label="Heading" pressed={state.line === "heading"} onPress={() => setLine("heading", { level: 2 })}>H</Key>
      <Key label="Checklist" pressed={state.line === "check"} onPress={() => setLine("check")}>[ ]</Key>
      <Key label="Bulleted list" pressed={state.line === "bullet"} onPress={() => setLine("bullet")}>•</Key>
      <Key label="Indent" onPress={() => indentLines(1)(editor.state, editor.view.dispatch)}><Icon name="indent" /></Key>
      <Key label="Outdent" onPress={() => indentLines(-1)(editor.state, editor.view.dispatch)}><Icon name="outdent" /></Key>
      <Key label="Bold" pressed={state.bold} onPress={() => editor.chain().focus().toggleMark("bold").run()}><Icon name="bold" /></Key>
      <Key label="Italic" pressed={state.italic} onPress={() => editor.chain().focus().toggleMark("italic").run()}><Icon name="italic" /></Key>
      <Key label="Hide keyboard" onPress={() => editor.commands.blur()}><Icon name="keyboard" /></Key>
    </div>
  );
}
