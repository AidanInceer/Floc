"use client";

import type { ReactNode } from "react";

import { ProStrip } from "./pro-strip";
import { ProTicket } from "./pro-ticket";
import { useTabRun } from "./use-tab-run";
import "./pro-tour.css";

export function ProTour({ children }: { children?: ReactNode }) {
  const { ref, run } = useTabRun();
  return (
    <div ref={ref} className="pro-browser mt-9">
      <ProStrip closed={run.closed} piled={run.piled} />
      <div className="pro-page">
        <ProTicket done={run.done} />
      </div>
      {children}
    </div>
  );
}
