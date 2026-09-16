/**
 * The bridge between BlockNote's JSON and the live Yjs doc (#391). The web
 * editor (#392) and the phone (#394) must read and write the same fragment.
 */
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import * as Y from "yjs";

import { NOTES_FRAGMENT } from "@floc/core/notes/live/live-names";

export { NOTES_FRAGMENT };

let editor: ServerBlockNoteEditor | null = null;
const blockNote = () => (editor ??= ServerBlockNoteEditor.create());

export function seedFromJson(doc: Y.Doc, body: string): void {
  blockNote().blocksToYXmlFragment(JSON.parse(body), doc.getXmlFragment(NOTES_FRAGMENT));
}

export function blocksJson(doc: Y.Doc): string {
  return JSON.stringify(blockNote().yXmlFragmentToBlocks(doc.getXmlFragment(NOTES_FRAGMENT)));
}
