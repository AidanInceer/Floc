"use client";

import { useState } from "react";
import { TEXT_CAPS } from "@floc/core/text/text";

import { ChevronIcon, PlusIcon } from "@/components/system/icons";
import { StarIcon } from "@/components/system/icons/explore-trip";
import { TravelModeIcon } from "@/components/system/icons/travel-mode";
import { NavGlyph } from "@/components/system/icons/nav";
import { LinkIcon } from "@/components/system/icons/onboarding";
import { Avatar, Button, Input } from "@/components/system/ui";
import { FlocMark, FlocWord } from "@/components/system/wordmark";
import { LinkPaste } from "../link-paste";
import { DoorRow } from "../trip-doors";

export function IntroStep({ invited }: { invited: string | null }) {
  const ahead = [
    { line: "Where you fly from", icon: <TravelModeIcon mode="flight" />, tone: "bg-pastel-blue text-pastel-blue-ink" },
    { line: "How you like to travel", icon: <StarIcon />, tone: "bg-pastel-yellow text-pastel-yellow-ink" },
    { line: "What you’re into", icon: <NavGlyph name="explore" />, tone: "bg-pastel-green text-pastel-green-ink" },
  ];
  return (
    <div className="grid justify-items-center gap-3 pt-2 text-center">
      <span className="grid size-[72px] place-items-center rounded-md bg-pen-soft text-pen">
        <FlocMark className="h-8 w-10" />
      </span>
      <h2 className="text-xl">Welcome to <FlocWord /></h2>
      <p className="max-w-[30ch] text-sm text-ink-soft">{invited ? `You are on ${invited}. Three quick questions first.` : "Three quick questions, then you are in."}</p>
      <ol className="mt-1 grid w-full max-w-[17rem] gap-2.5">
        {ahead.map(({ line, icon, tone }) => (
          <li key={line} className="flex items-center gap-3 text-left text-sm text-ink">
            <span className={`grid size-[30px] shrink-0 place-items-center rounded-sm ${tone}`}>{icon}</span>
            {line}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WhereFirst({ me, invited, onStart, onExplore, onOpen, beforeLink }: {
  me: string;
  invited: string | null;
  onStart: (name: string) => void;
  onExplore: () => void;
  onOpen: () => void;
  beforeLink: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [pasting, setPasting] = useState(false);
  return (
    <div className="grid gap-3">
      <h2 className="text-center text-lg">Where to first?</h2>
      <form
        className="grid gap-2.5 rounded-md bg-pen-soft p-4 ring-[1.5px] ring-pen/60"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(name.trim());
        }}
      >
        <div className="grid gap-1.5">
          <label htmlFor="welcome-trip-name" className="typed text-pen-deep">{invited ? "Name a trip of your own" : "Name your first trip"}</label>
          <span className="flex gap-2">
            <Input id="welcome-trip-name" value={name} maxLength={TEXT_CAPS.tripName} autoComplete="off" onChange={(event) => setName(event.target.value)} />
            <Button type="submit" variant="primary">Start</Button>
          </span>
        </div>
        <span className="flex items-center gap-1 text-sm text-ink-soft">
          <span className="inline-flex rounded-sm bg-sheet p-0.5"><Avatar name={me} size={22} /></span>
          <span className="grid size-[22px] place-items-center rounded-sm border border-dashed border-pen/50 text-pen"><PlusIcon size={10} /></span>
          <span className="grid size-[22px] place-items-center rounded-sm border border-dashed border-pen/50 text-pen"><PlusIcon size={10} /></span>
          <span className="ml-1.5">Invite people next</span>
        </span>
      </form>
      <div className="overflow-hidden rounded-md border border-rule">
        {invited ? (
          <DoorRow icon={<NavGlyph name="trips" />} tile="grid size-[30px] shrink-0 place-items-center rounded-sm bg-pastel-green text-pastel-green-ink" label={`Open ${invited}`} hint="The trip you were asked on" onPress={onOpen} />
        ) : (
          <>
            <DoorRow icon={<LinkIcon />} label="Got a link?" hint="Paste an invite and you are on the trip" onPress={() => setPasting(!pasting)} open={pasting} />
            {pasting ? <div className="px-3.5 pb-3.5"><LinkPaste before={beforeLink} /></div> : null}
          </>
        )}
      </div>
      <button type="button" onClick={onExplore} className="flex items-center gap-2.5 border-t border-rule pt-3 text-left text-sm text-ink-soft transition-colors hover:text-pen-deep">
        <NavGlyph name="explore" />
        <span className="flex-1">Not sure where yet? <span className="font-medium text-pen">Browse Explore</span></span>
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}
