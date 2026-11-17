"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { mergeSlots } from "@/lib/days/day-slots";
import { calendarWeek, weekTracks } from "@floc/core/dates/calendar-week";
import { addDays, dayParts } from "@floc/core/dates/dates";

function outsideDay(days: CalendarDay[], focusIndex: number, index: number): CalendarDay {
  const date = addDays(days[focusIndex].date, index - focusIndex);
  const { weekday, day } = dayParts(date);
  return {
    id: index < 0 ? index : -10 - (index - days.length),
    date,
    weekday,
    dayOfMonth: String(day),
    longLabel: "",
    shortLabel: "",
    overnightPlaceName: null,
    overnightPlaceId: null,
    outside: true,
    isToday: false,
  };
}

function useGlide(monday: string) {
  const [shownWeek, setShownWeek] = useState(monday);
  const [glide, setGlide] = useState(true);
  if (shownWeek !== monday) {
    setShownWeek(monday);
    setGlide(false);
  }
  useEffect(() => {
    if (glide) return;
    const frame = requestAnimationFrame(() => setGlide(true));
    return () => cancelAnimationFrame(frame);
  }, [glide]);
  return glide;
}

export function useDaySlots(days: CalendarDay[], focusIndex: number, narrow: number[]) {
  const week = calendarWeek(days[focusIndex].date, focusIndex, days.length);
  const weekKey = week.indices.join();
  const narrowKey = narrow.join();
  const slots = useMemo(
    () =>
      mergeSlots(weekKey.split(",").map(Number), narrowKey.split(",").map(Number)).map(({ index, only }) => ({
        ...(days[index] ?? outsideDay(days, focusIndex, index)),
        only,
      })),
    [days, focusIndex, weekKey, narrowKey],
  );
  const shownIds = useMemo(() => new Set(slots.filter((d) => !d.outside).map((d) => d.id)), [slots]);
  const glide = useGlide(week.monday);
  const style = { "--days-week": weekTracks(week.indices, focusIndex, days.length) } as CSSProperties;
  return { slots, week, shownIds, glide, style };
}
