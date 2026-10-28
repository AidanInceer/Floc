import type { Point } from "../screen";

type Hand = {
  /** One finger or the mouse moved to `p`, having started at `from`. */
  drag: (from: Point, p: Point) => void;
  /** Two fingers: how far apart they are against when they landed, and the point between them. */
  pinch: (scale: number, mid: Point, start: Point) => void;
  /** A press that never moved past a few px. */
  tap: (p: Point) => void;
  /** The wheel, once the globe has been clicked; a trackpad pinch (ctrl + wheel) any time. */
  wheel: (factor: number, p: Point) => void;
  grab: () => void;
};

const STILL = 5;

/**
 * Pointer, pinch and wheel on the globe's canvas.
 * Why the wheel waits for a click: a live wheel would trap the page's scroll (the Route map rule, tickets 77, 82).
 */
export function gestures(canvas: HTMLCanvasElement, hand: Hand) {
  const down = new Map<number, Point>();
  let press: { id: number; from: Point; moved: boolean } | null = null;
  let pinch: { d: number; mid: Point } | null = null;
  let armed = false;

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pair = () => {
    const [a, b] = [...down.values()] as [Point, Point];
    return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  function onDown(e: PointerEvent) {
    hand.grab();
    down.set(e.pointerId, local(e));
    canvas.setPointerCapture(e.pointerId);
    if (down.size === 2) [pinch, press] = [pair(), null];
    else press = { id: e.pointerId, from: local(e), moved: false };
  }
  function onMove(e: PointerEvent) {
    if (!down.has(e.pointerId)) return;
    down.set(e.pointerId, local(e));
    if (pinch && down.size === 2) {
      const now = pair();
      return hand.pinch(now.d / pinch.d, now.mid, pinch.mid);
    }
    if (!press || press.id !== e.pointerId) return;
    const p = local(e);
    if (!press.moved && Math.hypot(p.x - press.from.x, p.y - press.from.y) < STILL) return;
    press.moved = true;
    canvas.classList.add("is-turning");
    hand.drag(press.from, p);
  }
  function onUp(e: PointerEvent) {
    down.delete(e.pointerId);
    canvas.classList.remove("is-turning");
    if (pinch) {
      if (down.size < 2) pinch = null;
      press = null;
      return;
    }
    const tapped = press?.id === e.pointerId && !press.moved && e.type === "pointerup";
    press = null;
    if (!tapped) return;
    armed = true;
    hand.tap(local(e));
  }
  function onWheel(e: WheelEvent) {
    if (!armed && !e.ctrlKey) return;
    e.preventDefault();
    hand.wheel(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), local(e));
  }
  const disarm = () => (armed = false);

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("mouseleave", disarm);
  return () => {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("mouseleave", disarm);
  };
}
