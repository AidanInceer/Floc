const STILL = "(prefers-reduced-motion: reduce)";

type Start = { still: boolean };

/**
 * The start rule of every front-door scene (ADR-019): play once, the first time
 * the stage is on screen; reduced motion skips to the last frame.
 */
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
    // Why: a threshold never fires on a stage taller than the phone's screen; a margin does.
    { rootMargin: "0px 0px -35% 0px" },
  );
  seen.observe(node);
  return () => {
    seen.disconnect();
    reduced.removeEventListener("change", motionChanged);
  };
}
