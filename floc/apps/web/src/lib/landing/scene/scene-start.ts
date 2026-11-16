const STILL = "(prefers-reduced-motion: reduce)";

type Start = { still: boolean };

export function watchFirstView(
  node: Element,
  on: { onStart: (start: Start) => void; onArm?: (start: Start) => void; onStill?: () => void },
): () => void {
  const reduced = matchMedia(STILL);
  on.onArm?.({ still: reduced.matches });
  const motionChanged = () => {
    if (reduced.matches) on.onStill?.();
  };
  if (on.onStill) reduced.addEventListener("change", motionChanged);
  const seen = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      seen.disconnect();
      on.onStart({ still: reduced.matches });
    },
    { rootMargin: "0px 0px -35% 0px" },
  );
  seen.observe(node);
  return () => {
    seen.disconnect();
    reduced.removeEventListener("change", motionChanged);
  };
}
