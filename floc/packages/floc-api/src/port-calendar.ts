export type CalendarAccess = { enabled: boolean; granted: boolean; allDayOnly: boolean };

export type CalendarFill =
  | { status: "filled"; free: number; busy: number }
  | { status: "needs-access" }
  | { status: "error"; message: string };

export type CalendarImportPort = {
  calendarAccess(viewerId: string): Promise<CalendarAccess>;

  fillFromCalendar(viewerId: string, tripId: number, month: string): Promise<CalendarFill>;

  setCalendarAllDayOnly(viewerId: string, on: boolean): Promise<void>;

  removeCalendarAccess(viewerId: string): Promise<string | null>;
};
