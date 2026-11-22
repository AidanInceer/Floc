"use client";

import { peopleCount } from "@floc/core/people/group-ticks";
import { countWord } from "@floc/core/text/count-word";
import { groupIdeasNote, groupIdeasTitle } from "@floc/core/trip/explore/fit/group-words";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import { groupIdeasAction, sendGroupIdeasAction, type GroupIdeasFound } from "@/app/friends/actions";
import { tagClass } from "@/components/explore/all/explore-tile";
import { MatchDial } from "@/components/explore/all/match-dial";
import { skinFor } from "@/components/explore/listing";
import { ListingRatesProvider, useListingRates } from "@/components/explore/listing-rates";
import { OutlineMap } from "@/components/explore/outline/outline-map";
import { SaveHeart } from "@/components/explore/save/save-heart";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { WishVoteButton } from "@/components/lists/wish/wish-vote-button";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { Button, ErrorText, SheetFooter, busyMark, cx, pressArea } from "@/components/system/ui";
import type { SentGroupIdeas, SentIdea } from "@/server/social/group-ideas";
import type { Group } from "@/server/social/groups";


const LISTINGS = new Map(PRESET_TRIPS.map((trip) => [trip.id, trip]));
const lineClass = "shrink-0 text-balance border-b border-rule px-4 py-3 text-sm leading-snug text-ink-soft";
const IDEAS_DIALOG =
  "m-auto h-[min(54rem,calc(100dvh-48px))] w-full max-w-lg flex-col overflow-hidden rounded-md border border-rule bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 open:flex max-sm:mb-0 max-sm:h-[92dvh] max-sm:max-w-full max-sm:rounded-b-none";
const TRAVEL_STYLE = "/profile?section=about-you#settings-about-you";
const FAILED = "Floc could not find trips just now. Close this and try again.";

export default function GroupIdeasDialog({ group, onClose }: { group: Group; onClose: () => void }) {
  const [found, setFound] = useState<GroupIdeasFound>();
  const [filled, setFilled] = useState(false);
  const [sent, setSent] = useState<SentGroupIdeas>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const title = groupIdeasTitle(group.name);

  useEffect(() => {
    let live = true;
    groupIdeasAction(group.id)
      .catch((): GroupIdeasFound => ({ error: FAILED }))
      .then((out) => {
        if (live) setFound(out);
      });
    return () => {
      live = false;
    };
  }, [group.id]);

  const send = () =>
    start(async () => {
      const out = await sendGroupIdeasAction(group.id);
      setError(out.error);
      if (out.sent) setSent(out.sent);
    });

  const voted = (itemId: number) =>
    setSent((now) =>
      now && { ...now, items: now.items.map((item) => (item.itemId === itemId ? { ...item, voted: !item.voted, votes: item.votes + (item.voted ? -1 : 1) } : item)) },
    );

  const ideas = found?.ideas;
  const ready = filled && found;
  return (
    <Dialog open onClose={onClose} title={title} className={IDEAS_DIALOG}>
      <header className="flex shrink-0 items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <DialogClose />
      </header>
      {!ready ? (
        <Finding name={group.name} onFilled={() => setFilled(true)} />
      ) : !ideas ? (
        <div className="px-4 py-6"><ErrorText>{found.error}</ErrorText></div>
      ) : ideas.ideas.length === 0 ? (
        <p className="px-4 py-8 text-sm text-ink-soft">
          Nobody in this group has a travel style yet.{" "}
          <Link href={TRAVEL_STYLE} className="text-pen hover:text-pen-deep">Add your travel style</Link>
        </p>
      ) : (
        <ListingRatesProvider rates={found.rates ?? null}>
          <SavedTripsProvider ids={found.saved ?? []} signedIn>
            {sent ? (
              <p className={lineClass}>
                Sent to {peopleCount(ideas.people)}.{" "}
                <Link href={`/lists/wish/${sent.listId}`} className="text-pen hover:text-pen-deep">Open the list</Link>
              </p>
            ) : (
              <Note text={groupIdeasNote(ideas)} />
            )}
            <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4">
              {ideas.ideas.map((idea) => {
                const trip = LISTINGS.get(idea.presetId);
                const item = sent?.items.find((i) => i.presetId === idea.presetId);
                if (!trip) return null;
                return (
                  <IdeaRow key={trip.id} trip={trip} match={idea.match}>
                    {sent && item ? <Vote listId={sent.listId} item={item} what={trip.title} onDone={() => voted(item.itemId)} /> : null}
                    {sent ? null : <SaveHeart presetId={trip.id} title={trip.title} className={cx(pressArea, "size-[26px] shadow-none sm:size-[26px]")} />}
                  </IdeaRow>
                );
              })}
            </ul>
            {sent ? null : (
              <SheetFooter note="Everyone in the group can vote.">
                <div className="flex flex-col items-end gap-1">
                  <Button variant="primary" disabled={pending} onClick={send}>
                    Ask {group.name} to vote{busyMark(pending)}
                  </Button>
                  <ErrorText>{error}</ErrorText>
                </div>
              </SheetFooter>
            )}
          </SavedTripsProvider>
        </ListingRatesProvider>
      )}
    </Dialog>
  );
}

function Finding({ name, onFilled }: { name: string; onFilled: () => void }) {
  return (
    <div role="status" className="grid flex-1 place-content-center justify-items-center gap-4 px-4 py-20 text-sm text-ink-soft">
      <svg viewBox="0 0 56 56" width={56} height={56} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden className="text-ink">
        <circle cx="28" cy="28" r="24" className="stroke-rule-strong" />
        <circle cx="28" cy="28" r="24" pathLength={100} transform="rotate(-90 28 28)" className="dial-fill" onAnimationEnd={onFilled} />
      </svg>
      <p>Finding trips for {name}</p>
    </div>
  );
}

function Note({ text }: { text: string | null }) {
  return text ? <p className={lineClass}>{text}</p> : null;
}

function Vote({ listId, item, what, onDone }: { listId: number; item: SentIdea; what: string; onDone: () => void }) {
  return <WishVoteButton listId={listId} itemId={item.itemId} what={what} votes={item.votes} mine={item.voted} onDone={onDone} />;
}

function IdeaRow({ trip, match, children }: { trip: PresetTrip; match: number; children: ReactNode }) {
  const rates = useListingRates();
  return (
    <li className="flex items-center gap-2.5 border-b border-rule last:border-b-0">
      <Link href={`/explore/${trip.id}`} className="group flex min-w-0 flex-1 items-center gap-3 py-2.5 text-ink max-sm:gap-2.5">
        <span aria-hidden className="block aspect-[24/17] w-16 shrink-0 overflow-hidden rounded-sm bg-sheet-2 max-sm:w-12">
          <OutlineMap trip={trip} size="tile" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <b className="text-balance font-display text-base font-semibold leading-tight tracking-[-0.02em] transition-colors group-hover:text-pen">{trip.title}</b>
          <span className="flex items-center gap-2">
            <span className={cx(tagClass, skinFor(trip), "min-w-0")}>{trip.country}</span>
            <span className="nums flex shrink-0 flex-col font-mono text-[11px] text-ink-faint sm:flex-row sm:gap-1">
              <span className="whitespace-nowrap">{countWord(trip.nights, "night")}<span className="max-sm:hidden"> ·</span></span>
              <span className="whitespace-nowrap">{listingPrice(trip, rates)}</span>
            </span>
          </span>
        </span>
        <MatchDial percent={match} />
      </Link>
      {children}
    </li>
  );
}
