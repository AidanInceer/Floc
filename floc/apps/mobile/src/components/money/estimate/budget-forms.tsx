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

export function StyleForm({ style, flying, busy, onSave, onReset }: { style: TravelStyle & { tripOnly: boolean }; flying: boolean; busy: boolean; onSave: (s: TravelStyle & { tripOnly: boolean }) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(style);
  return (
    <View style={{ gap: space.md }}>
      {flying ? <Label>Cabin</Label> : null}
      {flying ? <Segmented soft options={CABINS.map((v) => ({ value: v, label: CABIN_LABELS[v] }))} value={draft.cabin} onChange={(cabin) => setDraft({ ...draft, cabin })} /> : null}
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
