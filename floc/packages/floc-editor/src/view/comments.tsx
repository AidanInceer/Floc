/**
 * Page comments (#408): a thin dotted underline on the words, a bubble with the
 * count in the right margin, and the thread under the words — replies, a reply
 * box and Resolve. The thread never quotes the words back.
 */
"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { commentAnchors, removeComment } from "../commands/marks";
import { Icon } from "./icons";
import { useDismiss, useOnScreen } from "./floating";

export type PagePost = { id: number; name: string; tone: string; body: string; when: string };
export type PageThread = { id: number; posts: PagePost[] };
export type Person = { name: string; tone: string };

const initials = (name: string) => name.split(" ").slice(0, 2).map((word) => word[0] ?? "").join("").toUpperCase();

export function Face({ person, size = 24 }: { person: Person; size?: number }) {
  return (
    <span className={`fe-face ${person.tone}`} title={person.name} aria-label={person.name} style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}>
      {initials(person.name)}
    </span>
  );
}

type Badge = { id: number; top: number; count: number };

function placeBadges(editor: Editor, layer: HTMLElement, threads: readonly PageThread[]): Badge[] {
  const origin = layer.getBoundingClientRect();
  const taken = new Set<number>();
  const badges: Badge[] = [];
  for (const id of commentAnchors(editor.state.doc).keys()) {
    const thread = threads.find((t) => t.id === id);
    const span = editor.view.dom.querySelector(`.cmt[data-comment="${id}"]`);
    const rect = span?.getClientRects()[0];
    if (!thread || !rect) continue;
    let top = Math.round(rect.top - origin.top);
    while (taken.has(top)) top += 26;
    taken.add(top);
    badges.push({ id, top, count: thread.posts.length });
  }
  return badges;
}

export function Comments({ editor, threads, me, onReply, onResolve }: {
  editor: Editor;
  threads: readonly PageThread[];
  me: Person;
  onReply: (threadId: number, body: string) => Promise<string | null>;
  onResolve: (threadId: number) => Promise<void>;
}) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (!layer) return;
    const place = () => setBadges(placeBadges(editor, layer, threads));
    place();
    editor.on("update", place);
    window.addEventListener("resize", place);
    return () => {
      editor.off("update", place);
      window.removeEventListener("resize", place);
    };
  }, [editor, layer, threads]);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const span = (event.target as HTMLElement).closest?.<HTMLElement>(".cmt[data-comment]");
      if (span) setOpen(Number(span.dataset.comment));
    };
    const dom = editor.view.dom;
    dom.addEventListener("click", click);
    return () => { dom.removeEventListener("click", click); };
  }, [editor]);

  useEffect(() => {
    editor.view.dom.querySelectorAll(".cmt.is-open").forEach((el) => el.classList.remove("is-open"));
    if (open !== null) editor.view.dom.querySelectorAll(`.cmt[data-comment="${open}"]`).forEach((el) => el.classList.add("is-open"));
  });

  const close = useCallback(() => setOpen(null), []);
  const thread = threads.find((t) => t.id === open);
  const anchor = open === null ? null : editor.view.dom.querySelector(`.cmt[data-comment="${open}"]`);

  return (
    <div ref={setLayer} className="fe-badges" aria-hidden={badges.length === 0}>
      {badges.map((badge) => (
        <button key={badge.id} type="button" className={`fe-badge${open === badge.id ? " is-open" : ""}`} style={{ top: badge.top }}
          title={`${badge.count} comment${badge.count > 1 ? "s" : ""}`} aria-label={`Open comment, ${badge.count} ${badge.count > 1 ? "replies" : "post"}`}
          onClick={() => setOpen(badge.id)}>
          <Icon name="bubble" size={12} />
          <b className="fe-n">{badge.count}</b>
        </button>
      ))}
      {thread && anchor ? (
        <Thread
          thread={thread}
          anchor={anchor.getBoundingClientRect()}
          me={me}
          onClose={close}
          onReply={(body) => onReply(thread.id, body)}
          onResolve={async () => {
            await onResolve(thread.id);
            removeComment(thread.id)(editor.state, editor.view.dispatch);
            close();
          }}
        />
      ) : null}
    </div>
  );
}

function Thread({ thread, anchor, me, onClose, onReply, onResolve }: {
  thread: PageThread; anchor: DOMRect; me: Person; onClose: () => void; onReply: (body: string) => Promise<string | null>; onResolve: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dismiss = useDismiss(true, onClose, () => Array.from(document.querySelectorAll(".cmt, .fe-badge")));
  const { ref, place } = useOnScreen({ left: anchor.left, top: anchor.bottom + 8 }, anchor.top);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = value.trim();
    if (!body) return;
    const refused = await onReply(body);
    if (refused) return setError(refused);
    setValue("");
  };
  return (
    <div ref={(el) => { dismiss.current = el; ref.current = el; }} className="fe-thread" role="dialog" aria-label="Comment" style={place}>
      <div className="fe-thread-head">
        <button type="button" className="fe-quiet" onClick={() => { void onResolve(); }}><Icon name="check" />Resolve</button>
        <button type="button" className="fe-quiet" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
      </div>
      <ul>
        {thread.posts.map((post) => (
          <li key={post.id}>
            <Face person={post} />
            <div>
              <p><span className="fe-who">{post.name.split(" ")[0]}</span><span className="fe-when">{post.when}</span></p>
              <p className="fe-said">{post.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => { void send(event); }}>
        <Face person={me} size={22} />
        <input autoFocus value={value} onChange={(event) => { setValue(event.target.value); setError(null); }} placeholder="Reply" aria-label="Reply" aria-invalid={error ? true : undefined} />
        <button type="submit" className="fe-tool fe-send" aria-label="Reply" title="Reply"><Icon name="send" /></button>
      </form>
      {error ? <p className="fe-error" role="alert">{error}</p> : null}
    </div>
  );
}
