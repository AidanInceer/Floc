/**
 * The trip, day by day, for someone who cannot change it (#330). Day-first, one
 * card per day, wearing the same category tints the Days calendar gives an
 * event — a guest and a member should recognise the same trip.
 *
 * Nothing here is a control. No links into `/trip/`, no add row, no empty-state
 * button: every one of those would be a door a guest cannot walk through. The
 * one thing it does say is what is missing (rule 11).
 */
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { formatDate } from "@floc/core/dates/dates";
import type { GuestDay } from "@/server/trips/guest-view";
import { cx, SectionHeading } from "@/components/system/ui";

export function GuestItinerary({ days }: { days: GuestDay[] }) {
  if (days.length === 0) {
    return (
      <section className="rounded-lg bg-sheet p-6 ring-1 ring-rule">
        <SectionHeading>The trip, day by day</SectionHeading>
        <p className="mt-4 text-sm text-ink-soft">
          No days have been laid out yet, so there is nothing to show here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-sheet p-4 ring-1 ring-rule sm:p-6">
      <SectionHeading>The trip, day by day</SectionHeading>

      <ol className="mt-4 flex flex-col gap-3">
        {days.map((d) => (
          <li key={d.id} className="rounded-md bg-sheet-2 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-md font-semibold">
                {formatDate(d.date)}
              </p>
              {d.overnightPlaceName ? (
                <p className="typed">{d.overnightPlaceName}</p>
              ) : null}
            </div>

            {d.events.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Nothing planned yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {d.events.map((e) => {
                  const category = EVENT_CATEGORIES[e.type];
                  return (
                    <li
                      key={e.id}
                      className={cx(
                        "flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm border border-l-4 px-3 py-2",
                        category.block,
                      )}
                    >
                      <span className="data w-[6.5rem] shrink-0 text-xs opacity-90">
                        {e.allDay ? "All day" : timeLabel(e.time, e.endTime)}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {e.title ?? category.label}
                      </span>
                      {e.placeName ? (
                        <span className="text-xs opacity-75">{e.placeName}</span>
                      ) : null}
                      {/* Colour never says the category on its own. */}
                      <span className="typed text-current">{category.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function timeLabel(time: string | null, endTime: string | null): string {
  if (!time) return "Sometime";
  return endTime ? `${time}–${endTime}` : time;
}
