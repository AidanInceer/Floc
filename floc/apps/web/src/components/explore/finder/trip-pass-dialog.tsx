"use client";

import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { ExplorePass } from "@/components/explore/all/explore-pass";
import { Dialog } from "@/components/system/dialog";
import { CrossIcon } from "@/components/system/icons";

/** One listing's pass, opened from its tile: a sheet from the bottom on a phone, a card in the middle on a wide screen. */
export function TripPassDialog({ id, likes, signedIn, onClose }: { id: string | null; likes: TripTag[]; signedIn: boolean; onClose: () => void }) {
  const trip = PRESET_TRIPS.find((t) => t.id === id);
  return (
    <Dialog
      open={!!trip}
      onClose={onClose}
      title={trip?.title ?? "Trip"}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-md bg-sheet p-0 text-ink backdrop:bg-black/40 sm:m-auto sm:max-w-lg sm:rounded-md"
    >
      <div className="sticky top-0 z-10 flex justify-end bg-sheet px-2 py-1.5">
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-ink-soft hover:text-ink">
          <CrossIcon />
        </button>
      </div>
      {trip ? <ExplorePass trip={trip} likes={likes} signedIn={signedIn} inSheet /> : null}
    </Dialog>
  );
}
