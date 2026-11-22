"use client";

import { createAuthClient } from "better-auth/react";
import { useEffect, useRef, useState } from "react";

import { GOOGLE_CALENDAR_CONSENT } from "@floc/core/dates/calendar-import";

const client = createAuthClient();

async function askGoogleForCalendar(callbackURL: string, errorCallbackURL: string): Promise<boolean> {
  const { error } = await client.linkSocial({ ...GOOGLE_CALENDAR_CONSENT, callbackURL, errorCallbackURL });
  return !error;
}

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

export type CalendarReturn = "fill" | "refused" | null;

export type CalendarSource = {
  fill: (month: string) => Promise<CalendarFillResult>;
  returned: CalendarReturn;
  allDayOnly: boolean;
  keepAllDayOnly: (on: boolean) => Promise<void>;
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, run };
}
