import type { LatLng } from "@/lib/landing/globe/sphere";

type Grip = {
  radius: () => number;
  view: () => LatLng;
  turnTo: (view: LatLng) => void;
  onGrab: () => void;
  /** `coast` is the flick's speed in degrees a millisecond; 0 when the globe was let go at rest. */
  onRelease: (coast: number) => void;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Drag turns the globe; letting go mid-move hands back the speed of the flick. */
export function globeDrag(canvas: HTMLCanvasElement, grip: Grip) {
  let drag: (LatLng & { x: number; y: number }) | null = null;
  let last = { x: 0, t: 0 };
  let coast = 0;

  function down(e: PointerEvent) {
    grip.onGrab();
    drag = { x: e.clientX, y: e.clientY, ...grip.view() };
    last = { x: e.clientX, t: 0 };
    coast = 0;
    canvas.setPointerCapture(e.pointerId);
  }
  function dragged(e: PointerEvent) {
    if (!drag) return;
    const k = 70 / grip.radius();
    grip.turnTo({ lng: drag.lng - (e.clientX - drag.x) * k, lat: clamp(drag.lat + (e.clientY - drag.y) * k, -70, 70) });
    const now = performance.now();
    if (last.t && now > last.t) coast = coast * 0.6 + ((-(e.clientX - last.x) * k) / (now - last.t)) * 0.4;
    last = { x: e.clientX, t: now };
  }
  function up() {
    if (!drag) return;
    drag = null;
    grip.onRelease(performance.now() - last.t > 80 ? 0 : clamp(coast, -0.9, 0.9));
  }

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", dragged);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  return {
    held: () => drag !== null,
    stop() {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", dragged);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    },
  };
}
