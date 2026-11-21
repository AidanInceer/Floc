"use client";

import { useSyncExternalStore } from "react";

import { setReduceMotion } from "@/app/profile/actions";
import { MotionIcon } from "@/components/system/icons";
import { cx, iconFrameClass } from "@/components/system/ui";
import { choseStill, isStill, setStill, storeStill, watchStill } from "@/lib/motion/still";

const movingOnServer = () => false;

const LABEL = "Turn animations off";

export function MotionToggle({ signedIn, className }: { signedIn: boolean; className?: string }) {
  const still = useSyncExternalStore(watchStill, isStill, movingOnServer);

  const flip = () => {
    const next = !choseStill();
    const root = document.documentElement;
    setStill(root, next);
    if (!signedIn) {
      storeStill(next);
      return;
    }
    setReduceMotion(next).catch(() => setStill(root, !next));
  };

  return (
    <button type="button" aria-label={LABEL} aria-pressed={still} data-open={still} title={still ? "Animations off" : LABEL} onClick={flip} className={cx(iconFrameClass(), className)}>
      <MotionIcon still={still} />
    </button>
  );
}
