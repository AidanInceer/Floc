import { isStill, watchStill } from "@/lib/motion/still";

type Start = { still: boolean };

export function watchFirstView(
  node: Element,
  on: { onStart: (start: Start) => void; onArm?: (start: Start) => void; onStill?: () => void },
): () => void {
  on.onArm?.({ still: isStill() });
  const stopWatch = on.onStill ? watchStill((still) => still && on.onStill?.()) : () => {};
  const seen = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      seen.disconnect();
      on.onStart({ still: isStill() });
    },
    { rootMargin: "0px 0px -35% 0px" },
  );
  seen.observe(node);
  return () => {
    seen.disconnect();
    stopWatch();
  };
}
