import * as Y from "yjs";

import { NOTES_FRAGMENT } from "./live-names";

export type LiveCursor = { anchor: Y.RelativePosition; head: Y.RelativePosition };

function findBlock(type: Y.XmlElement | Y.XmlFragment, id: string): Y.XmlElement | null {
  if (type instanceof Y.XmlElement && type.nodeName === "blockContainer" && type.getAttribute("id") === id) {
    return type;
  }
  for (const child of type.toArray()) {
    if (child instanceof Y.XmlElement) {
      const found = findBlock(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function liveBlockCursor(doc: Y.Doc, blockId: string): LiveCursor | null {
  const block = findBlock(doc.getXmlFragment(NOTES_FRAGMENT), blockId);
  const content = block?.get(0);
  if (!(content instanceof Y.XmlElement)) return null;
  const positionType = content.get(0);
  const type = positionType instanceof Y.XmlElement || positionType instanceof Y.XmlText ? positionType : content;
  const position = Y.createRelativePositionFromTypeIndex(type, 0);
  return { anchor: position, head: position };
}

export function liveCursorBlockId(doc: Y.Doc, cursor: unknown): string | null {
  const head = (cursor as { head?: unknown } | null)?.head;
  if (!head || typeof head !== "object") return null;
  try {
    const absolute = Y.createAbsolutePositionFromRelativePosition(head as Y.RelativePosition, doc);
    let type = absolute?.type ?? null;
    while (type) {
      if (type instanceof Y.XmlElement && type.nodeName === "blockContainer") {
        const id = type.getAttribute("id") as unknown;
        return typeof id === "string" ? id : null;
      }
      type = type.parent;
    }
  } catch {
    return null;
  }
  return null;
}
