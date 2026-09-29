type Track = { scrollLeft: number };
type Pointer = Pick<PointerEvent, "pointerType" | "button" | "clientX" | "pointerId">;
export type TrackRelease = { from: number; direction: -1 | 0 | 1 };

export function createTrackDrag(
  getTrack: () => Track | null,
  events: EventTarget,
  callbacks: { onDragging: (active: boolean) => void; onRelease: (release: TrackRelease) => void },
) {
  let suppressClick = false;
  let detach: (() => void) | null = null;
  return {
    start(event: Pointer, from: number) {
      if (detach || event.pointerType !== "mouse" || event.button !== 0) return;
      const track = getTrack();
      if (!track) return;
      suppressClick = false;
      const left = track.scrollLeft;
      callbacks.onDragging(true);
      const move = (next: Event) => {
        if ((next as PointerEvent).pointerId !== event.pointerId) return;
        track.scrollLeft = left - ((next as PointerEvent).clientX - event.clientX);
      };
      const up = (next: Event) => {
        if ((next as PointerEvent).pointerId !== event.pointerId) return;
        stop();
        const dx = (next as PointerEvent).clientX - event.clientX;
        suppressClick = Math.abs(dx) > 5;
        callbacks.onRelease({ from, direction: Math.abs(dx) > 60 ? (dx < 0 ? 1 : -1) : 0 });
      };
      const stop = () => {
        events.removeEventListener("pointermove", move);
        events.removeEventListener("pointerup", up);
        events.removeEventListener("pointercancel", cancel);
        events.removeEventListener("blur", stop);
        detach = null;
        callbacks.onDragging(false);
      };
      const cancel = (next: Event) => {
        if ((next as PointerEvent).pointerId === event.pointerId) stop();
      };
      events.addEventListener("pointermove", move);
      events.addEventListener("pointerup", up);
      events.addEventListener("pointercancel", cancel);
      events.addEventListener("blur", stop);
      detach = stop;
    },
    consumeClick() {
      const consumed = suppressClick;
      suppressClick = false;
      return consumed;
    },
    dispose() {
      detach?.();
      suppressClick = false;
    },
  };
}
