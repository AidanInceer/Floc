/**
 * The phone's two copies of a page (#408): the app holds the live doc — the
 * socket, the saved copy on the phone — and the editor runs in a web view with
 * its own. These carry each side's changes to the other, as base64, since the
 * bridge between them takes only JSON. Each side tags what it received, so
 * nothing bounces back.
 */
import * as Y from "yjs";
import { applyAwarenessUpdate, encodeAwarenessUpdate, type Awareness } from "y-protocols/awareness";

export const FROM_APP = "app";
export const FROM_PAGE = "page";

export function toBase64(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

export function fromBase64(text: string): Uint8Array {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export const wholeDoc = (doc: Y.Doc) => toBase64(Y.encodeStateAsUpdate(doc));

/** Sends every change made on this side, and none that came from the other. */
export function sendChanges(doc: Y.Doc, from: string, send: (update: string) => void): () => void {
  const listener = (update: Uint8Array, origin: unknown) => {
    if (origin !== from) send(toBase64(update));
  };
  doc.on("update", listener);
  return () => doc.off("update", listener);
}

export function takeChange(doc: Y.Doc, update: string, from: string): void {
  Y.applyUpdate(doc, fromBase64(update), from);
}

/** Everyone else on the page, as the app's socket sees them — never the app itself, which is this person. */
export function othersUpdate(awareness: Awareness, clients: readonly number[]): string | null {
  const others = clients.filter((client) => client !== awareness.clientID);
  return others.length ? toBase64(encodeAwarenessUpdate(awareness, others)) : null;
}

export function takeOthers(awareness: Awareness, update: string): void {
  applyAwarenessUpdate(awareness, fromBase64(update), FROM_APP);
}
