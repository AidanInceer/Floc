import * as Y from "yjs";

import { isDrawn, type DrawnBlock, type InlineRun, type NoteBlock } from "../note-blocks";
import { NOTES_FRAGMENT } from "./live-names";

// Why block by block, not a whole-document write: the phone and web edit the
// same Yjs doc (#394), and only small edits merge. The shape is BlockNote's
// y-prosemirror tree: blockGroup > blockContainer[id] > <type> > XmlText.

type Delta = { insert?: unknown; attributes?: Record<string, unknown> }[];

const BASE_PROPS = { backgroundColor: "default", textColor: "default", textAlignment: "left" };

const TYPE_PROPS: Record<DrawnBlock, Record<string, unknown>> = {
  paragraph: {},
  heading: { level: 1, isToggleable: false },
  bulletListItem: {},
  numberedListItem: {},
  checkListItem: { checked: false },
};

const rootGroup = (doc: Y.Doc) => {
  const first = doc.getXmlFragment(NOTES_FRAGMENT).get(0);
  return first instanceof Y.XmlElement ? first : null;
};

const containers = (group: Y.XmlElement) =>
  group.toArray().filter((node): node is Y.XmlElement => node instanceof Y.XmlElement);

function find(doc: Y.Doc, id: string) {
  const group = rootGroup(doc);
  if (!group) return null;
  const index = group.toArray().findIndex((node) => node instanceof Y.XmlElement && node.getAttribute("id") === id);
  return index < 0 ? null : { group, index, block: group.get(index) as Y.XmlElement };
}

function editable(doc: Y.Doc, id: string) {
  const found = find(doc, id);
  if (!found) return null;
  const content = found.block.get(0);
  if (!(content instanceof Y.XmlElement) || !isDrawn({ type: content.nodeName })) return null;
  const text = content.get(0);
  return { ...found, content, text: text instanceof Y.XmlText ? text : null };
}

function styles(attributes: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "link") continue;
    const inner = (value as { stringValue?: unknown } | null)?.stringValue;
    out[key] = typeof inner === "string" ? inner : true;
  }
  return out;
}

function runs(text: Y.XmlText | null): InlineRun[] {
  return ((text?.toDelta() ?? []) as Delta)
    .filter((op) => typeof op.insert === "string")
    .map((op) => {
      const run: InlineRun = { type: "text", text: op.insert as string, styles: styles(op.attributes) };
      const href = (op.attributes?.link as { href?: unknown } | undefined)?.href;
      return typeof href === "string" ? { type: "link", href, content: [{ ...run }] } : run;
    });
}

function readBlock(block: Y.XmlElement): NoteBlock {
  const [content, nested] = block.toArray();
  const element = content instanceof Y.XmlElement ? content : null;
  const text = element?.get(0);
  return {
    id: block.getAttribute("id") ?? "",
    type: element?.nodeName ?? "",
    props: element?.getAttributes() ?? {},
    content: runs(text instanceof Y.XmlText ? text : null),
    children: nested instanceof Y.XmlElement ? containers(nested).map(readBlock) : [],
  };
}

export function readLiveBlocks(doc: Y.Doc): NoteBlock[] {
  const group = rootGroup(doc);
  return group ? containers(group).map(readBlock) : [];
}

const plain = (text: Y.XmlText) =>
  (text.toDelta() as Delta).map((op) => (typeof op.insert === "string" ? op.insert : " ")).join("");

export function setLiveText(doc: Y.Doc, id: string, next: string): void {
  const found = editable(doc, id);
  if (!found) return;
  const text = found.text ?? new Y.XmlText();
  const old = plain(text);
  let start = 0;
  while (start < old.length && start < next.length && old[start] === next[start]) start += 1;
  let end = 0;
  while (end < old.length - start && end < next.length - start && old[old.length - 1 - end] === next[next.length - 1 - end]) end += 1;
  doc.transact(() => {
    if (!found.text) found.content.insert(0, [text]);
    text.delete(start, old.length - start - end);
    text.insert(start, next.slice(start, next.length - end));
  });
}

export function setLiveChecked(doc: Y.Doc, id: string, checked: boolean): void {
  const found = editable(doc, id);
  if (found?.content.nodeName !== "checkListItem") return;
  found.content.setAttribute("checked", checked as unknown as string);
}

function element(type: DrawnBlock, carried: Record<string, unknown>, delta: Delta) {
  const content = new Y.XmlElement(type);
  const props = { ...BASE_PROPS, ...carried, ...TYPE_PROPS[type] };
  for (const [key, value] of Object.entries(props)) content.setAttribute(key, value);
  const text = new Y.XmlText();
  content.insert(0, [text]);
  return { content, fill: () => { text.applyDelta(delta); } };
}

export function setLiveType(doc: Y.Doc, id: string, type: DrawnBlock): void {
  const found = editable(doc, id);
  if (!found) return;
  const { backgroundColor, textColor, textAlignment } = found.content.getAttributes();
  const carried = Object.fromEntries(
    Object.entries({ backgroundColor, textColor, textAlignment }).filter(([, value]) => value !== undefined),
  );
  const next = element(type, carried, (found.text?.toDelta() ?? []) as Delta);
  doc.transact(() => {
    found.block.delete(0, 1);
    found.block.insert(0, [next.content]);
    next.fill();
  });
}

export function insertLiveBlock(doc: Y.Doc, afterId: string, id: string, type: DrawnBlock): void {
  const found = find(doc, afterId);
  if (!found) return;
  const next = element(type, {}, []);
  const block = new Y.XmlElement("blockContainer");
  block.setAttribute("id", id);
  block.insert(0, [next.content]);
  doc.transact(() => { found.group.insert(found.index + 1, [block]); });
}

export function removeLiveBlock(doc: Y.Doc, id: string): boolean {
  const found = find(doc, id);
  if (!found || containers(found.group).length <= 1) return false;
  found.group.delete(found.index, 1);
  return true;
}
