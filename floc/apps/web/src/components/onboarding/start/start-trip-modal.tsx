"use client";

import { useState } from "react";
import { thisMonth, type IsoMonth } from "@floc/core/dates/availability";
import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import { countWord } from "@floc/core/text/count-word";
import { pickRange, type DateRange } from "@floc/core/trip/start/pick-range";
import { startDots, startSteps, type StartStep } from "@floc/core/trip/start/start-steps";

import { createTrip } from "@/app/trips/actions";
import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { GroupIcon } from "@/components/system/icons/account";
import { NavGlyph } from "@/components/system/icons/nav";
import { PinIcon } from "@/components/system/icons/onboarding";
import { Button } from "@/components/system/ui";
import { StepFoot } from "../step-dots";
import { StepHead } from "../step-head";
import { StepModal } from "../step-modal";
import { StartAsk } from "./start-ask";
import { StartDates } from "./start-dates";
import { StartName } from "./start-name";
import { StartPlaces } from "./start-places";
import { StartWho, type StartPerson } from "./start-who";

export type StartListing = { id: string; title: string; nights: number; stops: string[] };
export type StartSeed = { name?: string; along?: string[] };

function whenText(range: DateRange): string {
  if (!range.start) return "Not decided yet";
  const end = range.end ?? range.start;
  return `${formatDateRange(range.start, end)} · ${countWord(nightsBetween(range.start, end), "night")}`;
}

function datesSub(listing: StartListing | null, range: DateRange): string {
  if (listing) return range.start ? countWord(listing.nights, "night") : `Pick a start day. The ${countWord(listing.nights, "night")} follow.`;
  if (range.start && range.end) return countWord(nightsBetween(range.start, range.end), "night");
  return range.start ? "Now pick the last day." : "Pick the first day, then the last.";
}

function Hidden({ listing, name, range, picked, places }: { listing: StartListing | null; name: string; range: DateRange; picked: string[]; places: string[] }) {
  return (
    <>
      {listing ? (
        <>
          <input type="hidden" name="presetId" value={listing.id} />
          <input type="hidden" name="ideas" value="on" />
          <input type="hidden" name="events" value="on" />
          {range.start ? <input type="hidden" name="start" value={range.start} /> : null}
        </>
      ) : (
        <>
          <input type="hidden" name="startDate" value={range.start ?? ""} />
          <input type="hidden" name="endDate" value={range.end ?? ""} />
          {places.map((p) => <input key={p} type="hidden" name="places" value={p} />)}
        </>
      )}
      {picked.map((id) => <input key={id} type="hidden" name="friendIds" value={id} />)}
      <input type="hidden" name="name" value={name} />
    </>
  );
}

export function StartTripModal({ open, onClose, me, people, seed = {}, listing = null }: {
  open: boolean;
  onClose: () => void;
  me: string;
  people: StartPerson[];
  seed?: StartSeed;
  listing?: StartListing | null;
}) {
  const [where, setWhere] = useState<boolean | null>(null);
  const [dates, setDates] = useState<boolean | null>(null);
  const [places, setPlaces] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [month, setMonth] = useState<IsoMonth>(thisMonth());
  const [picked, setPicked] = useState<string[]>(seed.along ?? []);
  const [name, setName] = useState(seed.name ?? listing?.title ?? "");
  const [at, setAt] = useState(0);

  const steps = startSteps({ fromListing: listing !== null, where, dates });
  const i = Math.min(at, steps.length - 1);
  const step: StartStep = steps[i];
  const answerDates = (value: boolean | null) => {
    setDates(value);
    if (value !== true) setRange({ start: null, end: null });
  };
  const who = [me, ...people.filter((p) => picked.includes(p.id)).map((p) => p.name)];
  const whereText = listing ? listing.stops.join(", ") : places.length ? places.join(", ") : "Not decided yet";

  const body: Record<StartStep, () => React.ReactNode> = {
    ask: () => (
      <>
        <StepHead title={listing ? `Start ${listing.title}` : "Start a trip"} sub={listing ? `${countWord(listing.nights, "night")}, ${countWord(listing.stops.length, "stop")}.` : "Two quick questions, then only what you need."} />
        <StartAsk listing={listing} where={where} dates={dates} onWhere={setWhere} onDates={answerDates} />
      </>
    ),
    where: () => (
      <>
        <StepHead title="Where to?" sub="One place, or a few in order." tile={<PinIcon size={20} />} tone="blue" />
        <StartPlaces places={places} onChange={setPlaces} />
      </>
    ),
    dates: () => (
      <>
        <StepHead title="When do you go?" sub={datesSub(listing, range)} tile={<NavGlyph name="dates" />} tone="yellow" />
        <StartDates nights={listing?.nights ?? null} month={month} start={range.start} end={range.end} onMonth={setMonth} onPick={(d) => setRange(pickRange(range, d, listing?.nights))} onNone={() => answerDates(false)} />
      </>
    ),
    who: () => (
      <>
        <StepHead title="Who’s coming?" tile={<GroupIcon />} />
        <StartWho me={me} people={people} picked={picked} onToggle={(id) => setPicked(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id])} />
      </>
    ),
    name: () => (
      <>
        <StepHead title="Choose a name for the trip" />
        <StartName name={name} onName={setName} where={whereText} when={whenText(range)} who={who} />
      </>
    ),
  };

  const last = i === steps.length - 1;
  return (
    <StepModal
      open={open}
      label={listing ? `Start ${listing.title}` : "Start a trip"}
      onClose={onClose}
      action={listing ? startTripFromPreset : createTrip}
      footer={
        <StepFoot
          left={<Button type="button" variant="ghost" onClick={() => (i === 0 ? onClose() : setAt(i - 1))}>{i === 0 ? "Cancel" : "Back"}</Button>}
          dots={startDots(steps, i)}
          right={last ? <SubmitButton disabled={!name.trim()}>Create trip</SubmitButton> : <Button type="button" variant="primary" onClick={() => setAt(i + 1)}>Next</Button>}
        />
      }
    >
      <Hidden listing={listing} name={name} range={range} picked={picked} places={places} />
      <div key={step} className="step-in">{body[step]()}</div>
    </StepModal>
  );
}
