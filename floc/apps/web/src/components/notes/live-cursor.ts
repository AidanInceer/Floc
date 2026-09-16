import type { CollaborationUser } from "@blocknote/core/yjs";

import { cursorTone } from "@/lib/notes/live-presence";

/** BlockNote's cursor, painted with the person's tone instead of an inline colour. */
export function renderLiveCursor(user: CollaborationUser): HTMLElement {
  const tone = cursorTone(user);
  const base = document.createElement("span");
  base.classList.add("bn-collaboration-cursor__base");

  const caret = document.createElement("span");
  caret.setAttribute("contenteditable", "false");
  caret.classList.add("bn-collaboration-cursor__caret");
  caret.setAttribute("style", `--who: var(--${tone}); --who-ink: var(--${tone}-ink)`);

  const label = document.createElement("span");
  label.classList.add("bn-collaboration-cursor__label");
  label.append(document.createTextNode(user.name));

  caret.append(label);
  base.append(document.createTextNode("⁠"), caret, document.createTextNode("⁠"));
  return base;
}
