"use client";

/**
 * Remove someone from the trip, from their own row in the Overview roster
 * (ticket 38). Kicking used to be a "Kick" button inside the Trip settings
 * disclosure, on a second copy of the member list — so an admin removing
 * someone did it a screen away from the roster they were reading. This puts it
 * on the person, the way the nudge bell already is.
 *
 * A boot, not a cross: the icon has to say *removed from the trip* rather than
 * "close" or "delete", and it swings on click so the tap is acknowledged even
 * though the confirm dialog is what actually follows. Never colour or picture
 * alone — the accessible name and tooltip both say "Remove <name>", and the
 * dialog names them again before anything happens.
 *
 * Kick is one of the four admin powers (CLAUDE.md rule 6) and stays gated in
 * `kickMember` by `assertAdmin`; rendering conditionally here is presentation.
 */
import { useState } from "react";

import { ConfirmSubmit } from "@/components/client-ui";
import { cx } from "@/components/ui";
import { kickMember } from "@/app/trip/[id]/overview/actions";

export function KickBoot({
  tripId,
  userId,
  name,
}: {
  tripId: number;
  userId: string;
  name: string;
}) {
  const [swinging, setSwinging] = useState(false);

  return (
    /* A real Server Action ref on the form, so it survives the server→client
       boundary — the roster around this is a Server Component. */
    <form action={kickMember}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="userId" value={userId} />
      {/*
        The click is caught on the wrapper rather than on the button: the button
        belongs to `ConfirmSubmit`, which owns opening the dialog, and prising
        that apart to add one class would mean duplicating its dialog here.
        Clearing the flag on animationend would need a ref into the same button,
        so it's a timer just past the animation's own length.
      */}
      <span
        onClick={() => {
          setSwinging(true);
          window.setTimeout(() => setSwinging(false), 500);
        }}
      >
        <ConfirmSubmit
          variant="ghost"
          label={`Remove ${name} from this trip`}
          message={`Remove ${name} from this trip? Anything they've already posted stays on the board.`}
          confirmLabel="Remove them"
          pendingLabel="…"
          className="!h-[26px] !w-[26px] !rounded-full !border-transparent !px-0 !py-0 !text-ink-faint hover:!border-rule-strong hover:!bg-red-soft hover:!text-red"
        >
          <BootIcon swinging={swinging} />
        </ConfirmSubmit>
      </span>
    </form>
  );
}

/** A side-on walking boot: sole, upper, laces. Kicks to the right on click. */
function BootIcon({ swinging }: { swinging: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // `boot-swing` is in globals.css, and the app's global
      // prefers-reduced-motion block flattens it for anyone who asked.
      className={cx("origin-bottom", swinging && "boot-swing")}
    >
      <path d="M8 3v9" />
      <path d="M8 12h4l4 3.5V19H5v-3.5L8 12Z" />
      <path d="M8 6h3M8 9h3" />
    </svg>
  );
}
