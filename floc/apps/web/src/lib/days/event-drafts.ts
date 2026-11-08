import type { DayEventType, TransportType } from "@floc/core/vocabulary";

/** The fields of a calendar block the open event's form can change before its save lands. */
export type EventDraft = Partial<{
  type: DayEventType;
  transportType: TransportType | null;
  title: string;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
  hasNote: boolean;
}>;

export type HeldDrafts = Map<number, { draft: EventDraft; rev: number }>;

const CLOCK = /^\d{2}:\d{2}$/;

export function holdDraft(held: HeldDrafts, eventId: number, draft: EventDraft, rev: number): HeldDrafts {
  return new Map(held).set(eventId, { draft: { ...held.get(eventId)?.draft, ...draft }, rev });
}

/** The save carrying `rev` landed. A later change keeps its draft until its own save lands. */
export function settleDraft(held: HeldDrafts, eventId: number, rev: number): HeldDrafts {
  const kept = held.get(eventId);
  if (!kept || kept.rev > rev) return held;
  const next = new Map(held);
  next.delete(eventId);
  return next;
}

export function withDrafts<T extends { id: number }>(events: T[], held: HeldDrafts): T[] {
  if (held.size === 0) return events;
  return events.map((event) => {
    const kept = held.get(event.id);
    return kept ? { ...event, ...kept.draft } : event;
  });
}

/** A form field's value as the block draws it; null while the block has nothing new to show. */
export function draftOfField(name: string, value: string): EventDraft | null {
  switch (name) {
    case "title":
      return value.trim() ? { title: value } : null;
    case "time":
      return CLOCK.test(value) ? { time: value } : null;
    case "endTime":
      return value === "" || CLOCK.test(value) ? { endTime: value || null } : null;
    case "note":
      return { note: value || null, hasNote: Boolean(value) };
    default:
      return null;
  }
}
