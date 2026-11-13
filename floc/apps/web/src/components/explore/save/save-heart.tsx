"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useTransition } from "react";

import { saveTrip } from "@/app/explore/actions";
import { useSavedTrips } from "@/components/explore/save/saved-trips";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import { cx } from "@/components/system/ui";

/** The white square a tile's corner holds: the heart, and a top pick's sun opposite it (#624). */
export const cornerBoxClass = "inline-flex size-10 items-center justify-center rounded-sm bg-sheet sm:size-9";

export const heartClass =
  "inline-flex size-10 items-center justify-center rounded-sm bg-sheet shadow-[var(--shadow-sm)] transition-colors hover:bg-pen-soft sm:size-9";

/**
 * Save to list (#467, ADR-042): outline when not saved, filled red when saved, a second tap takes it off.
 * Signed out, it is a sign-in link that comes back to this page with `?save=<id>`, and the save happens then.
 */
export function SaveHeart({ presetId, title, className }: { presetId: string; title: string; className?: string }) {
  const { ids, signedIn } = useSavedTrips();
  const [saved, setSaved] = useOptimistic(ids.has(presetId));
  const [, start] = useTransition();
  useSaveAfterSignIn(presetId, signedIn && !ids.has(presetId));

  if (!signedIn) return <SignInHeart presetId={presetId} title={title} className={className} />;

  const label = saved ? `Saved ${title}` : `Save ${title}`;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      className={cx(heartClass, saved ? "text-red" : "text-ink-soft hover:text-pen-deep", className)}
      onClick={() =>
        start(async () => {
          setSaved(!saved);
          await saveTrip(presetId, !saved);
        })
      }
    >
      <ReactionGlyph kind="heart" mine={saved} size={16} />
    </button>
  );
}

function SignInHeart({ presetId, title, className }: { presetId: string; title: string; className?: string }) {
  const path = usePathname();
  const back = encodeURIComponent(`${path}?save=${presetId}`);
  return (
    <Link href={`/login?redirect=${back}`} aria-label={`Save ${title}`} title="Save" className={cx(heartClass, "text-ink-soft hover:text-pen-deep", className)}>
      <ReactionGlyph kind="heart" mine={false} size={16} />
    </Link>
  );
}

/** Back from sign-in with `?save=<id>`: save it once, then drop the word from the address. */
function useSaveAfterSignIn(presetId: string, wanted: boolean) {
  const asked = useSearchParams().get("save") === presetId;
  const path = usePathname();
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (!asked || done.current) return;
    done.current = true;
    void (async () => {
      if (wanted) await saveTrip(presetId, true);
      router.replace(path, { scroll: false });
    })();
  }, [asked, wanted, presetId, path, router]);
}
