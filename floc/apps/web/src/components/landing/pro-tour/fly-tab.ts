/** A copy of the tab flies from the strip onto the dashed copy of itself on the ticket; the real tab closes under it. */
export function flyTab(root: HTMLElement, key: string) {
  const tab = root.querySelector(`[data-tab="${key}"]`);
  const chip = root.querySelector(`[data-slot="${key}"] [data-chip]`);
  if (!tab || !chip) return;
  const from = tab.getBoundingClientRect();
  const to = chip.getBoundingClientRect();
  const ghost = tab.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-tab");
  ghost.classList.add("pro-ghost");
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
  document.body.append(ghost);
  const there = `translate(${to.left - from.left}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px)`;
  const done = () => ghost.remove();
  ghost
    .animate([{ transform: "none" }, { transform: there, opacity: 1, offset: 0.8 }, { transform: there, opacity: 0 }], {
      duration: 760,
      easing: "cubic-bezier(.5, 0, .3, 1)",
      fill: "forwards",
    })
    .finished.then(done, done);
}

export const dropGhosts = () => document.querySelectorAll(".pro-ghost").forEach((g) => g.remove());
