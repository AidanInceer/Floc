export function watchSeen(node: Element, changed: (seen: boolean) => void): () => void {
  let onScreen = false;
  const update = () => changed(onScreen && !document.hidden);
  const view = new IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    update();
  });
  view.observe(node);
  document.addEventListener("visibilitychange", update);
  return () => {
    view.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}
