"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { liveUser } from "@floc/core/notes/live/live-presence";
import { PAGE_FULL } from "@floc/core/notes/pages/page-rules";
import type { LinkKind, TripLinkItem } from "@floc/core/notes/pages/trip-links";

import { reshapePastedHtml } from "../paste";
import { Comments, type PageThread } from "./comments";
import { pageKit } from "./page-kit";
import { SelectionBar } from "./selection-bar";
import { SlashMenu } from "./slash-menu";
import { TableTools } from "./table-tools";
import { TouchBar } from "./touch-bar";
import { LinkNames } from "./trip-link-view";

export type PageEditorProps = {
  doc: Y.Doc;
  awareness: Awareness | null;
  me: { id: string; name: string };
  foldKey: string | null;
  links: readonly TripLinkItem[];
  threads: readonly PageThread[];
  onOpenLink: (kind: LinkKind, id: number) => void;
  onStartThread: (body: string) => Promise<number | { error: string }>;
  onReply: (threadId: number, body: string) => Promise<string | null>;
  onResolve: (threadId: number) => Promise<void>;
  touch?: boolean;
  handle?: MutableRefObject<{ focusStart: () => void } | null>;
};

function readFolds(key: string): Set<string> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

const parseHtml = (html: string) => new DOMParser().parseFromString(html, "text/html");

export function PageEditor(props: PageEditorProps) {
  const { doc, awareness, me, foldKey, links, touch = false } = props;
  const names = useMemo(() => new LinkNames(), []);
  const menuKeys = useRef<((event: KeyboardEvent) => boolean) | null>(null);
  const openLink = useRef(props.onOpenLink);
  openLink.current = props.onOpenLink;
  const [full, setFull] = useState(false);
  const user = useMemo(() => liveUser(me), [me]);

  useEffect(() => { names.set(links); }, [names, links]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: pageKit({
      doc,
      awareness,
      user,
      names,
      folded: foldKey ? readFolds(`floc-folds:${foldKey}`) : new Set<string>(),
      onFold: (folded) => {
        if (!foldKey) return;
        try { localStorage.setItem(`floc-folds:${foldKey}`, JSON.stringify([...folded])); } catch {}
      },
      onFull: () => setFull(true),
      onOpenLink: (kind, id) => openLink.current(kind, id),
    }),
    editorProps: {
      attributes: { class: "fe-page", "aria-label": "Page", spellcheck: "true" },
      handleKeyDown: (_view, event) => menuKeys.current?.(event) ?? false,
      transformPastedHTML: (html) => reshapePastedHtml(html, parseHtml),
    },
  }, [doc, awareness]);

  useEffect(() => {
    if (!props.handle || !editor) return;
    props.handle.current = { focusStart: () => editor.commands.focus("start") };
  }, [props.handle, editor]);

  useEffect(() => {
    if (!full) return;
    const timer = setTimeout(() => setFull(false), 4000);
    return () => clearTimeout(timer);
  }, [full]);

  if (!editor) return null;
  return (
    <div className={`fe-sheet${touch ? " is-touch" : ""}`}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} links={links} keys={menuKeys} />
      <SelectionBar editor={editor} onComment={props.onStartThread} />
      <TableTools editor={editor} touch={touch} />
      <Comments editor={editor} threads={props.threads} me={user} onReply={props.onReply} onResolve={props.onResolve} />
      {touch ? <TouchBar editor={editor} /> : null}
      {full ? <p className="fe-toast" role="status">{PAGE_FULL}</p> : null}
    </div>
  );
}
