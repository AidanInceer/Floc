/**
 * The bar over selected words (#408): bold, italic, underline, strike, link,
 * four highlights, Comment, and clear formatting. Link and Comment turn the
 * bar into a one-line form.
 */
"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { addComment, setHighlight, setLink } from "../commands/marks";
import { Icon, type IconName } from "./icons";
import { Swatches, useDismiss, useViewportTick } from "./floating";

type Mode = "tools" | "link" | "comment";

const MARKS: [string, string, IconName][] = [["bold", "Bold", "bold"], ["italic", "Italic", "italic"], ["underline", "Underline", "underline"], ["strike", "Strikethrough", "strike"]];
const CLEARED = ["bold", "italic", "underline", "strike", "link", "highlight"];

function Tool({ label, icon, pressed, onClick }: { label: string; icon: IconName; pressed?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="fe-tool" title={label} aria-label={label} aria-pressed={pressed} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

export function SelectionBar({ editor, onComment }: { editor: Editor; onComment: (body: string) => Promise<number | { error: string }> }) {
  const range = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const selection = e.state.selection;
      if (!e.isFocused || selection.empty || !(selection instanceof TextSelection)) return null;
      return { from: selection.from, to: selection.to, marks: MARKS.filter(([name]) => e.isActive(name)).map(([name]) => name) };
    },
    equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  const [mode, setMode] = useState<Mode>("tools");
  const [held, setHeld] = useState<{ from: number; to: number } | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const done = () => {
    setMode("tools");
    setHeld(null);
    setValue("");
    setError(null);
  };
  const dismiss = useDismiss(mode !== "tools", done);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (mode !== "tools") input.current?.focus();
  }, [mode]);
  useViewportTick();

  const at = mode === "tools" ? range : held;
  if (!at || at.to > editor.state.doc.content.size) return null;
  const start = editor.view.coordsAtPos(at.from);
  const end = editor.view.coordsAtPos(at.to);
  const style = { left: Math.max(200, (start.left + end.right) / 2), top: Math.max(8, start.top - 48) };

  const openForm = (next: Mode) => {
    setHeld({ from: at.from, to: at.to });
    setMode(next);
  };
  const restore = () => editor.chain().focus().setTextSelection(at);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    if (mode === "link") {
      restore().run();
      if (!setLink(text)(editor.state, editor.view.dispatch)) return setError("That is not a link.");
      return done();
    }
    const made = await onComment(text);
    if (typeof made !== "number") return setError(made.error);
    restore().run();
    addComment(made)(editor.state, editor.view.dispatch);
    done();
  };

  return (
    <div ref={dismiss} className="fe-bar" role="toolbar" aria-label="Format" tabIndex={-1} style={style} onMouseDown={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }}>
      {mode === "tools" ? (
        <>
          {MARKS.map(([name, label, icon]) => (
            <Tool key={name} label={label} icon={icon} pressed={range?.marks.includes(name)} onClick={() => editor.chain().focus().toggleMark(name).run()} />
          ))}
          <Tool label="Link" icon="link" onClick={() => openForm("link")} />
          <span className="fe-sep" />
          <Swatches what="highlight" onPick={(tone) => { if (tone) setHighlight(tone)(editor.state, editor.view.dispatch); }} />
          <span className="fe-sep" />
          <button type="button" className="fe-tool is-comment" onClick={() => openForm("comment")}>
            <Icon name="comment" />
            Comment
          </button>
          <Tool label="Clear formatting" icon="clear" onClick={() => { CLEARED.reduce((chain, name) => chain.unsetMark(name), editor.chain().focus()).run(); }} />
        </>
      ) : (
        <form onSubmit={(event) => { void submit(event); }}>
          <span className="fe-lead"><Icon name={mode === "link" ? "link" : "comment"} /></span>
          <input
            ref={input}
            value={value}
            onChange={(event) => { setValue(event.target.value); setError(null); }}
            placeholder={mode === "link" ? "Paste a link" : "Write a comment"}
            aria-label={mode === "link" ? "Link" : "Comment"}
            aria-invalid={error ? true : undefined}
          />
          <button type="submit" className="fe-go">{mode === "link" ? "Link" : "Post"}</button>
          {error ? <span className="fe-error" role="alert">{error}</span> : null}
        </form>
      )}
    </div>
  );
}
