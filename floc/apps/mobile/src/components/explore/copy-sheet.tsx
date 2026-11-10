/**
 * "Start this trip" on the phone (ADR-025): the web's copy sheet, from the foot of the screen. Do you have dates
 * yet, then when, then what else comes across. The write is the caller's — this only gathers the answer.
 */
import { monthOf, thisMonth } from "@floc/core/dates/availability";
import { today, type IsoDate } from "@floc/core/dates/dates";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import { copySteps, stepBack, stepOn, type CopyStep, type HasDates } from "@floc/core/trip/explore/copy/copy-steps";
import { startMonths } from "@floc/core/trip/explore/copy/start-months";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";
import { Text, View } from "react-native";

import { AskStep } from "./copy/ask-step";
import { ExtrasStep } from "./copy/extras-step";
import { UndatedStep } from "./copy/undated-step";
import { WhenStep } from "./copy/when-step";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Body, Button, Heading } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

function StepBar({ at, of }: { at: number; of: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: i <= at ? c.pen : c["rule-2"] }} />
      ))}
      <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>
        {at + 1} of {of}
      </Text>
    </View>
  );
}

export function CopySheet({
  trip,
  open,
  busy,
  error,
  onClose,
  onStart,
}: {
  trip: PresetTrip;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onStart: (choice: CopyChoice) => void;
}) {
  const months = startMonths(trip, today());
  const [has, setHas] = useState<HasDates>(null);
  const [step, setStep] = useState<CopyStep>("ask");
  const [start, setStart] = useState<IsoDate | null>(null);
  const [month, setMonth] = useState(months[0] ? monthOf(months[0].startDate) : thisMonth());
  const [ideas, setIdeas] = useState(true);
  const [events, setEvents] = useState(true);
  const steps = copySteps(has);
  const back = () => setStep(stepBack(step, has));
  const go = () => onStart({ presetId: trip.id, month: null, startDate: has ? start : null, ideas, events });

  const main =
    step === "when" ? (
      <Button label="Next" fit="small" disabled={!start} onPress={() => setStep("extras")} />
    ) : (
      <Button label="Start trip" fit="small" busy={busy} onPress={go} />
    );
  const footer =
    step === "ask" ? null : (
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md }}>
        <Button label="Back" variant="quiet" fit="small" onPress={back} />
        {main}
      </View>
    );

  return (
    <Sheet open={open} onClose={onClose} footer={footer}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <Heading>Start this trip</Heading>
        <StepBar at={steps.indexOf(step)} of={steps.length} />
        {step === "ask" ? <AskStep nights={trip.nights} onAnswer={(yes) => { setHas(yes); setStep(stepOn("ask", yes)); }} /> : null}
        {step === "when" ? <WhenStep months={months} nights={trip.nights} start={start} month={month} onStart={setStart} onMonth={setMonth} /> : null}
        {step === "extras" && start ? (
          <ExtrasStep start={start} nights={trip.nights} ideas={ideas} events={events} onIdeas={setIdeas} onEvents={setEvents} onChange={back} />
        ) : null}
        {step === "undated" ? <UndatedStep highlights={trip.highlights} /> : null}
        {error ? <Body tone="red">{error}</Body> : null}
      </View>
    </Sheet>
  );
}
