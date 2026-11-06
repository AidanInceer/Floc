/** The calendar-import half of the port (#444, ADR-031). Only the viewer's own days are ever written. */

/** Whether Floc can offer Google Calendar at all (a key is set), and whether this person has already given access. */
export type CalendarAccess = { enabled: boolean; granted: boolean };

/**
 * What one read of the primary calendar came to. `needs-access` means Google has not been given the
 * calendar yet, so the client starts the consent; `error` carries the sentence to show.
 */
export type CalendarFill =
  | { status: "filled"; free: number; busy: number }
  | { status: "needs-access" }
  | { status: "error"; message: string };

export type CalendarImportPort = {
  /** Whether the calendar import is offered, and whether this person has granted it. Never reads a calendar. */
  calendarAccess(viewerId: string): Promise<CalendarAccess>;

  /**
   * Fills the VIEWER'S OWN unmarked days from their Google calendar: the trip's dates, else `month`
   * (`YYYY-MM`). Hand marks are kept; nothing from the calendar is stored.
   */
  fillFromCalendar(viewerId: string, tripId: number, month: string): Promise<CalendarFill>;

  /** Revokes the calendar at Google, then forgets it. Null when done; otherwise the sentence that says why not. */
  removeCalendarAccess(viewerId: string): Promise<string | null>;
};
