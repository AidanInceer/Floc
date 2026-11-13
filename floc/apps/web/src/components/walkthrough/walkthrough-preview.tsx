/**
 * The page a first step opens, drawn small (wireframe/trip-onboarding E5c), from the trip's own
 * data: its top ideas, its dates, its group. Where the trip has nothing yet it says so in words.
 */
import type { ComponentProps } from "react";

import type { WalkthroughStepKey } from "@floc/core/trip/walkthrough";
import { CopyLink } from "@/components/system/client-ui";
import { AvatarRow, cx } from "@/components/system/ui";

type Person = ComponentProps<typeof AvatarRow>["people"][number];

export type PreviewData = {
  /** The top three by votes. */
  ideas: { title: string; votes: number }[];
  /** The trip's dates as a line, or null while unset. */
  dates: string | null;
  inviteUrl: string;
  group: Person[];
};

// A fortnight of free-day counts, as the Dates board shades them. Day numbers, never a month: an illustration, not a claim.
const FREE = [0, 1, 1, 2, 3, 3, 3, 1, 2, 0, 1, 2, 1, 0];
const FREE_SKIN = ["bg-sheet-2 text-ink-faint", "bg-some-free-1 text-some-free-ink", "bg-some-free-2 text-some-free-ink", "bg-some-free-3 text-some-free-ink"];

function Missing({ children }: { children: string }) {
  return <p className="w-full text-center font-mono text-xs text-ink-faint">{children}</p>;
}

function IdeasPreview({ ideas }: { ideas: PreviewData["ideas"] }) {
  if (ideas.length === 0) return <Missing>No ideas yet</Missing>;
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {ideas.map((idea) => (
        <span key={idea.title} className="grid min-w-0 gap-2 rounded-sm border border-rule px-2.5 py-2">
          <b className="truncate font-display text-sm font-semibold">{idea.title}</b>
          <span className="font-mono text-[11px] text-ink-soft">{idea.votes === 1 ? "1 vote" : `${idea.votes} votes`}</span>
        </span>
      ))}
    </div>
  );
}

/** Why no URL: the link is never drawn on a page, the button copies it (as on the group panel). */
function InvitePreview({ inviteUrl, group }: Pick<PreviewData, "inviteUrl" | "group">) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <span className="flex items-center">
        <AvatarRow people={group} max={3} size={28} />
        {[0, 1, 2].map((n) => (
          <span key={n} aria-hidden className="-ml-2 size-7 rounded-full border border-dashed border-rule-strong bg-sheet ring-2 ring-sheet" />
        ))}
      </span>
      <CopyLink value={inviteUrl} />
    </div>
  );
}

function FindDatesPreview() {
  return (
    <div aria-hidden className="grid w-full grid-cols-7 gap-1">
      {FREE.map((free, n) => (
        <span
          key={n}
          className={cx("grid h-7 place-items-center rounded-sm font-mono text-[11px]", FREE_SKIN[free], n >= 4 && n <= 6 && "ring-[1.5px] ring-inset ring-pen")}
        >
          {n + 1}
        </span>
      ))}
    </div>
  );
}

function SetDatesPreview({ dates }: { dates: string | null }) {
  if (!dates) return <Missing>Dates not set</Missing>;
  return <p className="nums w-full text-center text-[15px] text-ink">{dates}</p>;
}

export function WalkthroughPreview({ step, datesSet, data }: { step: WalkthroughStepKey; datesSet: boolean; data: PreviewData }) {
  if (step === "ideas") return <IdeasPreview ideas={data.ideas} />;
  if (step === "invite") return <InvitePreview inviteUrl={data.inviteUrl} group={data.group} />;
  if (step === "dates") return datesSet ? <SetDatesPreview dates={data.dates} /> : <FindDatesPreview />;
  return null;
}
