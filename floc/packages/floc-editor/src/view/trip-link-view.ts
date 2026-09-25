/**
 * A trip-link chip (#408). The page stores the kind, id and last name seen;
 * the chip always shows the thing's current name, and "Removed" once it has
 * gone. Drawn outside React: a page can hold hundreds.
 */
import type { Node } from "@tiptap/pm/model";
import type { NodeView } from "@tiptap/pm/view";
import { showLink, type LinkKind, type TripLinkItem } from "@floc/core/notes/pages/trip-links";

import { glyphMarkup } from "./icons";

/** The trip's current names, shared by every chip on the page. */
export class LinkNames {
  items: readonly TripLinkItem[] = [];
  private readonly listeners = new Set<() => void>();

  set(items: readonly TripLinkItem[]) {
    this.items = items;
    this.listeners.forEach((listener) => { listener(); });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

type Link = { kind: LinkKind; id: number; label: string };

export function tripLinkView(start: Node, names: LinkNames, onOpen: (kind: LinkKind, id: number) => void): NodeView {
  let node = start;
  const dom = document.createElement("span");
  dom.className = "trip-link";
  dom.contentEditable = "false";
  const icon = document.createElement("span");
  icon.className = "trip-link-icon";
  const label = document.createElement("span");
  const gone = document.createElement("span");
  gone.className = "trip-link-gone";
  gone.textContent = "Removed";
  dom.append(icon, label);

  const draw = () => {
    const link = node.attrs as Link;
    const shown = showLink(link, names.items);
    dom.dataset.kind = link.kind;
    dom.classList.toggle("is-removed", shown.removed);
    dom.setAttribute("role", shown.removed ? "note" : "link");
    icon.innerHTML = glyphMarkup(link.kind, 12);
    label.textContent = shown.label;
    if (shown.removed) dom.append(gone);
    else gone.remove();
  };
  draw();
  const stop = names.subscribe(draw);

  dom.addEventListener("click", (event) => {
    const link = node.attrs as Link;
    if (showLink(link, names.items).removed) return;
    event.preventDefault();
    onOpen(link.kind, link.id);
  });

  return {
    dom,
    update(next) {
      if (next.type !== node.type) return false;
      node = next;
      draw();
      return true;
    },
    ignoreMutation: () => true,
    destroy: () => { stop(); },
  };
}
