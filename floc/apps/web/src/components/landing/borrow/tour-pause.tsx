"use client";

import { useSyncExternalStore } from "react";

import { MotionIcon } from "@/components/system/icons";
import { cx, iconFrameClass } from "@/components/system/ui";
import { isStill, watchStill } from "@/lib/motion/still";

const LABEL = "Pause the globe";
const movingOnServer = () => false;

export function TourPause({ paused, onFlip }: { paused: boolean; onFlip: () => void }) {
  const still = useSyncExternalStore(watchStill, isStill, movingOnServer);
  if (still) return null;
  return (
    <button type="button" aria-label={LABEL} aria-pressed={paused} data-open={paused} title={paused ? "Globe paused" : LABEL} onClick={onFlip} className={cx(iconFrameClass(), "borrow-pause")}>
      <MotionIcon still={paused} />
    </button>
  );
}
