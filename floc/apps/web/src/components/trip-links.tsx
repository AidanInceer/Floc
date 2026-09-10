/**
 * The trip's link shelf (ticket 103) — server-rendered, like everything else in
 * the Days pane that has a mutation behind it.
 *
 * Deliberately plain: a line per link, the label as the link text, the host
 * underneath so you can see where it goes before you click. `rel="noreferrer"`
 * and `target="_blank"` on every one, because these are addresses another
 * member typed and the tab they open must not be able to reach back.
 */
import type { ReactNode } from "react";

import { addTripLink, removeTripLink } from "@/app/trip/[id]/days/link-actions";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { Input } from "@/components/ui";
import type { TripLinkRow } from "@/server/trips/trip-links";

export function TripLinks({
  tripId,
  links,
}: {
  tripId: number;
  links: TripLinkRow[];
}): ReactNode {
  return (
    <section className="mt-4 border-t border-rule pt-3">
      <h3 className="typed">Trip links</h3>
      <p className="mt-1 text-sm text-ink-soft">
        The listings, timetables and documents the group keeps coming back to.
      </p>

      {links.length === 0 ? (
        <p className="mt-2 text-sm text-ink-faint">Nothing on the shelf yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {links.map((link) => (
            <li key={link.id} className="flex items-start gap-2">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 text-sm text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
              >
                <span className="block truncate font-medium">{link.label}</span>
                <span className="block truncate text-[11.5px] text-ink-faint no-underline">
                  {hostOf(link.url)} · added by {link.authorName}
                </span>
              </a>
              <form action={removeTripLink.bind(null, tripId, link.id)}>
                <ConfirmSubmit
                  message="Remove this link?"
                  variant="ghost"
                  label={`Remove ${link.label}`}
                >
                  ×
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addTripLink.bind(null, tripId)} className="mt-3 space-y-2">
        <Input
          name="url"
          type="url"
          required
          placeholder="https://…"
          aria-label="Link address"
        />
        <Input
          name="label"
          maxLength={120}
          placeholder="What is it? (optional)"
          aria-label="What the link is"
        />
        <SubmitButton variant="secondary">Add link</SubmitButton>
      </form>
    </section>
  );
}

/** Shown under the label so nobody has to click to find out where it goes. */
function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
