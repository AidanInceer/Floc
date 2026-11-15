import type { Currency } from "@floc/core/money/currency";
import { CABIN_LABELS, CABINS, PACE_LABELS, PACES, STAY_LABELS, STAY_STYLES, type TravelStyle } from "@floc/core/money/estimate/style";
import { airportName } from "@floc/core/money/estimate/guide/home-airport";
import { toMajorInput } from "@floc/core/money/money";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Field, Label, Segmented } from "@/components/system/ui";
import { space } from "@/lib/theme";

import { AirportPicker } from "./airport-picker";

const start = (minor: number | null, currency: Currency) => (minor == null ? "" : toMajorInput(minor, currency));

export function LineForm({ figure, budget, currency, guide, busy, onSave }: { figure: number | null; budget: number | null; currency: Currency; guide: string; busy: boolean; onSave: (figure: string, budget: string) => void }) {
  const [own, setOwn] = useState(start(figure, currency));
  const [cap, setCap] = useState(start(budget, currency));
  return (
    <View style={{ gap: space.md }}>
      <Body tone="ink-2">Floc's guide: {guide}</Body>
      <Field label={`Your figure, ${currency}`} value={own} onChangeText={setOwn} keyboardType="decimal-pad" autoCorrect={false} />
      <Field label={`Budget for this line, ${currency}`} value={cap} onChangeText={setCap} keyboardType="decimal-pad" autoCorrect={false} />
      <Button label="Save" busy={busy} onPress={() => onSave(own, cap)} />
    </View>
  );
}

export function AmountForm({ initial, currency, label, hint, busy, onSave }: { initial: number | null; currency: Currency; label: string; hint: string; busy: boolean; onSave: (raw: string) => void }) {
  const [raw, setRaw] = useState(start(initial, currency));
  return (
    <View style={{ gap: space.md }}>
      <Body tone="ink-2">{hint}</Body>
      <Field label={label} value={raw} onChangeText={setRaw} keyboardType="decimal-pad" autoCorrect={false} />
      <Button label="Save" busy={busy} onPress={() => onSave(raw)} />
    </View>
  );
}

/** How you travel on this trip only (#574): a change here never moves your profile's default. */
export function StyleForm({ style, busy, onSave, onReset }: { style: TravelStyle & { tripOnly: boolean }; busy: boolean; onSave: (s: TravelStyle & { tripOnly: boolean }) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(style);
  return (
    <View style={{ gap: space.md }}>
      <Label>Cabin</Label>
      <Segmented soft options={CABINS.map((v) => ({ value: v, label: CABIN_LABELS[v] }))} value={draft.cabin} onChange={(cabin) => setDraft({ ...draft, cabin })} />
      <Label>Stay</Label>
      <Segmented soft options={STAY_STYLES.map((v) => ({ value: v, label: STAY_LABELS[v] }))} value={draft.stay} onChange={(stay) => setDraft({ ...draft, stay })} />
      <Label>Pace</Label>
      <Segmented soft options={PACES.map((v) => ({ value: v, label: PACE_LABELS[v] }))} value={draft.pace} onChange={(pace) => setDraft({ ...draft, pace })} />
      <Body tone="ink-2">{style.tripOnly ? "Set for this trip only." : "From your profile."}</Body>
      <Button label="Use for this trip" busy={busy} onPress={() => onSave(draft)} />
      {style.tripOnly ? <Button label="Use my profile" variant="quiet" onPress={onReset} /> : null}
    </View>
  );
}

export function NightsForm({ initial, busy, onSave }: { initial: number; busy: boolean; onSave: (n: number) => void }) {
  const [raw, setRaw] = useState("");
  return (
    <View style={{ gap: space.md }}>
      <Body tone="ink-2">Now {initial}.</Body>
      <Field label="Nights" value={raw} onChangeText={setRaw} keyboardType="number-pad" />
      <Button label="Save nights" busy={busy} onPress={() => onSave(Number(raw))} />
    </View>
  );
}

/** A guess from your flight files is offered as a Confirm, never typed into the field for you. */
export function AirportForm({ initial, suggested, busy, onSave }: { initial: string | null; suggested: string | null; busy: boolean; onSave: (code: string | null) => void }) {
  return (
    <View style={{ gap: space.md }}>
      {suggested ? <Body tone="ink-2">We think you fly from {airportName(suggested)} ({suggested}).</Body> : null}
      {suggested ? <Button label="Confirm" variant="quiet" fit="small" busy={busy} onPress={() => onSave(suggested)} /> : null}
      <Body tone="ink-2">Kept on your profile.</Body>
      <AirportPicker code={initial} busy={busy} onPick={onSave} />
    </View>
  );
}
