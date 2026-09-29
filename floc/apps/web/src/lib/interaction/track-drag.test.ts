import { describe, expect, it } from "vitest";

import { createTrackDrag } from "./track-drag";

function pointer(events: EventTarget, type: string, clientX: number, pointerId = 1) {
  events.dispatchEvent(Object.assign(new Event(type), { clientX, pointerId }));
}

function trackSession() {
  const events = new EventTarget();
  const track = { scrollLeft: 200 };
  const releases: { from: number; direction: -1 | 0 | 1 }[] = [];
  const dragging: boolean[] = [];
  const session = createTrackDrag(() => track, events, {
    onDragging: (active) => dragging.push(active),
    onRelease: (release) => releases.push(release),
  });
  return { events, track, releases, dragging, session };
}

describe("a card track's mouse drag session", () => {
  it.each([
    { dx: 5, direction: 0, click: false },
    { dx: 60, direction: 0, click: true },
    { dx: 61, direction: -1, click: true },
    { dx: -61, direction: 1, click: true },
  ])("releases displacement $dx with direction $direction", ({ dx, direction, click }) => {
    const { events, releases, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 2);
    pointer(events, "pointerup", 100 + dx);
    expect(releases).toEqual([{ from: 2, direction }]);
    expect(session.consumeClick()).toBe(click);
  });

  it("does nothing before the track mounts", () => {
    const session = createTrackDrag(() => null, new EventTarget(), {
      onDragging: () => { throw new Error("No track mounted"); },
      onRelease: () => { throw new Error("No track mounted"); },
    });
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 0);
    expect(session.consumeClick()).toBe(false);
  });

  it("does not leave a second session listening after release", () => {
    const { events, track, releases, dragging, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 2);
    session.start({ pointerType: "mouse", button: 0, clientX: 50, pointerId: 1 }, 4);
    pointer(events, "pointerup", 20);
    pointer(events, "pointermove", 0);
    pointer(events, "pointerup", 0);
    expect({ left: track.scrollLeft, releases, dragging }).toEqual({ left: 200, releases: [{ from: 2, direction: 1 }], dragging: [true, false] });
  });

  it("clears a pending drag click when a new gesture starts or the track unmounts", () => {
    const { events, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 0);
    pointer(events, "pointerup", 20);
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 1);
    expect(session.consumeClick()).toBe(false);
    pointer(events, "pointerup", 20);
    session.dispose();
    expect(session.consumeClick()).toBe(false);
  });
  it("moves the track with the mouse and releases one card forward", () => {
    const { events, track, releases, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 3);
    pointer(events, "pointermove", 20);
    expect(track.scrollLeft).toBe(280);
    pointer(events, "pointerup", 20);
    expect(releases).toEqual([{ from: 3, direction: 1 }]);
  });

  it("suppresses the click after a drag, then allows subsequent clicks", () => {
    const { events, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 0);
    pointer(events, "pointerup", 80);
    expect(session.consumeClick()).toBe(true);
    expect(session.consumeClick()).toBe(false);
  });

  it("stops moving on cancellation without snapping the track", () => {
    const { events, track, releases, dragging, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 0);
    pointer(events, "pointermove", 80);
    pointer(events, "pointercancel", 80);
    pointer(events, "pointermove", 20);
    pointer(events, "pointerup", 20);
    expect({ left: track.scrollLeft, releases, dragging }).toEqual({ left: 220, releases: [], dragging: [true, false] });
  });

  it.each([{ pointerType: "touch", button: 0 }, { pointerType: "pen", button: 0 }, { pointerType: "mouse", button: 2 }])("leaves $pointerType button $button gestures native", (input) => {
    const { events, track, releases, dragging, session } = trackSession();
    session.start({ ...input, clientX: 100, pointerId: 1 }, 0);
    pointer(events, "pointermove", 20);
    pointer(events, "pointerup", 20);
    expect({ left: track.scrollLeft, releases, dragging }).toEqual({ left: 200, releases: [], dragging: [] });
  });

  it("ignores another pointer while the mouse owns the track", () => {
    const { events, track, releases, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 2);
    pointer(events, "pointermove", 0, 2);
    pointer(events, "pointercancel", 0, 2);
    pointer(events, "pointerup", 0, 2);
    expect(track.scrollLeft).toBe(200);
    pointer(events, "pointermove", 30);
    pointer(events, "pointerup", 30);
    expect(releases).toEqual([{ from: 2, direction: 1 }]);
  });

  it.each(["blur", "dispose"])("ends the session on %s without later movement or release", (reason) => {
    const { events, track, releases, dragging, session } = trackSession();
    session.start({ pointerType: "mouse", button: 0, clientX: 100, pointerId: 1 }, 0);
    if (reason === "blur") events.dispatchEvent(new Event("blur"));
    else session.dispose();
    pointer(events, "pointermove", 20);
    pointer(events, "pointerup", 20);
    expect({ left: track.scrollLeft, releases, dragging }).toEqual({ left: 200, releases: [], dragging: [true, false] });
  });
});
