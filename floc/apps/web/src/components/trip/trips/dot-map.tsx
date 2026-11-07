"use client";

import { useEffect, useRef } from "react";

import { useLand } from "@/components/explore/outline/use-land";
import { watchRedraw } from "@/components/globe/watch-redraw";
import { worldDots } from "@/components/explore/outline/world-dots";
import { TargetIcon } from "@/components/system/icons";

/**
 * A trip with no stops on the map yet still shows a map: the world as blue dots (blue is Where), with a pill that
 * says what is missing. Blue whatever the trip's own colour, so it reads as "no places yet".
 */
export function DotMap({ label }: { label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useLand("world");

  useEffect(() => {
    const [box, node] = [host.current, canvas.current];
    const ctx = node?.getContext("2d");
    if (!box || !node || !ctx) return;
    const draw = () => {
      const { width: w, height: h } = box.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      [node.width, node.height] = [Math.round(w * dpr), Math.round(h * dpr)];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const step = Math.max(6, Math.min(9, w / 90));
      ctx.fillStyle = getComputedStyle(node).getPropertyValue("--pastel-blue-ink").trim();
      // Why: dark's blue ink is pale, so at the light theme's strength the dots read grey, not Where blue.
      ctx.globalAlpha = document.documentElement.dataset.theme === "dark" ? 1 : 0.62;
      for (const d of worldDots(world, w, h, step)) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, step * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    return watchRedraw(box, draw);
  }, [world]);

  return (
    <div ref={host} className="absolute inset-0">
      <canvas ref={canvas} className="block size-full" aria-hidden="true" />
      <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-ink-soft bg-sheet py-1 pl-2 pr-3 text-xs font-semibold text-ink-soft">
        <TargetIcon />
        {label}
      </span>
    </div>
  );
}
