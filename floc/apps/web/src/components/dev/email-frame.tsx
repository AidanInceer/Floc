"use client";

import { useEffect, useRef, useState } from "react";

/** One email in a frame as tall as the email, so a long one is never cut off. */
export function EmailFrame({ title, html }: { title: string; html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(640);
  const measure = () => setHeight(frame.current?.contentDocument?.documentElement.offsetHeight ?? 640);

  // Why: a srcdoc frame can finish loading before React hydrates, and then its load event is never seen.
  useEffect(measure, [html]);

  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={html}
      style={{ height }}
      onLoad={measure}
      className="w-full rounded-md border border-rule bg-sheet"
    />
  );
}
