/**
 * The bridge between BlockNote's JSON and the live Yjs doc (#391). The web
 * editor (#392) and the phone (#394) must read and write the same fragment.
 */
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import * as Y from "yjs";

export const NOTES_FRAGMENT = "document-store";

let editor: ServerBlockNoteEditor | null = null;
const blockNote = () => (editor ??= ServerBlockNoteEditor.create());

export function seedFromJson(doc: Y.Doc, body: string): void {
  blockNote().blocksToYXmlFragment(JSON.parse(body), doc.getXmlFragment(NOTES_FRAGMENT));
}

export function blocksJson(doc: Y.Doc): string {
  return JSON.stringify(blockNote().yXmlFragmentToBlocks(doc.getXmlFragment(NOTES_FRAGMENT)));
}
