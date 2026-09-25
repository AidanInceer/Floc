/**
 * The `/` block menu, and the `:` emoji menu (#408). "Link to the trip" and
 * "Emoji" turn the `/` menu into those lists in place. The typed text after
 * the trigger filters; arrows move, Enter or Tab picks, Escape closes.
 */
"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { useEffect, useMemo, useState, type MutableRefObject, type ReactNode } from "react";
import { findEmoji } from "@floc/core/notes/pages/emoji";
import { findLinks, LINK_GROUPS, type TripLinkItem } from "@floc/core/notes/pages/trip-links";

import { findTrigger, insertAtTrigger, turnInto, type Trigger } from "../commands/blocks";
import { Glyph, Icon } from "./icons";
import { useOnScreen, useViewportTick } from "./floating";

type Mode = "blocks" | "things" | "emoji";
type Item = { key: string; label: string; hint?: string; group?: string; glyph: ReactNode; pick: (trigger: Trigger) => void };

const BLOCKS: { type: string; attrs?: Record<string, unknown>; label: string; mark: string; hint?: string; words: string }[] = [
  { type: "paragraph", label: "Text", mark: "T", words: "text paragraph plain" },
  { type: "heading", attrs: { level: 1 }, label: "Heading 1", mark: "H1", hint: "#", words: "heading title" },
  { type: "heading", attrs: { level: 2 }, label: "Heading 2", mark: "H2", hint: "##", words: "heading" },
  { type: "heading", attrs: { level: 3 }, label: "Heading 3", mark: "H3", hint: "###", words: "heading" },
  { type: "bullet", label: "Bulleted list", mark: "•", hint: "-", words: "bullet list" },
  { type: "numbered", label: "Numbered list", mark: "1.", hint: "1.", words: "numbered list ordered" },
  { type: "check", label: "Checklist", mark: "[ ]", hint: "[]", words: "check todo to do task" },
  { type: "quote", label: "Quote", mark: "“", hint: ">", words: "quote" },
  { type: "divider", label: "Divider", mark: "—", hint: "---", words: "divider line rule" },
];

const TITLES: Record<Mode, string> = { blocks: "Blocks", things: "Link to the trip", emoji: "Emoji" };
const NONE: Record<Mode, string> = { blocks: "No block matches", things: "Nothing on the trip matches", emoji: "No emoji matches" };

function useItems(editor: Editor, mode: Mode, query: string, links: readonly TripLinkItem[], setMode: (mode: Mode) => void): Item[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const reopen = (next: Mode) => (trigger: Trigger) => {
      editor.chain().deleteRange({ from: trigger.from + 1, to: trigger.to }).run();
      setMode(next);
    };
    if (mode === "emoji") {
      return findEmoji(q).map(({ emoji, name }) => ({
        key: emoji, label: name, glyph: <span className="fe-emoji">{emoji}</span>,
        pick: (trigger: Trigger) => { insertAtTrigger(editor.schema.text(emoji), trigger)(editor.state, editor.view.dispatch); },
      }));
    }
    if (mode === "things") {
      return findLinks(links, q).map((item) => ({
        key: `${item.kind}-${item.id}`, label: item.label, hint: item.detail, group: LINK_GROUPS[item.kind], glyph: <Glyph name={item.kind} size={12} />,
        pick: (trigger: Trigger) => {
          const node = editor.schema.nodes.tripLink.create({ kind: item.kind, id: item.id, label: item.label });
          insertAtTrigger(node, trigger, true)(editor.state, editor.view.dispatch);
        },
      }));
    }
    const blocks: Item[] = BLOCKS.map((block) => ({
      key: block.label, label: block.label, hint: block.hint, glyph: block.mark,
      pick: (trigger: Trigger) => { turnInto(block.type, block.attrs ?? {}, trigger)(editor.state, editor.view.dispatch); },
    }));
    blocks.push(
      { key: "table", label: "Table", glyph: <Icon name="table" />, pick: (trigger) => { turnInto("table", {}, trigger)(editor.state, editor.view.dispatch); } },
      { key: "trip", label: "Link to the trip", hint: "day, event, money…", glyph: "@", pick: reopen("things") },
      { key: "emoji", label: "Emoji", hint: ":", glyph: <Icon name="smile" />, pick: reopen("emoji") },
    );
    const words: Record<string, string> = { table: "table grid rows columns", trip: "link trip day event time place expense money packing file", emoji: "emoji smiley face" };
    return blocks.filter((item) => !q || item.label.toLowerCase().includes(q) || (BLOCKS.find((b) => b.label === item.key)?.words ?? words[item.key] ?? "").includes(q));
  }, [editor, mode, query, links, setMode]);
}

export function SlashMenu({ editor, links, keys }: { editor: Editor; links: readonly TripLinkItem[]; keys: MutableRefObject<((event: KeyboardEvent) => boolean) | null> }) {
  const trigger = useEditorState({ editor, selector: ({ editor: e }) => (e.isFocused ? findTrigger(e.state) : null), equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
  const [mode, setMode] = useState<Mode | null>(null);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);
  useViewportTick();
  const from = trigger?.from ?? null;
  const shown: Mode | null = trigger && dismissed !== from ? (mode ?? trigger.kind) : null;
  const items = useItems(editor, shown ?? "blocks", trigger?.query ?? "", links, setMode);

  useEffect(() => {
    setIndex(0);
  }, [shown, trigger?.query]);
  useEffect(() => {
    if (from === null) setMode(null);
    if (from !== dismissed) setDismissed(null);
  }, [from, dismissed]);

  useEffect(() => {
    keys.current = !shown || !trigger ? null : (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setIndex((at) => (at + step + Math.max(1, items.length)) % Math.max(1, items.length));
        return true;
      }
      if ((event.key === "Enter" || event.key === "Tab") && items[index]) {
        items[index].pick(trigger);
        return true;
      }
      if (event.key === "Escape") {
        setDismissed(trigger.from);
        return true;
      }
      return false;
    };
    return () => { keys.current = null; };
  }, [keys, shown, trigger, items, index]);

  if (!shown || !trigger) return null;
  const caret = editor.view.coordsAtPos(trigger.to);
  return <MenuBox at={{ left: caret.left, top: caret.bottom + 6 }} anchorTop={caret.top} mode={shown} items={items} index={index} onHover={setIndex} onPick={(item) => { item.pick(trigger); }} />;
}

function MenuBox({ at, anchorTop, mode, items, index, onHover, onPick }: {
  at: { left: number; top: number }; anchorTop: number; mode: Mode; items: Item[]; index: number; onHover: (index: number) => void; onPick: (item: Item) => void;
}) {
  const { ref, place } = useOnScreen(at, anchorTop);
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index, ref]);
  return (
    <div ref={ref} className={`fe-slash is-${mode}`} role="listbox" aria-label={TITLES[mode]} tabIndex={-1} style={place} onMouseDown={(event) => event.preventDefault()}>
      {mode !== "things" ? <p className="fe-group">{TITLES[mode]}</p> : null}
      {items.length === 0 ? <p className="fe-none">{NONE[mode]}</p> : null}
      {items.map((item, i) => (
        <div key={item.key}>
          {item.group && item.group !== items[i - 1]?.group ? <p className="fe-group">{item.group}</p> : null}
          <button type="button" role="option" aria-selected={i === index} onMouseMove={() => { if (i !== index) onHover(i); }} onClick={() => onPick(item)}>
            <span className="fe-glyph">{item.glyph}</span>
            <span className="fe-label">{item.label}</span>
            {item.hint ? <span className="fe-hint">{item.hint}</span> : null}
          </button>
        </div>
      ))}
    </div>
  );
}
