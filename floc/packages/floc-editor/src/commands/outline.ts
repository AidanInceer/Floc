/** A page's top-level lines in the shape `@floc/core/notes/pages/page-outline` reads. */
import type { Node } from "@tiptap/pm/model";
import type { OutlineLine } from "@floc/core/notes/pages/page-outline";

export function outlineOf(doc: Node): OutlineLine[] {
  const out: OutlineLine[] = [];
  doc.forEach((node) => {
    out.push({
      type: node.type.name,
      indent: (node.attrs.indent as number | undefined) ?? 0,
      level: node.attrs.level as number | undefined,
      id: node.attrs.id as string | undefined,
    });
  });
  return out;
}
