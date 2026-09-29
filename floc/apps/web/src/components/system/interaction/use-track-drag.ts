"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, RefObject } from "react";

import { createTrackDrag } from "@/lib/interaction/track-drag";
import type { TrackRelease } from "@/lib/interaction/track-drag";

export function useTrackDrag({ track, here, onRelease, onDragging }: {
  track: RefObject<HTMLElement | null>;
  here: () => number;
  onRelease: (release: TrackRelease) => void;
  onDragging?: (active: boolean) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ here, onRelease, onDragging });
  latest.current = { here, onRelease, onDragging };
  const session = useRef<ReturnType<typeof createTrackDrag> | null>(null);

  useEffect(() => {
    const gesture = createTrackDrag(() => track.current, window, {
      onDragging(active) {
        latest.current.onDragging?.(active);
        setDragging(active);
      },
      onRelease: (release) => latest.current.onRelease(release),
    });
    session.current = gesture;
    return () => {
      gesture.dispose();
      session.current = null;
    };
  }, [track]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => session.current?.start(event, latest.current.here());
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!session.current?.consumeClick()) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return { dragging, onPointerDown, onClickCapture };
}
