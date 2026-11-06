"use client";

import { useEffect, useRef, useState } from "react";

import { askGoogleForCalendar } from "@/components/availability/google-consent";

export type CalendarFillResult =
  | { status: "filled"; free: number; busy: number }
  | { status: "needs-access" }
  | { status: "error"; message: string };

export type CalendarFillState =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "done"; free: number; busy: number }
  | { kind: "error"; message: string };

const CALENDAR_REFUSED = "Google didn't give access. Nothing changed.";
const CALENDAR_FAILED = "Couldn't reach Google Calendar. Nothing changed.";

/** What the page was sent back with after Google's consent screen: it filled, or the person said no. */
export type CalendarReturn = "fill" | "refused" | null;

/**
 * The one read of the person's calendar, on their tap (ADR-031). First time, the server says it
 * has no access; the browser then goes to Google's consent and comes back to this page with
 * `?calendar=fill`, which reads straight away. A refusal comes back as `?calendar=refused`.
 */
export function useCalendarFill(opts: {
  tripId: number;
  month: string;
  returned: CalendarReturn;
  fill: (month: string) => Promise<CalendarFillResult>;
}) {
  const { tripId, month, returned, fill } = opts;
  const [state, setState] = useState<CalendarFillState>(
    returned === "refused" ? { kind: "error", message: CALENDAR_REFUSED } : { kind: "idle" },
  );
  const started = useRef(false);

  async function run() {
    setState({ kind: "reading" });
    try {
      const result = await fill(month);
      if (result.status === "filled") return setState({ kind: "done", free: result.free, busy: result.busy });
      if (result.status === "error") return setState({ kind: "error", message: result.message });
      const back = `/trip/${tripId}/dates`;
      const started = await askGoogleForCalendar(`${back}?calendar=fill&from=${month}`, `${back}?calendar=refused&from=${month}`);
      // On success the browser is already leaving for Google; only a failure to start gets here.
      if (!started) setState({ kind: "error", message: CALENDAR_REFUSED });
    } catch {
      setState({ kind: "error", message: CALENDAR_FAILED });
    }
  }

  useEffect(() => {
    if (returned === "fill" && !started.current) {
      started.current = true;
      void run();
    }
    if (returned) window.history.replaceState(null, "", `/trip/${tripId}/dates`);
    // Once, on arrival: `run` closes over the month the page opened on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, run };
}
