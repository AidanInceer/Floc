"use client";

import { linkShown } from "@floc/core/lists/wish-list";
import { countryName } from "@floc/core/people/countries";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useTransition, type ReactNode } from "react";

import { removeWishItemAction } from "@/app/lists/wish/actions";
import { ExploreTile, footLineClass, lastLineClass } from "@/components/explore/all/explore-tile";
import { Menu } from "@/components/system/client-ui";
import { Avatar, cx, menuItemClass } from "@/components/system/ui";
import { wishStartHref } from "@/lib/landing/start-trip";
import type { WishItem } from "@/server/wish-lists/wish-lists";

import { CountryTile } from "../country-tile";
import { SavedSection, savedCountryGridClass, savedTripGridClass } from "../saved-section";
import { StartTripButton } from "../start-trip-button";

type Props = { listId: number; items: WishItem[]; listings: Record<string, PresetTrip> };

/**
 * What a wish list holds (#623), in Saved's runs: Explore trips, countries, then ideas and links. Each tile says who
 * added it, starts a trip with the list's people asked along, and keeps Remove behind its menu.
 */
export function WishItems({ listId, items, listings }: Props) {
  const trips = items.filter((i) => i.kind === "explore" && i.presetId && listings[i.presetId]);
  const countries = items.filter((i) => i.kind === "country" && i.countryCode);
  const notes = items.filter((i) => i.kind === "text" || i.kind === "link");
  return (
    <div>
      {trips.length ? (
        <SavedSection title="Trips" count={trips.length}>
          <ul className={savedTripGridClass}>
            {trips.map((item) => {
              const trip = listings[item.presetId!];
              return (
                <li key={item.id}>
                  <ExploreTile
                    trip={trip}
                    action={<StartTripButton name={trip.title} href={wishStartHref({ kind: "explore", presetId: trip.id }, listId)} />}
                    footer={<Foot listId={listId} item={item} what={trip.title} />}
                  />
                </li>
              );
            })}
          </ul>
        </SavedSection>
      ) : null}
      {countries.length ? (
        <SavedSection title="Countries" count={countries.length}>
          <ul className={savedCountryGridClass}>
            {countries.map((item) => {
              const name = countryName(item.countryCode!);
              return (
                <li key={item.id}>
                  <CountryTile
                    code={item.countryCode!}
                    name={name}
                    startHref={wishStartHref({ kind: "country", name }, listId)}
                    footer={<Foot listId={listId} item={item} what={name} />}
                  />
                </li>
              );
            })}
          </ul>
        </SavedSection>
      ) : null}
      {notes.length ? (
        <SavedSection title="Ideas and links" count={notes.length}>
          <ul className={savedCountryGridClass}>
            {notes.map((item) => (
              <li key={item.id}>
                <NoteTile listId={listId} item={item} />
              </li>
            ))}
          </ul>
        </SavedSection>
      ) : null}
    </div>
  );
}

function NoteTile({ listId, item }: { listId: number; item: WishItem }) {
  const isLink = item.kind === "link" && item.url;
  const shown = isLink ? linkShown(item.label, item.url!) : (item.text ?? "");
  const host = isLink ? linkShown(null, item.url!) : null;
  const body = (
    <>
      <span className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{shown}</span>
      {host && host !== shown ? <span className="nums mt-1 block truncate font-mono text-[11px] text-ink-faint">{host}</span> : null}
    </>
  );
  return (
    <div className="lift relative flex h-full min-h-36 flex-col rounded-md bg-sheet p-3 shadow-[var(--shadow)]">
      {isLink ? (
        <a
          href={item.url!}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex flex-col text-ink after:absolute after:inset-0 after:content-[''] hover:text-pen"
        >
          {body}
        </a>
      ) : (
        <p className="flex flex-col">{body}</p>
      )}
      <div className={cx(lastLineClass, "pt-3")}>
        <span className="typed text-ink-faint">{isLink ? "Link" : "Idea"}</span>
        <StartTripButton name={shown} href={wishStartHref({ kind: "text", text: shown }, listId)} />
      </div>
      <div className={cx(footLineClass, "pt-1")}>
        <Foot listId={listId} item={item} what={shown} />
      </div>
    </div>
  );
}

/** Who added it, and the menu that holds Remove: one visible action per tile stays Start trip. */
function Foot({ listId, item, what }: { listId: number; item: WishItem; what: string }) {
  const [pending, start] = useTransition();
  const by = item.addedBy?.name;
  return (
    <span className="flex w-full items-center justify-between gap-2">
      {by ? <AddedBy name={by} /> : <span />}
      <Menu label={`Options for ${what}`} drop="up">
        <button
          type="button"
          disabled={pending}
          className={menuItemClass}
          onClick={() => start(async () => { await removeWishItemAction(listId, item.id); })}
        >
          Remove from list
        </button>
      </Menu>
    </span>
  );
}

function AddedBy({ name }: { name: string }): ReactNode {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-soft" title={`Added by ${name}`}>
      <Avatar name={name} size={18} />
      <span className="truncate">{name.split(/\s+/)[0]}</span>
    </span>
  );
}
