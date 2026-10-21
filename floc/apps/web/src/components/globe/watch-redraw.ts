/** Calls `redraw` when `node` changes size or the page changes between light and dark. Returns the stop. */
export function watchRedraw(node: Element, redraw: () => void): () => void {
  const resized = new ResizeObserver(redraw);
  resized.observe(node);
  const themed = new MutationObserver(redraw);
  themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    resized.disconnect();
    themed.disconnect();
  };
}
