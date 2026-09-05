/**
 * The Notes doc, loaded in the browser only (ticket 238).
 *
 * BlockNote reaches for `window` while building the editor, so it cannot be
 * server-rendered — and there is nothing to prerender anyway: the document is
 * the editor's own state from its first paint.
 */
"use client";

import dynamic from "next/dynamic";

const NotesEditor = dynamic(
  () => import("@/components/notes-editor").then((m) => m.NotesEditor),
  { ssr: false, loading: () => <p className="typed">Opening the doc</p> },
);

export function NotesDoc(props: { tripId: number; initialDoc: string | null }) {
  return <NotesEditor {...props} />;
}
