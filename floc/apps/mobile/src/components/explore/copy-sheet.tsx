import { monthOf, thisMonth } from "@floc/core/dates/availability";
import { addDays, formatDateRange, today, type IsoDate } from "@floc/core/dates/dates";
import { toggleTripPeople, type TripPeopleSelection } from "@floc/core/people/group-ticks";
import { countWord } from "@floc/core/text/count-word";
import { TEXT_CAPS } from "@floc/core/text/text";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import { startMonths } from "@floc/core/trip/explore/copy/start-months";
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { startDots, startSteps, type StartStep } from "@floc/core/trip/start/start-steps";
import { useState } from "react";
import { View } from "react-native";

import { WhenStep } from "./copy/when-step";
import { AskRow, StepFooter, StepTitle, SummaryRows } from "../onboarding/start-parts";
import { TripPeoplePicker } from "../social/trip-people-picker";
import { Sheet } from "../system/sheet";
import { Body, Button, Field } from "../system/ui";
import { space } from "@/lib/theme";

export type StartChoice = CopyChoice & { friendIds: string[] };

export function CopySheet({ trip, open, busy, error, onClose, onStart }: {
  trip: PresetTrip;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onStart: (choice: StartChoice) => void;
}) {
  const months = startMonths(trip, today());
  const [dates, setDates] = useState<boolean | null>(null);
  const [start, setStart] = useState<IsoDate | null>(null);
  const [month, setMonth] = useState(months[0] ? monthOf(months[0].startDate) : thisMonth());
  const [selection, setSelection] = useState<TripPeopleSelection>(() => ({ ticked: new Set(), groups: new Set() }));
  const [name, setName] = useState(trip.title);
  const [at, setAt] = useState(0);
  const steps = startSteps({ fromListing: true, where: null, dates });
  const i = Math.min(at, steps.length - 1);
  const step = steps[i] as StartStep;
  const stops = stopsOf(trip).map((s) => s.place);
  const answerDates = (value: boolean | null) => {
    setDates(value);
    if (value !== true) setStart(null);
  };
  const go = () =>
    onStart({ presetId: trip.id, month: null, startDate: dates ? start : null, ideas: true, events: true, name: name.trim(), friendIds: [...selection.ticked] });

  const body: Partial<Record<StartStep, () => React.ReactNode>> = {
    ask: () => (
      <>
        <StepTitle title={`Start ${trip.title}`} sub={`${countWord(trip.nights, "night")}, ${countWord(stops.length, "stop")}.`} />
        <SummaryRows rows={[["Where", stops.join(", ")]]} />
        <AskRow question="Do you have dates?" value={dates} onAnswer={answerDates} />
      </>
    ),
    dates: () => (
      <>
        <StepTitle title="When do you go?" sub={start ? countWord(trip.nights, "night") : `Pick a start day. The ${countWord(trip.nights, "night")} follow.`} />
        <WhenStep months={months} nights={trip.nights} start={start} month={month} onStart={setStart} onMonth={setMonth} />
        <View style={{ alignItems: "center" }}><Button label="No dates yet" variant="quiet" fit="small" onPress={() => answerDates(false)} /></View>
      </>
    ),
    who: () => (
      <>
        <StepTitle title="Who’s coming?" sub="Anyone else joins on the trip’s invite link." />
        <TripPeoplePicker ticked={selection.ticked} onToggle={(ids, groupId) => setSelection((now) => toggleTripPeople(now, ids, groupId))} />
      </>
    ),
    name: () => (
      <>
        <StepTitle title="Choose a name for the trip" />
        <SummaryRows
          rows={[
            ["Where", stops.join(", ")],
            ["When", start ? formatDateRange(start, addDays(start, trip.nights)) : "Not decided yet"],
            ["Who", selection.ticked.size ? `You and ${countWord(selection.ticked.size, "other")}` : "Just you for now"],
          ]}
        />
        <Field label="Name" value={name} onChangeText={setName} maxLength={TEXT_CAPS.tripName} />
        {error ? <Body tone="red">{error}</Body> : null}
      </>
    ),
  };

  const last = i === steps.length - 1;
  const footer = (
    <StepFooter
      left={<Button label={i === 0 ? "Cancel" : "Back"} variant="quiet" fit="small" onPress={() => (i === 0 ? onClose() : setAt(i - 1))} />}
      dots={startDots(steps, i)}
      right={last ? <Button label="Create trip" fit="small" busy={busy} disabled={!name.trim()} onPress={go} /> : <Button label="Next" fit="small" onPress={() => setAt(i + 1)} />}
    />
  );

  return (
    <Sheet open={open} onClose={onClose} footer={footer}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>{body[step]?.()}</View>
    </Sheet>
  );
}
