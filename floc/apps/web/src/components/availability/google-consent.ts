"use client";

import { createAuthClient } from "better-auth/react";

import { GOOGLE_CALENDAR_CONSENT } from "@floc/core/dates/calendar-import";

const client = createAuthClient();

/** Sends the browser to Google for the calendar scope (#444); on success it never returns here. */
export async function askGoogleForCalendar(callbackURL: string, errorCallbackURL: string): Promise<boolean> {
  const { error } = await client.linkSocial({ ...GOOGLE_CALENDAR_CONSENT, callbackURL, errorCallbackURL });
  return !error;
}
