/** Runs `step` once a frame while it says something still moves, then rests until woken. `dt` is the ms since the last frame, at most 50. */
export function frameLoop(step: (now: number, dt: number) => boolean) {
  let [then, frame] = [0, 0];

  function tick() {
    const now = performance.now();
    const dt = Math.min(50, now - then);
    then = now;
    frame = step(now, dt) ? requestAnimationFrame(tick) : 0;
  }

  return {
    wake() {
      if (frame) return;
      then = performance.now();
      frame = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
