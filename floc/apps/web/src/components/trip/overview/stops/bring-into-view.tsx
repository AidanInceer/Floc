"use client";

import { useEffect, useRef } from "react";

export function BringIntoView({ watch }: { watch: number }) {
  const mark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    mark.current?.parentElement?.scrollIntoView({ block: "center" });
  }, [watch]);
  return <span ref={mark} hidden />;
}
